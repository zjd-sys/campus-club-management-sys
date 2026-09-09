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
}
