package com.campus.club.controller;

import com.campus.club.common.R;
import com.campus.club.service.SysConfigService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 站点公开信息：供门户端 / 管理端读取系统名称、Logo、背景图等配置。
 * 无需登录即可访问（未登录也要能正常渲染站点品牌信息）。
 */
@RestController
@RequestMapping("/api/portal")
public class SiteController {

    private final SysConfigService sysConfigService;

    public SiteController(SysConfigService sysConfigService) {
        this.sysConfigService = sysConfigService;
    }

    @GetMapping("/site-config")
    public R<?> siteConfig() {
        return R.ok(sysConfigService.get());
    }
}
