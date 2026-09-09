package com.campus.club.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/** 用户信息表：学生 / 教师 / 管理员 统一存储 */
@Data
@TableName("sys_user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 登录账号（唯一索引，防并发重复注册） */
    private String username;

    /** BCrypt 密文，禁止明文 */
    private String password;

    /** 角色：admin / teacher / student */
    private String role;

    private String name;
    private Long gradeId;
    private Long clazzId;
    private Integer age;
    private String gender;

    /** 教师负责社团ID（学生/管理员为 null） */
    private Long clubId;

    /** 状态：normal / disabled */
    private String status;

    /** 登录安全防护字段 */
    private Integer failCount;
    private LocalDateTime lockUntil;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @Version
    private Integer version;

    @TableLogic
    private Integer deleted;
}
