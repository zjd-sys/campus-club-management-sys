package com.campus.club.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String name;
    private Integer age;
    private String gender;
    private Long gradeId;
    private Long clazzId;
}
