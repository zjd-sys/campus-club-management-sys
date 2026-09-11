package com.campus.club.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 系统站点配置（单行记录）。
 * 系统名称 / Logo / 背景图 / 横幅 / 主题色 / 页脚等均可由超级管理员在后台修改，
 * 前端通过公开接口 {@code GET /api/portal/site-config} 读取后渲染。
 * 其中 logoUrl / backgroundUrl / bannerUrl 均存资源引用（相对路径 /files/** 或对象存储 URL），
 * 不存任何与本机环境绑定的绝对路径。
 */
@Data
@TableName("sys_config")
public class SysConfig {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 系统名称（浏览器标题 / 导航栏 / 后台顶部） */
    private String siteName;

    /** 站点 Logo 资源引用 */
    private String logoUrl;

    /** 全站背景图资源引用 */
    private String backgroundUrl;

    /** 首页横幅（轮播）图资源引用，多张以逗号分隔 */
    private String bannerUrl;

    /** 主题色，如 #4096ff */
    private String themeColor;

    /** 副标题 / 一句话简介 */
    private String subTitle;

    /** 页脚文案 */
    private String footerText;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
