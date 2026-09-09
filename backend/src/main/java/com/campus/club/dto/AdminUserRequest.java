package com.campus.club.dto;

import lombok.Data;

@Data
public class AdminUserRequest {
    private String username;
    private String password;
    private String name;
    private String role;        // admin / teacher / student
    private Long gradeId;
    private Long clazzId;
    private Integer age;
    private String gender;
    private Long clubId;
    private String status;      // normal / disabled
}
