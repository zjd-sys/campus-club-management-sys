package com.campus.club.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/** 社团信息表 */
@Data
@TableName("club")
public class Club {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String intro;
    /** 社团海报（存储访问URL，禁止大文件入库） */
    private String poster;
    /** 负责教师ID */
    private Long teacherId;
    /** 状态：active / disabled */
    private String status;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableLogic
    private Integer deleted;

    /** 非数据库字段：负责教师姓名（详情接口填充，供展示页显示） */
    @TableField(exist = false)
    private String teacherName;

    /**
     * 非数据库字段：当前登录用户是否可编辑社团介绍词。
     * 规则：管理员 / 本社团负责教师 / 本社团负责人（identity=leader 的有权限学生）。
     */
    @TableField(exist = false)
    private Boolean canEditIntro;
}
