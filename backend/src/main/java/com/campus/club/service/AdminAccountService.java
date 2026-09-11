package com.campus.club.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.campus.club.common.BizException;
import com.campus.club.dto.UserVO;
import com.campus.club.entity.User;
import com.campus.club.mapper.UserMapper;
import com.campus.club.security.JwtUtil;
import com.campus.club.security.SecurityProps;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 管理员组管理（超级管理员专属）+ 个人令牌自助修改。
 *
 * <h3>权限模型</h3>
 * <ul>
 *   <li><b>超级管理员</b>（admin_level = super）：可管理整个管理员组——新增管理员、
 *       删除管理员、设置层级（提拔/降级）、启用/禁用、重置他人登录令牌；</li>
 *   <li><b>普通管理员</b>（admin_level = normal）：<b>不可</b>查看或管理任何其他管理员
 *       （互相之间也不可），仅能通过 {@code PUT /api/admin/me/token} 修改自身令牌。</li>
 * </ul>
 * 除接口层（SecurityConfig 限定 {@code ROLE_SUPER_ADMIN}）外，本服务在每次操作前
 * 都会<b>回库校验</b>操作者当前层级，保证超管被降级后其旧令牌立即失效。
 *
 * <p>令牌以 BCrypt 密文入库，仅在生成时以明文返回一次，之后不可再查询。</p>
 */
@Service
public class AdminAccountService {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserMapper userMapper;
    private final PasswordEncoder encoder;
    private final SecurityProps props;
    private final UserAccountRegistrar registrar;

    public AdminAccountService(UserMapper userMapper, PasswordEncoder encoder, SecurityProps props,
                               UserAccountRegistrar registrar) {
        this.userMapper = userMapper;
        this.encoder = encoder;
        this.props = props;
        this.registrar = registrar;
    }

    // ===================== 层级判定 =====================

    /**
     * 是否为超级管理员。
     * 历史数据 admin_level 为空时按超管兼容处理（升级前所有管理员权限相同，避免老库无人可管）。
     */
    public boolean isSuper(User u) {
        if (u == null || !"admin".equals(u.getRole())) return false;
        String level = u.getAdminLevel();
        return level == null || level.isBlank() || JwtUtil.LEVEL_SUPER.equals(level);
    }

    /** 当前登录管理员是否为超管（供控制层/前端做入口收敛） */
    public boolean isSuperAdmin(Long uid) {
        return isSuper(userMapper.selectById(uid));
    }

    /** 仅超级管理员可通过：非超管（含普通管理员）一律拒绝 */
    private User requireSuper(Long operatorId) {
        User op = operatorId == null ? null : userMapper.selectById(operatorId);
        if (op == null || !"admin".equals(op.getRole())) {
            throw new BizException(403, "无权操作：需要管理员身份");
        }
        if (!isSuper(op)) {
            throw new BizException(403, "无权操作：仅超级管理员可以管理管理员组");
        }
        return op;
    }

    // ===================== 管理员组管理（超管专属） =====================

    /** 全部管理员账号（不含任何密钥） */
    public List<UserVO> listAdmins(Long operatorId) {
        requireSuper(operatorId);
        return userMapper.selectList(new LambdaQueryWrapper<User>()
                        .eq(User::getRole, "admin")
                        .orderByAsc(User::getId))
                .stream().map(u -> {
                    UserVO v = UserVO.from(u);
                    // 兼容历史数据：空层级视为超级管理员，前端展示与后端判定保持一致
                    v.setAdminLevel(isSuper(u) ? JwtUtil.LEVEL_SUPER : JwtUtil.LEVEL_NORMAL);
                    return v;
                }).collect(Collectors.toList());
    }

    /**
     * 创建管理员账号并生成管理员令牌（仅超级管理员）。
     *
     * @param level  层级：super / normal，缺省 normal
     * @param secret 可自定义令牌；为空则自动生成
     * @return 账号信息 + 明文令牌（仅此一次返回）
     */
    public Map<String, Object> createAdmin(Long operatorId, String username, String password,
                                           String name, String secret, String level) {
        requireSuper(operatorId);
        if (username == null || username.isBlank() || password == null || password.length() < 6) {
            throw new BizException("账号必填，密码至少 6 位");
        }
        String lv = normalizeLevel(level);
        String token = (secret == null || secret.isBlank()) ? randomSecret() : secret.trim();
        if (token.length() < 6) {
            throw new BizException("管理员令牌至少 6 位");
        }
        User u = new User();
        u.setUsername(username);
        u.setPassword(encoder.encode(password));
        u.setName(name == null || name.isBlank() ? username : name);
        u.setRole("admin");
        u.setAdminLevel(lv);
        u.setStatus("normal");
        u.setAdminSecret(encoder.encode(token));
        u.setFailCount(0);
        u.setVersion(0);
        // 统一落库：同名管理员曾被删除时原地复活，避免用户名唯一索引冲突
        registrar.persist(u);

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("id", u.getId());
        r.put("username", u.getUsername());
        r.put("name", u.getName());
        r.put("adminLevel", lv);
        r.put("adminSecret", token); // 仅创建时返回一次
        return r;
    }

