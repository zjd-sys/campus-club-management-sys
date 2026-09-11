package com.campus.club.dto;

import lombok.Data;

@Data
public class LoginResult {
    private String token;
    private String role;
    private String name;
    private Long userId;
    private String username;
    /** 管理员层级：super / normal（非管理员为 null），前端据此收敛菜单与操作入口 */
    private String adminLevel;
}
