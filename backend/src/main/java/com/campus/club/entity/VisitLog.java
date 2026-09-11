package com.campus.club.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** 页面访问日志：用于统计每日访问次数与站点日活量（DAU） */
@Data
@TableName("visit_log")
public class VisitLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String path;
    private Long userId;
    private LocalDate visitDate;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableLogic
    private Integer deleted;
}
