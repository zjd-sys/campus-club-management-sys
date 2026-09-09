package com.campus.club.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/** 本地磁盘存储：默认实现，便于本地直接运行；生产可切换 MinIO */
@Service
@Primary
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageServiceImpl implements StorageService {

    @Value("${storage.local.path:./uploads}")
    private String localPath;

    @Value("${storage.local.base-url:/files}")
    private String baseUrl;

    @Override
    public String upload(MultipartFile file, String subDir) {
        try {
            String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
            String name = UUID.randomUUID().toString().replace("-", "") + ext;
            String dirName = (subDir == null || subDir.isBlank()) ? "common" : subDir;
            Path dir = Paths.get(localPath, dirName);
            Files.createDirectories(dir);
            File target = dir.resolve(name).toFile();
            file.transferTo(target);
            return baseUrl + "/" + dirName + "/" + name;
        } catch (Exception e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String url) {
        try {
            if (url == null || url.isBlank() || url.startsWith("http")) {
                return;
            }
            String rel = url;
            if (rel.startsWith(baseUrl)) {
                rel = rel.substring(baseUrl.length());
            }
            rel = rel.replace('/', File.separatorChar);
            while (rel.startsWith(File.separator)) {
                rel = rel.substring(1);
            }
            Path p = Paths.get(localPath, rel);
            Files.deleteIfExists(p);
        } catch (Exception ignored) {
            // 删除失败不影响主流程
        }
    }
}
