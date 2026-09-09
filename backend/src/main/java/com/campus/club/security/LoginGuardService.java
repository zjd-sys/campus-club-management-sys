package com.campus.club.security;

import com.campus.club.entity.User;
import com.campus.club.mapper.UserMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 登录安全防护（文档《用户信息安全策略》核心机制，全部由后端实现）：
 *  - 单IP每分钟限流
 *  - 连续失败锁定账号
 *  - 触发验证码判定
 * 说明：IP 限流此处用进程内内存实现，满足单实例防护；生产多实例应改用 Redis/DB。
 */
@Service
public class LoginGuardService {

    private final UserMapper userMapper;
    private final SecurityProps props;

    /** ip -> 最近请求时间戳(ms) */
    private final Map<String, List<Long>> ipWindow = new ConcurrentHashMap<>();

    public LoginGuardService(UserMapper userMapper, SecurityProps props) {
        this.userMapper = userMapper;
        this.props = props;
    }

    /** @return true=放行，false=触发限流(直接拦截，不校验密码) */
    public boolean allowIp(String ip) {
        long now = System.currentTimeMillis();
        long window = 60_000L;
        List<Long> ts = ipWindow.computeIfAbsent(ip, k -> new LinkedList<>());
        synchronized (ts) {
            ts.removeIf(t -> now - t > window);
            if (ts.size() >= props.ipLimitPerMinute) {
                return false;
            }
            ts.add(now);
            return true;
        }
    }

    public boolean isLocked(User user) {
        return user != null && user.getLockUntil() != null
                && LocalDateTime.now().isBefore(user.getLockUntil());
    }

    public boolean requireCaptcha(User user) {
        return user != null && user.getFailCount() != null
                && user.getFailCount() >= props.captchaTriggerFail;
    }

    /** 失败处理：计数自增，达阈值锁定；返回是否“本次刚刚被锁定” */
    public boolean onFailure(User user) {
        int cnt = (user.getFailCount() == null ? 0 : user.getFailCount()) + 1;
        user.setFailCount(cnt);
        boolean lockedNow = false;
        if (cnt >= props.failLockThreshold) {
            user.setLockUntil(LocalDateTime.now().plusMinutes(props.lockMinutes));
            lockedNow = true;
        }
        userMapper.updateById(user);
        return lockedNow;
    }

    /** 成功处理：清零失败计数、解除锁定 */
    public void onSuccess(User user) {
        user.setFailCount(0);
        user.setLockUntil(null);
        userMapper.updateById(user);
    }

    /** 后端强制延时（无法被前端绕过），提升爆破成本 */
    public void applyFailureDelay() {
        try {
            Thread.sleep(props.failDelayMs);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    public int getIpLimitPerMinute() {
        return props.ipLimitPerMinute;
    }
}
