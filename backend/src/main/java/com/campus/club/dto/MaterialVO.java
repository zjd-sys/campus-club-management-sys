package com.campus.club.dto;

import lombok.Data;

import java.time.LocalDateTime;

/** 过程性材料视图：附带提交人姓名与社团名，供论坛式列表组件复用 */
@Data
public class MaterialVO {
    private Long id;
    private Long userId;
    private String userName;
    private Long clubId;
    private String clubName;
    private String description;
    /** 多张图片逗号分隔 */
    private String imageUrl;
    private String videoUrl;
    private String docUrl;
    private LocalDateTime submitTime;
    private String reviewStatus;
    private Integer displayStatus;
}
