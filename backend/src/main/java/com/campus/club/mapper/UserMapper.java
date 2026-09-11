package com.campus.club.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.campus.club.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 按账号名查询，<b>包含已被逻辑删除的记录</b>（原生 SQL 不受逻辑删除拦截）。
     * sys_user.username 上的唯一索引不区分 deleted，因此同名账号被逻辑删除后无法直接 INSERT，
     * 需要先把已删除的记录捞出来做“复活”处理。
     */
    @Select("SELECT * FROM sys_user WHERE username = #{username} LIMIT 1")
    User selectAnyByUsername(@Param("username") String username);

    /**
     * 复活被逻辑删除的账号并重置为全新账号状态（原生 SQL，绕过逻辑删除对 update 的 deleted=0 限制）。
     * 保留原 id，因此 club_member / material / course_resource 等历史引用不会变成孤儿数据。
     */
    @Update("UPDATE sys_user SET deleted = 0, password = #{password}, role = #{role}, name = #{name}, "
            + "grade_id = #{gradeId}, clazz_id = #{clazzId}, age = #{age}, gender = #{gender}, "
            + "club_id = #{clubId}, status = #{status}, admin_secret = #{adminSecret}, "
            + "admin_level = #{adminLevel}, fail_count = 0, lock_until = NULL, version = 0 "
            + "WHERE id = #{id}")
    int reviveById(User u);
}
