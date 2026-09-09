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

    public AuthService(UserMapper userMapper, PasswordEncoder encoder, JwtUtil jwtUtil,
                       LoginGuardService loginGuard, CaptchaService captchaService, SecurityProps props) {
        this.userMapper = userMapper;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
        this.loginGuard = loginGuard;
        this.captchaService = captchaService;
        this.props = props;
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
        String token = jwtUtil.generate(user.getId(), user.getRole());
        return toResult(token, user);
    }

    /** 管理员登录：账号+密钥双重验证 */
    public LoginResult adminLogin(AdminLoginRequest req) {
        String ip = "admin:" + req.getUsername();
        if (!loginGuard.allowIp(ip)) {
            throw new BizException(429, "登录请求过于频繁，请稍后再试");
        }
        // 密钥优先校验（双重验证）
        if (req.getAdminSecret() == null || !req.getAdminSecret().equals(props.adminSecret)) {
            loginGuard.applyFailureDelay();
            throw new BizException("管理员密钥错误");
        }
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, req.getUsername()));
        if (user == null || !"admin".equals(user.getRole())) {
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
        String token = jwtUtil.generate(user.getId(), user.getRole());
        return toResult(token, user);
    }

    public LoginResult register(RegisterRequest req) {
        if (!"student".equals(req.getRole()) && !"teacher".equals(req.getRole())) {
            throw new BizException("仅支持注册学生或教师账号");
        }
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
        u.setRole(req.getRole());
        u.setGradeId(req.getGradeId());
        u.setClazzId(req.getClazzId());
        u.setAge(req.getAge());
        u.setGender(req.getGender());
        u.setStatus("normal");
        u.setFailCount(0);
        u.setVersion(0);
        u.setDeleted(0);
        userMapper.insert(u);
        // 注册后自动登录
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
        return r;
    }

    private String clientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) return ip.split(",")[0].trim();
        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isBlank()) return ip.trim();
        return request.getRemoteAddr();
    }
}
