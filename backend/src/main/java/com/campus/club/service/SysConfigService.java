package com.campus.club.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.campus.club.entity.SysConfig;
import com.campus.club.mapper.SysConfigMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 系统站点配置：单行记录，首次读取时自动落库默认值。
 * 所有资源引用存“相对路径 / 对象存储 URL”，不含任何与环境绑定的绝对路径或域名。
 */
@Service
public class SysConfigService {

    private final SysConfigMapper mapper;

    public SysConfigService(SysConfigMapper mapper) {
        this.mapper = mapper;
    }

    /** 获取当前配置；不存在则写入默认配置（幂等） */
    public SysConfig get() {
        SysConfig c = mapper.selectOne(new LambdaQueryWrapper<SysConfig>().last("limit 1"));
        if (c == null) {
            c = defaultConfig();
            mapper.insert(c);
        }
        return c;
    }

    /** 局部更新：仅覆盖传入的非空字段 */
    public SysConfig update(SysConfig req) {
        SysConfig c = get();
        if (req.getSiteName() != null) c.setSiteName(req.getSiteName());
        if (req.getLogoUrl() != null) c.setLogoUrl(req.getLogoUrl());
        if (req.getBackgroundUrl() != null) c.setBackgroundUrl(req.getBackgroundUrl());
        if (req.getBannerUrl() != null) c.setBannerUrl(req.getBannerUrl());
        if (req.getThemeColor() != null) c.setThemeColor(req.getThemeColor());
        if (req.getSubTitle() != null) c.setSubTitle(req.getSubTitle());
        if (req.getFooterText() != null) c.setFooterText(req.getFooterText());
        c.setUpdateTime(LocalDateTime.now());
        mapper.updateById(c);
        return c;
    }

    /** 单独设置某项资源引用（Logo / 背景图 / 横幅），传 null 表示清除 */
    public SysConfig setResource(String field, String url) {
        SysConfig c = get();
        switch (field) {
            case "logo" -> c.setLogoUrl(url);
            case "background" -> c.setBackgroundUrl(url);
            case "banner" -> c.setBannerUrl(url);
            default -> throw new IllegalArgumentException("未知资源配置项: " + field);
        }
        c.setUpdateTime(LocalDateTime.now());
        mapper.updateById(c);
        return c;
    }

    private SysConfig defaultConfig() {
        SysConfig c = new SysConfig();
        c.setSiteName("校园社团管理系统");
        c.setSubTitle("发现社团 · 加入社团 · 记录成长");
        c.setThemeColor("#4096ff");
        c.setFooterText("校园社团综合管理系统");
        c.setUpdateTime(LocalDateTime.now());
        return c;
    }
}
