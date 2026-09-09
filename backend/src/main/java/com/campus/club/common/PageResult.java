package com.campus.club.common;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/** 分页结果（全站固定 page/size，后端统一分页，前端复用同一分页组件） */
@Data
public class PageResult<T> implements Serializable {
    private Long total;
    private Long page;
    private Long size;
    private List<T> records;

    public static <T> PageResult<T> of(List<T> records, long total, long page, long size) {
        PageResult<T> p = new PageResult<>();
        p.records = records;
        p.total = total;
        p.page = page;
        p.size = size;
        return p;
    }
}
