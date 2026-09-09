package com.campus.club.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/** 社团课程资源表 */
@Data
@TableName("course_resource")
public class CourseResource {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long clubId;
    private Long teacherId;
    private String title;
    private String intro;
    /** 学习链接 */
    private String link;
    /** 课程视频访问URL */
    private String videoUrl;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime publishTime;
    /** 展示状态：1 上架 / 0 下架 */
    private Integer displayStatus;
    /** 审核状态：pending / passed / removed */
    private String reviewStatus;
    @TableLogic
    private Integer deleted;
}