    /** 重置指定管理员的令牌（超管专属，且不能重置自己——自身走「修改我的令牌」） */
    public Map<String, Object> resetToken(Long operatorId, Long id) {
        requireSuper(operatorId);
        if (operatorId.equals(id)) {
            throw new BizException("不能在此重置自己的令牌，请使用「修改我的令牌」（需校验当前令牌）");
        }
        User u = requireAdmin(id);
        String token = randomSecret();
        u.setAdminSecret(encoder.encode(token));
        userMapper.updateById(u);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("id", u.getId());
        r.put("username", u.getUsername());
        r.put("adminSecret", token);
        return r;
    }

    /** 设置管理员层级（提拔为超管 / 降为普通管理员） */
    public void updateLevel(Long operatorId, Long id, String level) {
        requireSuper(operatorId);
        if (operatorId.equals(id)) {
            throw new BizException("不能修改自己的层级，请由其他超级管理员操作");
        }
        User u = requireAdmin(id);
        String lv = normalizeLevel(level);
        if (JwtUtil.LEVEL_NORMAL.equals(lv) && isSuper(u)) {
            requireNotLastSuper(id, "系统至少需保留一名可用的超级管理员，无法降级最后一名超管");
        }
        u.setAdminLevel(lv);
        userMapper.updateById(u);
    }

    /** 启用 / 禁用管理员账号（禁用后无法登录，令牌立即失效） */
    public void updateStatus(Long operatorId, Long id, String status) {
        requireSuper(operatorId);
        if (operatorId.equals(id)) {
            throw new BizException("不能禁用或启用自己的账号");
        }
        if (!"normal".equals(status) && !"disabled".equals(status)) {
            throw new BizException("状态取值不合法（normal / disabled）");
        }
        User u = requireAdmin(id);
        if ("disabled".equals(status) && isSuper(u) && "normal".equals(u.getStatus())) {
            requireNotLastSuper(id, "系统至少需保留一名可用的超级管理员，无法禁用最后一名超管");
        }
        u.setStatus(status);
        userMapper.updateById(u);
    }

    /** 删除管理员账号（逻辑删除；不能删除自己，也不能删掉最后一名超管） */
    public void deleteAdmin(Long operatorId, Long id) {
        requireSuper(operatorId);
        if (operatorId.equals(id)) {
            throw new BizException("不能删除自己的账号");
        }
        User u = requireAdmin(id);
        if (isSuper(u)) {
            requireNotLastSuper(id, "系统至少需保留一名超级管理员，无法删除最后一名超管");
        }
        userMapper.deleteById(id);
    }

    // ===================== 个人令牌自助修改（所有管理员可用） =====================

    /** 修改自身管理员令牌：需校验旧令牌 */
    public void changeOwnSecret(Long uid, String oldSecret, String newSecret) {
        if (newSecret == null || newSecret.length() < 6) {
            throw new BizException("新令牌至少 6 位");
        }
        User u = requireAdmin(uid);
        if (!verify(u, oldSecret)) {
            throw new BizException("当前令牌不正确");
        }
        u.setAdminSecret(encoder.encode(newSecret));
        userMapper.updateById(u);
    }

    /** 当前登录管理员的公开信息（不含密钥），用于前端展示层级与收敛菜单 */
    public Map<String, Object> me(Long uid) {
        User u = requireAdmin(uid);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("id", u.getId());
        r.put("username", u.getUsername());
        r.put("name", u.getName());
        r.put("role", u.getRole());
        r.put("adminLevel", isSuper(u) ? JwtUtil.LEVEL_SUPER : JwtUtil.LEVEL_NORMAL);
        r.put("isSuper", isSuper(u));
        r.put("hasOwnSecret", u.getAdminSecret() != null && !u.getAdminSecret().isBlank());
        return r;
    }

    // ===================== 登录校验 =====================

    /** 校验管理员令牌：优先比对本账号密文，未设置时回落到全局配置 */
    public boolean verify(User u, String raw) {
        if (raw == null) return false;
        if (u.getAdminSecret() != null && !u.getAdminSecret().isBlank()) {
            return encoder.matches(raw, u.getAdminSecret());
        }
        return raw.equals(props.adminSecret);
    }

    // ===================== 内部工具 =====================

    /** 层级标准化：非 super 一律归为 normal */
    private String normalizeLevel(String level) {
        return JwtUtil.LEVEL_SUPER.equalsIgnoreCase(level == null ? "" : level.trim())
                ? JwtUtil.LEVEL_SUPER : JwtUtil.LEVEL_NORMAL;
    }

    /** 校验系统内仍存在其他可用超管；否则拒绝本次“削弱超管”的操作 */
    private void requireNotLastSuper(Long targetId, String message) {
        Long others = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getRole, "admin")
                .eq(User::getStatus, "normal")
                .ne(User::getId, targetId)
                .and(w -> w.eq(User::getAdminLevel, JwtUtil.LEVEL_SUPER)
                        .or().isNull(User::getAdminLevel)
                        .or().eq(User::getAdminLevel, "")));
        if (others == null || others <= 0) {
            throw new BizException(message);
        }
    }

    private User requireAdmin(Long id) {
        User u = id == null ? null : userMapper.selectById(id);
        if (u == null || !"admin".equals(u.getRole())) {
            throw new BizException("管理员账号不存在");
        }
        return u;
    }

    private String randomSecret() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
