package com.campus.club.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String name;
    /** student / teacher */
    private String role;
    private Long gradeId;
    private Long clazzId;
    private Integer age;
    private String gender;
}
