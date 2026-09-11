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

    /**
     * 管理员独立密钥（BCrypt 密文），仅 role=admin 使用。
     * 让每个管理员拥有各自的登录令牌，便于超管创建/重置管理员令牌；
     * 为空时回落到全局配置 jwt.admin-secret（兼容旧数据）。
     */
    private String adminSecret;

    /**
     * 管理员层级，仅 role=admin 使用：super=超级管理员 / normal=普通管理员。
     * <p>超级管理员可管理整个管理员组（新增/删除管理员、设置层级、启停、重置他人令牌）；
     * 普通管理员之间互不可管理，只能修改自身令牌。</p>
     * <p>历史数据该列为空时按「超级管理员」兼容处理（升级前所有管理员权限相同）。</p>
     */
    private String adminLevel;

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
