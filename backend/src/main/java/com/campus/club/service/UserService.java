package com.campus.club.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.club.common.BizException;
import com.campus.club.common.PageResult;
import com.campus.club.dto.AdminUserRequest;
import com.campus.club.dto.UserVO;
import com.campus.club.entity.Clazz;
import com.campus.club.entity.Grade;
import com.campus.club.entity.User;
import com.campus.club.mapper.ClazzMapper;
import com.campus.club.mapper.GradeMapper;
import com.campus.club.mapper.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserMapper userMapper;
    private final GradeMapper gradeMapper;
    private final ClazzMapper clazzMapper;
    private final PasswordEncoder encoder;
    private final VoBuilder voBuilder;
    private final UserAccountRegistrar registrar;

    public UserService(UserMapper userMapper, GradeMapper gradeMapper, ClazzMapper clazzMapper,
                       PasswordEncoder encoder, VoBuilder voBuilder, UserAccountRegistrar registrar) {
        this.userMapper = userMapper;
        this.gradeMapper = gradeMapper;
        this.clazzMapper = clazzMapper;
        this.encoder = encoder;
        this.voBuilder = voBuilder;
        this.registrar = registrar;
    }

    public PageResult<UserVO> listUsers(long page, long size, String role, String keyword) {
        LambdaQueryWrapper<User> w = new LambdaQueryWrapper<User>().orderByDesc(User::getCreateTime);
        // 管理员账号不出现在普通用户列表中：由超级管理员在「管理员与令牌」中统一维护，
        // 普通管理员因此无法查看/管理任何管理员账号。
        w.ne(User::getRole, "admin");
        if (role != null && !role.isBlank()) w.eq(User::getRole, role);
        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.trim();
            w.and(x -> x.like(User::getUsername, kw).or().like(User::getName, kw));
        }
        IPage<User> ip = userMapper.selectPage(new Page<>(page, size), w);
        List<UserVO> list = ip.getRecords().stream().map(voBuilder::toUserVO).collect(Collectors.toList());
        return PageResult.of(list, ip.getTotal(), page, size);
    }

    public UserVO createUser(AdminUserRequest req) {
        if (req.getUsername() == null || req.getPassword() == null || req.getRole() == null) {
            throw new BizException("账号、密码、角色必填");
        }
        // 管理员账号统一在「管理员与令牌」中由超级管理员创建（需同时生成登录令牌），
        // 此处禁止通过用户管理页创建 admin，避免绕过层级与令牌体系。
        if ("admin".equals(req.getRole())) {
            throw new BizException("管理员账号请在「管理员与令牌」中创建（需由超级管理员操作并生成令牌）");
        }
        User u = new User();
        u.setUsername(req.getUsername());
        u.setPassword(encoder.encode(req.getPassword()));
        u.setName(req.getName());
        u.setRole(req.getRole());
        u.setGradeId(req.getGradeId());
        u.setClazzId(req.getClazzId());
        u.setAge(req.getAge());
        u.setGender(req.getGender());
        u.setClubId(req.getClubId());
        u.setStatus(req.getStatus() == null ? "normal" : req.getStatus());
        u.setFailCount(0);
        u.setVersion(0);
        // 统一落库：同名账号曾被删除时原地复活，避免唯一索引冲突
        registrar.persist(u);
        return voBuilder.toUserVO(u);
    }

    public UserVO updateUser(Long id, AdminUserRequest req) {
        User u = userMapper.selectById(id);
        if (u == null) throw new BizException("用户不存在");
        // 管理员账号不接受用户管理的角色改写，避免越权把普通用户提权为管理员
        if ("admin".equals(u.getRole()) || "admin".equals(req.getRole())) {
            throw new BizException("管理员账号的层级与令牌请在「管理员与令牌」中由超级管理员维护");
        }
        if (req.getName() != null) u.setName(req.getName());
        if (req.getRole() != null) u.setRole(req.getRole());
        if (req.getGradeId() != null) u.setGradeId(req.getGradeId());
        if (req.getClazzId() != null) u.setClazzId(req.getClazzId());
        if (req.getAge() != null) u.setAge(req.getAge());
        if (req.getGender() != null) u.setGender(req.getGender());
        if (req.getClubId() != null) u.setClubId(req.getClubId());
        if (req.getStatus() != null) u.setStatus(req.getStatus());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            u.setPassword(encoder.encode(req.getPassword()));
        }
        userMapper.updateById(u);
        return voBuilder.toUserVO(u);
    }

    public void deleteUser(Long id) {
        User u = userMapper.selectById(id);
        if (u != null && "admin".equals(u.getRole())) {
            throw new BizException("管理员账号请在「管理员与令牌」中删除");
        }
        userMapper.deleteById(id); // 逻辑删除
    }

    // ===================== 年级 / 班级 =====================

    public List<Grade> grades() {
        return gradeMapper.selectList(null);
    }

    public Grade createGrade(String name) {
        Grade g = new Grade(); g.setName(name); gradeMapper.insert(g); return g;
    }

    public void deleteGrade(Long id) {
        gradeMapper.deleteById(id);
    }

    public List<Clazz> clazzes(Long gradeId) {
        LambdaQueryWrapper<Clazz> w = new LambdaQueryWrapper<Clazz>();
        if (gradeId != null) w.eq(Clazz::getGradeId, gradeId);
        return clazzMapper.selectList(w);
    }

    public Clazz createClazz(Long gradeId, String name) {
        Clazz c = new Clazz(); c.setGradeId(gradeId); c.setName(name); clazzMapper.insert(c); return c;
    }

    public void deleteClazz(Long id) {
        clazzMapper.deleteById(id);
    }
}
