package com.campus.club.config;

import com.campus.club.entity.Clazz;
import com.campus.club.entity.Club;
import com.campus.club.entity.ClubMember;
import com.campus.club.entity.Grade;
import com.campus.club.entity.User;
import com.campus.club.mapper.ClazzMapper;
import com.campus.club.mapper.ClubMapper;
import com.campus.club.mapper.ClubMemberMapper;
import com.campus.club.mapper.GradeMapper;
import com.campus.club.mapper.UserMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.List;

/**
 * 首次启动初始化演示数据：dev / mysql 两个 profile 均生效。
 * 使用 BCrypt 实时加密写入默认账号，避免明文或预计算哈希不一致。
 * 仅在 user 表为空时写入（幂等），已有数据不会受影响；
 * 生产环境如需清空演示账号，建库后先删掉 sys_user 表中对应记录即可。
 */
@Component
@Profile({"dev", "mysql"})
public class DataInitializer {

    private final UserMapper userMapper;
    private final ClubMapper clubMapper;
    private final GradeMapper gradeMapper;
    private final ClazzMapper clazzMapper;
    private final ClubMemberMapper memberMapper;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public DataInitializer(UserMapper userMapper, ClubMapper clubMapper, GradeMapper gradeMapper,
                           ClazzMapper clazzMapper, ClubMemberMapper memberMapper) {
        this.userMapper = userMapper;
        this.clubMapper = clubMapper;
        this.gradeMapper = gradeMapper;
        this.clazzMapper = clazzMapper;
        this.memberMapper = memberMapper;
    }

    @PostConstruct
    public void init() {
        if (userMapper.selectCount(null) > 0) return;

        // 默认密码统一为 123456（BCrypt 加密）
        String pwd = encoder.encode("123456");

        // 年级 / 班级
        Grade g1 = new Grade(); g1.setName("高一"); gradeMapper.insert(g1);
        Grade g2 = new Grade(); g2.setName("高二"); gradeMapper.insert(g2);
        Clazz c1 = new Clazz(); c1.setGradeId(g1.getId()); c1.setName("1班"); clazzMapper.insert(c1);
        Clazz c2 = new Clazz(); c2.setGradeId(g1.getId()); c2.setName("2班"); clazzMapper.insert(c2);

        // 社团
        Club literature = club("文学社", "以文会友，书写青春。定期开展读书分享与征文活动。");
        Club basketball = club("篮球社", "热血球场，挥洒汗水。校队选拔与日常训练。");
        Club tech      = club("科技创新社", "编程、机器人、创客，探索科技边界。");
        Club music     = club("音乐社", "声乐、器乐、乐队排练与校园演出。");
        Club art       = club("美术社", "绘画、手工、校园美育展览。");

        // 教师（绑定负责社团）
        User teacher = baseUser("teacher", pwd, "teacher", "王老师");
        teacher.setClubId(literature.getId());
        teacher.setGradeId(g1.getId()); teacher.setClazzId(c1.getId());
        teacher.setAge(34); teacher.setGender("女");
        userMapper.insert(teacher);
        literature.setTeacherId(teacher.getId()); clubMapper.updateById(literature);

        // 学生（默认加入文学社）
        User s1 = student("student", pwd, "张三", g1.getId(), c1.getId(), 16, "男");
        userMapper.insert(s1);
        memberMapper.insert(member(literature.getId(), s1.getId(), "leader"));

        User s2 = student("lisi", pwd, "李四", g1.getId(), c1.getId(), 16, "男");
        userMapper.insert(s2);
        memberMapper.insert(member(literature.getId(), s2.getId(), "normal"));

        User s3 = student("wangwu", pwd, "王五", g2.getId(), c2.getId(), 17, "女");
        userMapper.insert(s3);
        memberMapper.insert(member(basketball.getId(), s3.getId(), "normal"));

        // 管理员（最高权限，登录需额外密钥）
        User admin = baseUser("admin", pwd, "admin", "超级管理员");
        userMapper.insert(admin);
    }

    private Club club(String name, String intro) {
        Club c = new Club();
        c.setName(name); c.setIntro(intro); c.setStatus("active");
        clubMapper.insert(c);
        return c;
    }

    private User baseUser(String username, String pwd, String role, String name) {
        User u = new User();
        u.setUsername(username); u.setPassword(pwd); u.setRole(role); u.setName(name);
        u.setStatus("normal"); u.setFailCount(0); u.setVersion(0); u.setDeleted(0);
        return u;
    }

    private User student(String username, String pwd, String name, Long gradeId, Long clazzId, int age, String gender) {
        User u = baseUser(username, pwd, "student", name);
        u.setGradeId(gradeId); u.setClazzId(clazzId); u.setAge(age); u.setGender(gender);
        return u;
    }

    private ClubMember member(Long clubId, Long userId, String identity) {
        ClubMember m = new ClubMember();
        m.setClubId(clubId); m.setUserId(userId); m.setIdentity(identity);
        return m;
    }
}
