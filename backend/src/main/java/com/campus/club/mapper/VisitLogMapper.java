package com.campus.club.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.campus.club.entity.VisitLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface VisitLogMapper extends BaseMapper<VisitLog> {

    /** 按天聚合：每日访问次数(pv) 与 日活用户数(uv)，跨 H2/MySQL 兼容 */
    @Select("SELECT visit_date AS visitDate, COUNT(*) AS pv, COUNT(DISTINCT user_id) AS uv " +
            "FROM visit_log WHERE visit_date >= #{start} AND deleted = 0 " +
            "GROUP BY visit_date ORDER BY visit_date")
    List<Map<String, Object>> dailyTrend(@Param("start") LocalDate start);

    /** 窗口内去重活跃用户数（站点日活量，DAU） */
    @Select("SELECT COUNT(DISTINCT user_id) FROM visit_log " +
            "WHERE visit_date >= #{start} AND deleted = 0 AND user_id IS NOT NULL")
    Long windowDau(@Param("start") LocalDate start);
}
