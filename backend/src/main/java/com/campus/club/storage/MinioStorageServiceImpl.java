package com.campus.club.storage;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

/** MinIO 对象存储实现（生产文件存储，配置 storage.type=minio 时启用） */
@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "minio")
public class MinioStorageServiceImpl implements StorageService {

    @Value("${storage.minio.endpoint:}")
    private String endpoint;
    @Value("${storage.minio.access-key:}")
    private String accessKey;
    @Value("${storage.minio.secret-key:}")
    private String secretKey;
    @Value("${storage.minio.bucket:campus-club}")
    private String bucket;

    private MinioClient client() {
        return MinioClient.builder().endpoint(endpoint).credentials(accessKey, secretKey).build();
    }

    @Override
    public String upload(MultipartFile file, String subDir) {
        try {
            String ext = originalExt(file.getOriginalFilename());
            String objectName = subDir + "/" + UUID.randomUUID() + ext;
            try (InputStream is = file.getInputStream()) {
                client().putObject(PutObjectArgs.builder()
                        .bucket(bucket).object(objectName)
                        .stream(is, file.getSize(), -1)
                        .contentType(file.getContentType())
                        .build());
            }
            return endpoint + "/" + bucket + "/" + objectName;
        } catch (Exception e) {
            throw new RuntimeException("MinIO 文件上传失败", e);
        }
    }

    @Override
    public void delete(String url) {
        try {
            if (url == null) return;
            String prefix = endpoint + "/" + bucket + "/";
            String objectName = url.startsWith(prefix) ? url.substring(prefix.length()) : url;
            client().removeObject(RemoveObjectArgs.builder().bucket(bucket).object(objectName).build());
        } catch (Exception ignored) {
        }
    }

    private String originalExt(String filename) {
        if (filename == null) return "";
        int i = filename.lastIndexOf('.');
        return i >= 0 ? filename.substring(i) : "";
    }
}
