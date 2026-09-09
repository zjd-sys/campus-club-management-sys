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
        c.setAllowedOriginPatterns(List.of("*"));
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
                .requestMatchers("/api/admin/auth/login").permitAll()
                .requestMatchers("/files/**", "/h2-console/**", "/error").permitAll()
                // 管理端：仅 admin 角色令牌可访问，师生令牌直接 403
                .requestMatchers("/api/admin/**").hasAuthority("ROLE_admin")
                // 门户端公开浏览区（无需登录）：社团列表 / 详情 / 过程性内容 / 课程资源
                // 注意：/clubs/joined 需登录，必须排在 /clubs/{id} 之前，否则会被通配规则放行
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/portal/clubs/joined").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/portal/clubs").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/portal/clubs/{id}").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/portal/clubs/{id}/materials").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/portal/clubs/{id}/resources").permitAll()
                // 门户端其余接口（含提交材料、成员管理、个人中心等）：student/teacher/admin 均可，内部再细粒度控制
                .requestMatchers("/api/portal/**").authenticated()
                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions(fo -> fo.disable())) // 允许 h2-console
            // 未携带/携带无效令牌访问受保护接口时返回 401（而非默认 403），便于前端识别登录态失效
            .exceptionHandling(ex -> ex.authenticationEntryPoint(
                    (request, response, authException) ->
                            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "未登录或登录已失效")))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
