package com.campus.club.service;

import com.campus.club.common.BizException;
import com.campus.club.storage.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/**
 * 文件资源管理（超级管理员后台）：查看 / 上传 / 删除存储目录中的全部文件资源。
 * <p>
 * 统一以“存储根目录”为基准，返回相对引用（{@code /files/materials/xxx.png}），
 * 不向调用方暴露服务器绝对路径，保证在 Windows / Linux 下行为一致。
 * 当前实现面向本地磁盘存储（storage.type=local，默认）；MinIO 部署时同样可列出对象。
 */
@Service
public class StorageAdminService {

    private final StorageService storage;

    @Value("${storage.type:local}")
    private String storageType;

    @Value("${storage.local.path:./uploads}")
    private String localPath;

    @Value("${storage.local.base-url:/files}")
    private String baseUrl;

    public StorageAdminService(StorageService storage) {
        this.storage = storage;
    }

    /** 存储根目录（绝对化，兼容 Windows / Linux） */
    private Path root() {
        return Paths.get(localPath).toAbsolutePath().normalize();
    }

    /** 列出全部文件资源（按修改时间倒序） */
    public List<Map<String, Object>> list() {
        Path root = root();
        if (!Files.isDirectory(root)) {
            return List.of();
        }
        List<Map<String, Object>> out = new ArrayList<>();
        try (Stream<Path> walk = Files.walk(root)) {
            walk.filter(Files::isRegularFile).forEach(p -> {
                Path rel = root.relativize(p);
                String relStr = rel.toString().replace('\\', '/');
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", p.getFileName().toString());
                m.put("path", relStr);
                m.put("url", baseUrl + "/" + relStr);
                m.put("group", rel.getParent() == null ? "" : rel.getParent().toString().replace('\\', '/'));
                try {
                    m.put("size", Files.size(p));
                    m.put("lastModified", LocalDateTime.ofInstant(
                            Instant.ofEpochMilli(Files.getLastModifiedTime(p).toMillis()), ZoneId.systemDefault()));
                } catch (Exception e) {
                    m.put("size", 0L);
                }
                out.add(m);
            });
        } catch (Exception e) {
            throw new BizException("读取文件目录失败: " + e.getMessage());
        }
        out.sort(Comparator.comparing(
                (Map<String, Object> m) -> (LocalDateTime) m.getOrDefault("lastModified", LocalDateTime.MIN))
                .reversed());
        return out;
    }

    /** 上传文件到指定分组（默认 common），返回资源引用信息 */
    public Map<String, Object> upload(MultipartFile file, String subDir) {
        if (file == null || file.isEmpty()) {
            throw new BizException("上传文件为空");
        }
        String url = storage.upload(file, (subDir == null || subDir.isBlank()) ? "common" : subDir);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", file.getOriginalFilename());
        m.put("url", url);
        return m;
    }

    /**
     * 删除文件资源。
     *
     * @param pathOrUrl 相对路径（materials/xxx.png）或资源引用（/files/materials/xxx.png）
     */
    public void delete(String pathOrUrl) {
        if (pathOrUrl == null || pathOrUrl.isBlank()) {
            throw new BizException("文件路径为空");
        }
        String rel = pathOrUrl.replace('\\', '/');
        if (rel.startsWith(baseUrl)) rel = rel.substring(baseUrl.length());
        while (rel.startsWith("/")) rel = rel.substring(1);

        Path root = root();
        Path target = root.resolve(rel).normalize();
        // 防御目录穿越：目标必须仍在存储根目录内
        if (!target.startsWith(root)) {
            throw new BizException("非法的文件路径");
        }
        if (!Files.exists(target)) {
            // 兼容对象存储：交由 storage 实现按 URL 语义删除
            storage.delete(baseUrl + "/" + rel);
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (Exception e) {
            throw new BizException("删除文件失败: " + e.getMessage());
        }
    }

    /** 存储类型（供前端提示：local / minio） */
    public String storageType() {
        return storageType;
    }
}
