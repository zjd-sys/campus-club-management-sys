package com.campus.club.controller;

import com.campus.club.common.R;
import com.campus.club.dto.AdminLoginRequest;
import com.campus.club.dto.LoginRequest;
import com.campus.club.dto.RegisterRequest;
import com.campus.club.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/portal/auth/login")
    public R<?> login(@RequestBody LoginRequest req, HttpServletRequest request) {
        return R.ok(authService.login(req, request));
    }

    @PostMapping("/portal/auth/register")
    public R<?> register(@RequestBody RegisterRequest req) {
        return R.ok(authService.register(req));
    }

    @GetMapping("/portal/captcha/gen")
    public R<?> genCaptcha() {
        return R.ok(authService.genCaptcha());
    }

    /** 管理员登录：账号 + 密钥 双重验证 */
    @PostMapping("/admin/auth/login")
    public R<?> adminLogin(@RequestBody AdminLoginRequest req) {
        return R.ok(authService.adminLogin(req));
    }
}
