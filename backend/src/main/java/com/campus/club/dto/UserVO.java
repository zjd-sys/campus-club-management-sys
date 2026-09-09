package com.campus.club.dto;

import lombok.Data;

import java.time.LocalDateTime;

/** 用户安全视图对象：不含 password */
@Data
public class UserVO {
    private Long id;
    private String username;
    private String name;
    private String role;
    private Long gradeId;
    private String gradeName;
    private Long clazzId;
    private String clazzName;
    private Integer age;
    private String gender;
    private Long clubId;
    private String clubName;
    private String status;
    private LocalDateTime createTime;

    public static UserVO from(com.campus.club.entity.User u) {
        UserVO v = new UserVO();
        v.setId(u.getId());
        v.setUsername(u.getUsername());
        v.setName(u.getName());
        v.setRole(u.getRole());
        v.setGradeId(u.getGradeId());
        v.setClazzId(u.getClazzId());
        v.setAge(u.getAge());
        v.setGender(u.getGender());
        v.setClubId(u.getClubId());
        v.setStatus(u.getStatus());
        v.setCreateTime(u.getCreateTime());
        return v;
    }
}
