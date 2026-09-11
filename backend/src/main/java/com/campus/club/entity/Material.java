package com.campus.club.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/** 过程性材料表：活动文字 / 图片 / 视频 */
@Data
@TableName("material")
public class Material {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long clubId;
    /** 文字说明 */
    private String description;
    /** 图片访问URL（可多张，逗号分隔） */
    private String imageUrl;
    /** 视频访问URL */
    private String videoUrl;
    /** 文档访问URL（可多份，逗号分隔） */
    private String docUrl;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime submitTime;
    /** 前端展示状态：1 公开 / 0 隐藏 */
    private Integer displayStatus;
    /** 审核状态：pending 待审核 / passed 通过 / rejected 驳回 / removed 下架 */
    private String reviewStatus;
    @TableLogic
    private Integer deleted;
}
