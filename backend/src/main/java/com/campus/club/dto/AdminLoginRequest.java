package com.campus.club.dto;

import lombok.Data;

@Data
public class AdminLoginRequest {
    private String username;
    private String password;
    /** 管理员密钥（双重验证） */
    private String adminSecret;
}
