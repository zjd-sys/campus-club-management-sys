package com.campus.club.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${storage.local.path:./uploads}")
    private String localPath;

    @Value("${storage.local.base-url:/files}")
    private String baseUrl;

    /** 本地文件存储：将 /files/** 映射到磁盘目录，前端可直接访问上传的图片/视频 */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get(localPath).toAbsolutePath().normalize();
        registry.addResourceHandler(baseUrl + "/**")
                .addResourceLocations("file:" + uploadDir + "/");
    }

    /** 前后端分离：放行门户(5173)、管理(5174)本地 dev 域，生产可收紧 */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
