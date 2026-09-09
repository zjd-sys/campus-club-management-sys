package com.campus.club.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** 登录安全防护参数（文档《用户信息安全策略》） */
@Component
public class SecurityProps {

    @Value("${security.login.fail-lock-threshold:5}")
    public int failLockThreshold;

    @Value("${security.login.lock-minutes:10}")
    public int lockMinutes;

    @Value("${security.login.fail-delay-ms:1000}")
    public long failDelayMs;

    @Value("${security.login.ip-limit-per-minute:8}")
    public int ipLimitPerMinute;

    @Value("${security.login.captcha-trigger-fail:3}")
    public int captchaTriggerFail;

    @Value("${jwt.admin-secret:admin123}")
    public String adminSecret;
}
