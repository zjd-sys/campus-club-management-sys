package com.campus.club.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.campus.club.common.BizException;
import com.campus.club.dto.AdminLoginRequest;
import com.campus.club.dto.LoginRequest;
import com.campus.club.dto.LoginResult;
import com.campus.club.dto.RegisterRequest;
import com.campus.club.entity.User;
import com.campus.club.mapper.UserMapper;
import com.campus.club.security.CaptchaService;
import com.campus.club.security.JwtUtil;
import com.campus.club.security.LoginGuardService;
import com.campus.club.security.SecurityProps;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final LoginGuardService loginGuard;
    private final CaptchaService captchaService;
    private final SecurityProps props;
    private final AdminAccountService adminAccountService;
    private final UserAccountRegistrar registrar;

    public AuthService(UserMapper userMapper, PasswordEncoder encoder, JwtUtil jwtUtil,
                       LoginGuardService loginGuard, CaptchaService captchaService, SecurityProps props,
                       AdminAccountService adminAccountService, UserAccountRegistrar registrar) {
        this.userMapper = userMapper;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
        this.loginGuard = loginGuard;
        this.captchaService = captchaService;
        this.props = props;
        this.adminAccountService = adminAccountService;
        this.registrar = registrar;
    }

    public LoginResult login(LoginRequest req, HttpServletRequest request) {
        String ip = clientIp(request);

        // 1) 单IP限流：超限直接拦截，不校验密码
        if (!loginGuard.allowIp(ip)) {
            throw new BizException(429, "登录请求过于频繁，请稍后再试");
        }

        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, req.getUsername()));

        // 2) 异常场景验证码校验（提供即校验，错误则延时后驳回）
        if (req.getCaptchaId() != null && !req.getCaptchaId().isBlank()) {
            if (!captchaService.validate(req.getCaptchaId(), req.getCaptchaCode())) {
                loginGuard.applyFailureDelay();
                throw new BizException("验证码错误");
            }
        }

        // 3) 模糊提示：账号不存在 / 禁用 统一报“账号或密码错误”
        if (user == null || !"normal".equals(user.getStatus())) {
            loginGuard.applyFailureDelay();
            throw new BizException("账号或密码错误");
        }

        // 4) 锁定优先校验
        if (loginGuard.isLocked(user)) {
            loginGuard.applyFailureDelay();
            throw new BizException("账号已锁定，请于 " + user.getLockUntil() + " 后重试");
        }

        // 5) 密码校验
        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            boolean lockedNow = loginGuard.onFailure(user);
            loginGuard.applyFailureDelay();
            if (lockedNow) {
                throw new BizException("密码错误次数过多，账号已锁定 " + props.lockMinutes + " 分钟");
            }
            throw new BizException("账号或密码错误");
        }

        // 6) 成功：清零失败计数，签发令牌
        loginGuard.onSuccess(user);
        String token = jwtUtil.generate(user.getId(), user.getRole(), adminLevelOf(user));
        return toResult(token, user);
    }

    /** 管理员登录：账号+密钥双重验证 */
    public LoginResult adminLogin(AdminLoginRequest req) {
        String ip = "admin:" + req.getUsername();
        if (!loginGuard.allowIp(ip)) {
            throw new BizException(429, "登录请求过于频繁，请稍后再试");
        }
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, req.getUsername()));
        // 令牌优先校验（双重验证）：每个管理员可使用各自独立令牌；
        // 账号未配置独立令牌时回落到全局密钥（兼容旧数据与首次部署）。
        boolean secretOk = (user != null && "admin".equals(user.getRole()))
                ? adminAccountService.verify(user, req.getAdminSecret())
                : (req.getAdminSecret() != null && req.getAdminSecret().equals(props.adminSecret));
        if (!secretOk) {
            loginGuard.applyFailureDelay();
            throw new BizException("管理员密钥错误");
        }
        if (user == null || !"admin".equals(user.getRole())) {
            loginGuard.applyFailureDelay();
            throw new BizException("账号或密码错误");
        }
        // 被超管禁用/删除的管理员：立即无法登录（与门户登录保持一致的模糊提示）
        if (!"normal".equals(user.getStatus())) {
            loginGuard.applyFailureDelay();
            throw new BizException("账号或密码错误");
        }
        if (loginGuard.isLocked(user)) {
            loginGuard.applyFailureDelay();
            throw new BizException("账号已锁定，请于 " + user.getLockUntil() + " 后重试");
        }
        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            loginGuard.onFailure(user);
            loginGuard.applyFailureDelay();
            throw new BizException("账号或密码错误");
        }
        loginGuard.onSuccess(user);
        String token = jwtUtil.generate(user.getId(), user.getRole(), adminLevelOf(user));
        return toResult(token, user);
    }

    public LoginResult register(RegisterRequest req) {
        // 安全约束：门户注册仅允许学生账号。教师权限由后台（管理员）分配，
        // 前端即使传入 role=teacher 也会被强制覆盖为学生，杜绝越权注册教师。
        if (req.getUsername() == null || req.getUsername().isBlank()
                || req.getPassword() == null || req.getPassword().length() < 6) {
            throw new BizException("账号或密码不合法（密码至少6位）");
        }
        Long cnt = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, req.getUsername()));
        if (cnt != null && cnt > 0) {
            throw new BizException("该账号已存在");
        }
        User u = new User();
        u.setUsername(req.getUsername());
        u.setPassword(encoder.encode(req.getPassword()));
        u.setName(req.getName());
        u.setRole("student");
        u.setGradeId(req.getGradeId());
        u.setClazzId(req.getClazzId());
        u.setAge(req.getAge());
        u.setGender(req.getGender());
        u.setStatus("normal");
        u.setFailCount(0);
        u.setVersion(0);
        // 统一落库：同名账号曾被删除时原地复活，避免用户名唯一索引冲突
        registrar.persist(u);
        // 注册后自动登录（学生）
        String token = jwtUtil.generate(u.getId(), u.getRole());
        return toResult(token, u);
    }

    public Map<String, String> genCaptcha() {
        CaptchaService.CaptchaDto dto = captchaService.generate();
        return Map.of("captchaId", dto.captchaId(), "image", "data:image/png;base64," + dto.imageBase64());
    }

    private LoginResult toResult(String token, User u) {
        LoginResult r = new LoginResult();
        r.setToken(token);
        r.setRole(u.getRole());
        r.setName(u.getName());
        r.setUserId(u.getId());
        r.setUsername(u.getUsername());
        r.setAdminLevel(adminLevelOf(u));
        return r;
    }

    /**
     * 解析账号的管理员层级：仅 role=admin 返回 super / normal，其余返回 null。
     * 历史数据 admin_level 为空时视为超管（与 AdminAccountService.isSuper 保持一致）。
     */
    private String adminLevelOf(User u) {
        if (u == null || !"admin".equals(u.getRole())) return null;
        String level = u.getAdminLevel();
        return (level == null || level.isBlank()) ? "super" : level;
    }

    private String clientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) return ip.split(",")[0].trim();
        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isBlank()) return ip.trim();
        return request.getRemoteAddr();
    }
}
