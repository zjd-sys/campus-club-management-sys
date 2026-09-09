package com.campus.club.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/** 社团成员关联表：学生与社团多对一绑定 */
@Data
@TableName("club_member")
public class ClubMember {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long clubId;
    private Long userId;
    /** 成员身份：normal / leader */
    private String identity;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime joinTime;
    @TableLogic
    private Integer deleted;
}
