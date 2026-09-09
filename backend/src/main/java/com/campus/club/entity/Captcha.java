package com.campus.club.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/** 图形验证码临时表：明文仅存库，前端只拿图片，2分钟过期 */
@Data
@TableName("captcha")
public class Captcha {
    @TableId(type = IdType.AUTO)
    private Long id;
    /** 验证码标识（前端回传用于校验） */
    private String captchaId;
    private String code;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    private LocalDateTime expireTime;
    @TableLogic
    private Integer deleted;
}
