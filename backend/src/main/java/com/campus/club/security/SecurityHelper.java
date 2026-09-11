package com.campus.club.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** 从 SecurityContext 读取当前登录用户（由 JwtAuthFilter 注入） */
public class SecurityHelper {

    public static Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        return Long.valueOf(auth.getName());
    }

    /** 安全获取当前用户ID：未登录 / 匿名 / 非法令牌均返回 null（用于公开接口的可选用户归属） */
    public static Long getCurrentUserIdOpt() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        String name = auth.getName();
        if (name == null || "anonymousUser".equals(name)) return null;
        try {
            return Long.valueOf(name);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static String getCurrentRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        return auth.getAuthorities().stream().findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse(null);
    }

    public static boolean isAdmin() {
        return "admin".equals(getCurrentRole());
    }
}
