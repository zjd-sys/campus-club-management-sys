package com.campus.club.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    /** 跨域白名单：默认 *，生产用 APP_CORS_ALLOWED_ORIGINS 收紧 */
    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:*}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOriginPatterns(List.of(allowedOrigins.split(",")));
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(List.of("*"));
        c.setAllowCredentials(true);
        c.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", c);
        return src;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/portal/auth/login", "/api/portal/auth/register", "/api/portal/captcha/**").permitAll()
                // 站点品牌配置（系统名称/Logo/背景图）：公开读取
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/portal/site-config").permitAll()
                .requestMatchers("/api/admin/auth/login").permitAll()
                .requestMatchers("/files/**", "/h2-console/**", "/error").permitAll()
                // 管理员组管理（增删管理员 / 设置层级 / 启停 / 重置他人令牌）：仅超级管理员
                // 普通管理员访问此处直接 403；自身令牌修改走 /api/admin/me/token（普通管理员可用）
                .requestMatchers("/api/admin/admins", "/api/admin/admins/**")
                .hasAuthority(JwtUtil.AUTHORITY_SUPER_ADMIN)
                // 系统级配置与全局文件资源：同样仅超级管理员（与前端菜单收敛保持一致）
                .requestMatchers("/api/admin/settings", "/api/admin/settings/**",
                        "/api/admin/files", "/api/admin/files/**")
                .hasAuthority(JwtUtil.AUTHORITY_SUPER_ADMIN)
                // 管理端：仅 admin 角色令牌可访问，师生令牌直接 403
                .requestMatchers("/api/admin/**").hasAuthority("ROLE_admin")
                // 门户端公开浏览区（无需登录）：社团列表 / 详情 / 过程性内容 / 课程资源
                // 注意：/clubs/joined 需登录，必须排在 /clubs/{id} 之前，否则会被通配规则放行
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/portal/clubs/joined").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/portal/clubs").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/portal/clubs/{id}").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/portal/clubs/{id}/materials").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/portal/clubs/{id}/resources").permitAll()
                // 页面访问统计：公开上报，无需登录
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/portal/visit").permitAll()
                // 门户端其余接口（含提交材料、成员管理、个人中心、自助加入等）：student/teacher/admin 均可，内部再细粒度控制
                .requestMatchers("/api/portal/**").authenticated()
                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions(fo -> fo.disable())) // 允许 h2-console
            // 未携带/携带无效令牌访问受保护接口时返回 401（而非默认 403），便于前端识别登录态失效
            .exceptionHandling(ex -> ex.authenticationEntryPoint(
                    (request, response, authException) ->
                            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "未登录或登录已失效"))
                    // 已登录但权限不足（如普通管理员访问管理员组管理接口）：返回带业务码的 403 JSON
                    .accessDeniedHandler((request, response, deniedException) -> {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"code\":403,\"msg\":\"无权访问该接口：仅超级管理员可管理管理员组\",\"data\":null}");
                    }))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
