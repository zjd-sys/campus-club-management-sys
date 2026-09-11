package com.campus.club.service;

import com.campus.club.entity.VisitLog;
import com.campus.club.mapper.VisitLogMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** 页面访问统计：记录访问、按天聚合访问次数与日活量 */
@Service
public class VisitService {

    private final VisitLogMapper mapper;

    public VisitService(VisitLogMapper mapper) {
        this.mapper = mapper;
    }

    /** 记录一次页面访问（游客 user_id 为 null） */
    public void recordVisit(String path, Long userId) {
        VisitLog v = new VisitLog();
        v.setPath(path);
        v.setUserId(userId);
        v.setVisitDate(LocalDate.now());
        mapper.insert(v);
    }

    /** 最近 days 天的每日访问趋势（含 pv / uv） */
    public List<Map<String, Object>> dailyTrend(int days) {
        LocalDate start = LocalDate.now().minusDays(Math.max(0, days - 1));
        return mapper.dailyTrend(start);
    }

    /** 最近 days 天窗口内的站点日活量（去重用户数） */
    public long windowDau(int days) {
        LocalDate start = LocalDate.now().minusDays(Math.max(0, days - 1));
        Long r = mapper.windowDau(start);
        return r == null ? 0 : r;
    }
}
