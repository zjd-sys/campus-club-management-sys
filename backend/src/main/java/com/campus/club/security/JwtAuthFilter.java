package com.campus.club.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/** 解析 JWT，注入 Spring Security 上下文（后端强校验，前端无法绕过） */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = jwtUtil.parse(token);
                Long uid = Long.valueOf(claims.getSubject());
                String role = claims.get("role", String.class);
                List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                // 管理员层级：仅当令牌显式声明 super 时才额外授予超管权限
                // （旧令牌不含该 claim → 需重新登录后才拥有超管能力，避免权限被回收后仍然生效）
                String adminLevel = claims.get(JwtUtil.CLAIM_ADMIN_LEVEL, String.class);
                if ("admin".equals(role) && JwtUtil.LEVEL_SUPER.equals(adminLevel)) {
                    authorities.add(new SimpleGrantedAuthority(JwtUtil.AUTHORITY_SUPER_ADMIN));
                }
                var auth = new UsernamePasswordAuthenticationToken(uid, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception e) {
                // 非法/过期令牌：清空上下文，由后续授权规则拦截
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
