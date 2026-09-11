package com.campus.club.service;

import com.campus.club.common.BizException;
import com.campus.club.entity.User;
import com.campus.club.mapper.UserMapper;
import org.springframework.stereotype.Component;

/**
 * 账号落库统一入口，解决「逻辑删除 + 用户名唯一索引」的冲突。
 *
 * <p>sys_user.username 上的唯一索引不区分 deleted，因此同名账号被逻辑删除后无法再 INSERT
 * （会抛唯一约束异常）。此处检测到已删除的同名账号时<b>原地复活</b>：保留原 id、
 * 用新账号的字段整体覆盖并置 deleted=0。这样用户名可复用，同时
 * club_member / material / course_resource 等历史引用不会变成孤儿数据。</p>
 */
@Component
public class UserAccountRegistrar {

    private final UserMapper userMapper;

    public UserAccountRegistrar(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    /**
     * 校验账号名可用并落库：不存在则新建，存在但已被逻辑删除则复活。
     *
     * @param desired 待创建账号（字段完整，id 应为 null）
     * @throws BizException 账号已被占用（存在未删除的同名账号）
     */
    public void persist(User desired) {
        User exist = userMapper.selectAnyByUsername(desired.getUsername());
        if (exist == null) {
            desired.setDeleted(0);
            userMapper.insert(desired);
            return;
        }
        if (!Integer.valueOf(1).equals(exist.getDeleted())) {
            throw new BizException("账号已存在");
        }
        desired.setId(exist.getId());
        userMapper.reviveById(desired);
    }
}
