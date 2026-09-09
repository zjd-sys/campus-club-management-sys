package com.campus.club.storage;

import org.springframework.web.multipart.MultipartFile;

/** 文件存储抽象：数据库仅存访问URL，禁止大文件入库（文档规范） */
public interface StorageService {
    /** 保存文件，返回可访问 URL */
    String upload(MultipartFile file, String subDir);

    /** 删除已存储文件（URL 由 upload 返回） */
    void delete(String url);
}
