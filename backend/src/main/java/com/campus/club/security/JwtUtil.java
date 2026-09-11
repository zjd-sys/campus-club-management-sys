package com.campus.club.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/** JWT 工具：令牌仅携带 userId / role / 管理员层级 / 过期时间，无敏感数据 */
@Component
public class JwtUtil {

    /** 管理员层级 claim：super / normal */
    public static final String CLAIM_ADMIN_LEVEL = "adminLevel";
    /** 超级管理员在权限体系中对应的 Spring Security authority */
    public static final String AUTHORITY_SUPER_ADMIN = "ROLE_SUPER_ADMIN";
    public static final String LEVEL_SUPER = "super";
    public static final String LEVEL_NORMAL = "normal";

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expiration;

    private SecretKey key() {
        // HS256 要求密钥 >= 256bit
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT secret 长度不足 32 字节，请在环境变量 JWT_SECRET 中配置");
        }
        return Keys.hmacShaKeyFor(bytes);
    }

    public String generate(Long userId, String role) {
        return generate(userId, role, null);
    }

    /**
     * 签发令牌。
     *
     * @param adminLevel 仅 role=admin 时传入 super / normal，其余传 null
     */
    public String generate(Long userId, String role, String adminLevel) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expiration);
        var builder = Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(exp);
        if (adminLevel != null && !adminLevel.isBlank()) {
            builder.claim(CLAIM_ADMIN_LEVEL, adminLevel);
        }
        return builder.signWith(key(), SignatureAlgorithm.HS256).compact();
    }

    public Claims parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public Long getUserId(String token) {
        return Long.valueOf(parse(token).getSubject());
    }

    public String getRole(String token) {
        return parse(token).get("role", String.class);
    }
}
