package com.campus.club.dto;

import lombok.Data;

@Data
public class LoginResult {
    private String token;
    private String role;
    private String name;
    private Long userId;
    private String username;
}
