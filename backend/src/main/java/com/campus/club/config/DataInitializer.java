package com.campus.club.config;

import com.campus.club.entity.Clazz;
import com.campus.club.entity.Club;
import com.campus.club.entity.ClubMember;
import com.campus.club.entity.CourseResource;
import com.campus.club.entity.Grade;
import com.campus.club.entity.Material;
import com.campus.club.entity.SysConfig;
import com.campus.club.entity.User;
import com.campus.club.entity.VisitLog;
import com.campus.club.mapper.ClazzMapper;
import com.campus.club.mapper.ClubMapper;
import com.campus.club.mapper.ClubMemberMapper;
import com.campus.club.mapper.CourseResourceMapper;
import com.campus.club.mapper.GradeMapper;
import com.campus.club.mapper.MaterialMapper;
import com.campus.club.mapper.SysConfigMapper;
import com.campus.club.mapper.UserMapper;
import com.campus.club.mapper.VisitLogMapper;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 本地开发(dev)首次启动初始化演示数据，便于联调与预览。
 * <p>
 * 生产/主库(mysql profile)不注入任何演示数据，保持“无数据即留空”，测试数据与主库隔离。
 * <p>
 * <b>数据设计原则（演示账号完整生态）</b>：
 * <ul>
 *   <li>每个账号登录后都能完整演示所辖功能：教师有社团 + 成员 + 课程资源；
 *       学生均至少加入一个社团并可查看“我的社团 / 上传材料 / 我的材料”；管理员有全站配置与数据；</li>
 *   <li>每个社团均具备：负责教师、成员、过程性材料、课程资源，不存在“半成品”社团；</li>
 *   <li>科技创新社过程性材料 &gt; 30 条，用于演示展示页分页（30 条/页）；</li>
 *   <li>含 1 条已撤展材料，使后台“已撤回材料”指标为真实运行态数据；</li>
 *   <li>年级按「25届/26届」，班级按「2501/2502/2503/2601」编号；</li>
 *   <li>灌入近 14 天访问日志，使仪表盘饼图/直方图/DAU 呈现真实运行态数据；</li>
 *   <li>种子管理员各自持有独立管理员令牌，可演示“创建管理员/重置令牌/修改自身令牌”。</li>
 * </ul>
 * 仅在 sys_user 表为空时写入（幂等），已有数据不会受影响。
 */
@Component
@Profile({"dev"})
public class DataInitializer {

    private static final String DEFAULT_PWD = "123456";
    private static final String DEFAULT_ADMIN_SECRET = "admin123";

    private final UserMapper userMapper;
    private final ClubMapper clubMapper;
    private final GradeMapper gradeMapper;
    private final ClazzMapper clazzMapper;
    private final ClubMemberMapper memberMapper;
    private final MaterialMapper materialMapper;
    private final CourseResourceMapper resourceMapper;
    private final VisitLogMapper visitLogMapper;
    private final SysConfigMapper sysConfigMapper;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public DataInitializer(UserMapper userMapper, ClubMapper clubMapper, GradeMapper gradeMapper,
                           ClazzMapper clazzMapper, ClubMemberMapper memberMapper,
                           MaterialMapper materialMapper, CourseResourceMapper resourceMapper,
                           VisitLogMapper visitLogMapper, SysConfigMapper sysConfigMapper) {
        this.userMapper = userMapper;
        this.clubMapper = clubMapper;
        this.gradeMapper = gradeMapper;
        this.clazzMapper = clazzMapper;
        this.memberMapper = memberMapper;
        this.materialMapper = materialMapper;
        this.resourceMapper = resourceMapper;
        this.visitLogMapper = visitLogMapper;
        this.sysConfigMapper = sysConfigMapper;
    }

    @PostConstruct
    public void init() {
        // 幂等：已有用户数据则跳过（重启不重复灌入）
        if (userMapper.selectCount(null) > 0) {
            return;
        }
        String pwd = encoder.encode(DEFAULT_PWD); // 默认密码统一 123456

        // ---------- 系统配置：系统名称 / Logo / 副标题 / 主题色 / 页脚 ----------
        sysConfig();

        // ---------- 年级 / 班级（届别 + 班级编号规范） ----------
        Grade g25 = new Grade(); g25.setName("25届"); gradeMapper.insert(g25);
        Grade g26 = new Grade(); g26.setName("26届"); gradeMapper.insert(g26);
        Clazz c2501 = clazz("2501", g25);
        Clazz c2502 = clazz("2502", g25);
        Clazz c2503 = clazz("2503", g25);
        Clazz c2601 = clazz("2601", g26);

        // ---------- 社团（海报用内联 SVG 占位，无需外部图片文件） ----------
        Club literature = club("文学社", "以文会友，书写青春。定期开展读书分享、征文与朗诵活动。", "#4096ff");
        Club basketball = club("篮球社", "热血球场，挥洒汗水。负责校队选拔与日常训练，强健体魄。", "#f56c6c");
        Club tech       = club("科技创新社", "编程、机器人、创客，探索科技边界，备战青少年科创大赛。", "#722ed1");
        Club music      = club("音乐社", "声乐、器乐、乐队排练与校园演出，用旋律记录校园时光。", "#fa8c16");
        Club art        = club("美术社", "绘画、手工、校园美育展览，用色彩表达所见所思。", "#13c2c2");

        // ---------- 教师（每人负责一个社团；教师权限由后台分配） ----------
        User wang = teacher("teacher", pwd, "王老师", literature, 34, "女", g25, c2501);
        User li   = teacher("lilaoshi", pwd, "李老师", basketball, 38, "男", g25, c2502);
        User chen = teacher("chenlaoshi", pwd, "陈老师", tech, 32, "男", g26, c2601);
        User zhao = teacher("zhaolaoshi", pwd, "赵老师", music, 29, "女", g25, c2503);
        User liu  = teacher("liulaoshi", pwd, "刘老师", art, 36, "女", g26, c2601);

        // ---------- 学生：分布在 2501 / 2502 / 2503 / 2601 四个班 ----------
        User zhangsan = student("student", pwd, "张三", g25, c2501, 16, "男");
        User lisi     = student("lisi", pwd, "李四", g25, c2501, 16, "男");
        User zhengshi = student("zhengshi", pwd, "郑十", g25, c2501, 17, "女");
        User sunqi    = student("sunqi", pwd, "孙七", g25, c2501, 16, "男");
        User jiangwu  = student("jiangwu", pwd, "蒋五", g25, c2501, 17, "女");
        User zhouba   = student("zhouba", pwd, "周八", g25, c2502, 16, "男");
        User fengyi   = student("fengyi", pwd, "冯一", g25, c2502, 16, "女");
        User wujiu    = student("wujiu", pwd, "吴九", g25, c2502, 17, "男");
        User chener   = student("chener", pwd, "陈二", g25, c2503, 16, "女");
        User wanger   = student("wanger", pwd, "王二", g25, c2503, 17, "男");
        User wangwu   = student("wangwu", pwd, "王五", g26, c2601, 17, "女");
        User chusan   = student("chusan", pwd, "褚三", g26, c2601, 16, "男");
        User weisi    = student("weisi", pwd, "卫四", g26, c2601, 16, "女");

        // ---------- 加入社团：每名学生至少归属一个社团，各社团人数灵活调配 ----------
        join(literature, zhangsan, "leader");   // 文学社 3 人（负责人：张三）
        join(literature, lisi, "normal");
        join(literature, zhengshi, "normal");

        join(basketball, zhouba, "leader");     // 篮球社 3 人（负责人：周八）
        join(basketball, fengyi, "normal");
        join(basketball, wangwu, "normal");

        join(tech, sunqi, "leader");            // 科技创新社 3 人（负责人：孙七，完整流程主角）
        join(tech, wujiu, "normal");
        join(tech, chener, "normal");

        join(music, chusan, "leader");          // 音乐社 2 人
        join(music, weisi, "normal");

        join(art, jiangwu, "leader");           // 美术社 2 人
        join(art, wanger, "normal");

        // ---------- 过程性材料：无需审核，直接展示（每人都有，保证个人中心有数据） ----------
        // 文学社
        material(literature, zhangsan, svg("#4096ff", "读书分享会现场"), doc("读书分享会记录"), 11);
        material(literature, lisi, svg("#67c23a", "经典诵读排练"), null, 9);
        material(literature, zhengshi, svg("#722ed1", "征文评审现场"), doc("征文活动小结"), 7);
        // 篮球社
        material(basketball, zhouba, svg("#f56c6c", "校队选拔训练"), doc("选拔训练计划"), 10);
        material(basketball, fengyi, svg("#fa8c16", "班际友谊赛"), null, 8);
        material(basketball, wangwu, svg("#13c2c2", "体能测试记录"), doc("体能测试数据"), 4);
        // 音乐社
        material(music, chusan, svg("#fa8c16", "乐队排练纪实"), null, 9);
        material(music, weisi, svg("#4096ff", "校园艺术节演出"), doc("演出曲目单"), 3);
        // 美术社
        material(art, jiangwu, svg("#13c2c2", "写生作品选"), doc("写生作品说明"), 8);
        material(art, wanger, svg("#722ed1", "校园美育展布展"), null, 5);

        // 科技创新社：> 30 条，用于演示展示页分页（30 条/页）
        String[] techCaptions = {
                "机器人组装过程", "循迹小车调试", "科创大赛作品说明", "3D 打印建模", "开源硬件接线",
                "图形化编程练习", "传感器数据采集", "智能小车路测", "无人机试飞准备", "代码评审会",
                "机器人对抗赛训练", "创客工作坊", "电路板焊接实拍", "算法优化记录", "校园科技节展位",
                "嵌入式开发实践", "机械结构改进", "赛前联调复盘"
        };
        int techDays = 13;
        for (int i = 0; i < techCaptions.length; i++) {
            User owner = switch (i % 3) { case 0 -> sunqi; case 1 -> wujiu; default -> chener; };
            String doc = (i % 2 == 0) ? doc(techCaptions[i] + " - 记录") : null;
            material(tech, owner, svg(i % 2 == 0 ? "#722ed1" : "#4096ff", techCaptions[i]), doc, techDays);
            // 每条材料再补一份，凑足 >30 条从而可演示分页
            material(tech, owner, svg("#67c23a", techCaptions[i] + " 成果图"), null, techDays - 1);
            techDays = techDays > 0 ? techDays - 1 : 0;
        }

        // ---------- 已撤展材料（真实运行态：后台“已撤回材料”指标 > 0） ----------
        materialRemoved(literature, zhengshi, svg("#909399", "内容待整改（已撤展）"), 6);

        // ---------- 课程资源：每个社团均有教师发布的资源（学生可浏览） ----------
        resource(literature, wang, "经典诵读入门", "朗读技巧与气息训练，附示范音频要点。", "https://example.edu/literature/recite", 12);
        resource(literature, wang, "议论文写作提纲", "从立意到结构的完整写作框架。", "https://example.edu/literature/writing", 6);
        resource(basketball, li, "篮球基础运球训练", "高低运球、变向与护球要点。", "https://example.edu/basketball/dribble", 12);
        resource(basketball, li, "投篮姿势纠正", "常见投篮错误动作与纠正方法。", "https://example.edu/basketball/shoot", 5);
        resource(tech, chen, "Python 入门与硬件控制", "从语法基础到控制开源硬件的实践路径。", "https://example.edu/tech/python", 13);
        resource(tech, chen, "机器人竞赛备赛指南", "赛题拆解、分工与调试checklist。", "https://example.edu/tech/robot", 4);
        resource(music, zhao, "合唱声部训练", "声部配合与和声听觉训练。", "https://example.edu/music/chorus", 11);
        resource(music, zhao, "基础乐理与视唱", "音程、节奏与视唱练耳练习。", "https://example.edu/music/theory", 5);
        resource(art, liu, "素描静物基础", "构图、明暗与质感表现。", "https://example.edu/art/sketch", 10);
        resource(art, liu, "色彩构成入门", "色彩三要素与配色练习。", "https://example.edu/art/color", 4);

        // ---------- 管理员（各自持有独立管理员令牌；区分超管/普通管理员层级） ----------
        // 超级管理员：可管理整个管理员组（增删管理员、设置层级、启停、重置他人令牌）
        admin("admin", pwd, "超级管理员", DEFAULT_ADMIN_SECRET, "super");
        // 普通管理员：仅可修改自身令牌，不能查看或管理任何其他管理员
        admin("admin2", pwd, "教务管理员", "admin2-secret", "normal");

        // ---------- 访问日志：近 14 天，供日活(DAU)与访问趋势统计 ----------
        List<User> visitors = new ArrayList<>(List.of(
                zhangsan, lisi, sunqi, wangwu, zhouba, chusan, jiangwu, zhengshi, weisi, chener));
        for (int d = 13; d >= 0; d--) {
            LocalDate date = LocalDate.now().minusDays(d);
            int pv = 6 + (d % 6); // 每天 6~11 次访问，形成自然波动
            for (int i = 0; i < pv; i++) {
                // 约 1/4 为游客（未登录），其余为登录学生
                Long uid = (i % 4 == 3) ? null : visitors.get((d + i) % visitors.size()).getId();
                visitLog(date, uid, d);
            }
        }
    }

    // ===================== 工具方法 =====================

    private Clazz clazz(String name, Grade g) {
        Clazz c = new Clazz();
        c.setGradeId(g.getId());
        c.setName(name);
        clazzMapper.insert(c);
        return c;
    }

    private Club club(String name, String intro, String color) {
        Club c = new Club();
        c.setName(name);
        c.setIntro(intro);
        c.setPoster(svg(color, name));
        c.setStatus("active");
        clubMapper.insert(c);
        return c;
    }

    private User teacher(String username, String pwd, String name, Club club, int age, String gender,
                         Grade g, Clazz c) {
        User u = baseUser(username, pwd, "teacher", name);
        u.setGradeId(g.getId());
        u.setClazzId(c.getId());
        u.setAge(age);
        u.setGender(gender);
        userMapper.insert(u);
        club.setTeacherId(u.getId());
        clubMapper.updateById(club);
        // 教师负责社团ID（便于“我的社团”按教师维度查询）
        u.setClubId(club.getId());
        userMapper.updateById(u);
        return u;
    }

    private User student(String username, String pwd, String name, Grade g, Clazz c, int age, String gender) {
        User u = baseUser(username, pwd, "student", name);
        u.setGradeId(g.getId());
        u.setClazzId(c.getId());
        u.setAge(age);
        u.setGender(gender);
        userMapper.insert(u);
        return u;
    }

    private User baseUser(String username, String pwd, String role, String name) {
        User u = new User();
        u.setUsername(username);
        u.setPassword(pwd);
        u.setRole(role);
        u.setName(name);
        u.setStatus("normal");
        u.setFailCount(0);
        u.setVersion(0);
        u.setDeleted(0);
        return u;
    }

    private void admin(String username, String pwd, String name, String secret, String level) {
        User u = baseUser(username, pwd, "admin", name);
        u.setAdminLevel(level);
        u.setAdminSecret(encoder.encode(secret));
        userMapper.insert(u);
    }

    private void join(Club club, User user, String identity) {
        ClubMember m = new ClubMember();
        m.setClubId(club.getId());
        m.setUserId(user.getId());
        m.setIdentity(identity);
        memberMapper.insert(m);
    }

    /** 学生上传的过程性材料：无需审核，默认直接展示（displayStatus=1 / passed） */
    private void material(Club club, User user, String imageUrl, String docUrl, int daysAgo) {
        insertMaterial(club, user, imageUrl, docUrl, daysAgo, 1, "passed");
    }

    /** 已撤展材料：保留记录但不再对外展示（用于后台统计） */
    private void materialRemoved(Club club, User user, String imageUrl, int daysAgo) {
        insertMaterial(club, user, imageUrl, null, daysAgo, 0, "removed");
    }

    private void insertMaterial(Club club, User user, String imageUrl, String docUrl,
                                int daysAgo, int displayStatus, String reviewStatus) {
        Material m = new Material();
        m.setUserId(user.getId());
        m.setClubId(club.getId());
        m.setImageUrl(imageUrl);
        m.setDocUrl(docUrl);
        m.setDisplayStatus(displayStatus);
        m.setReviewStatus(reviewStatus);
        materialMapper.insert(m);
        // 回填提交时间，使展示区按时间倒序呈现
        m.setSubmitTime(LocalDateTime.now().minusDays(Math.max(0, daysAgo)).minusHours(1));
        materialMapper.updateById(m);
    }

    /** 教师发布的课程资源：默认直接展示（displayStatus=1 / passed） */
    private void resource(Club club, User teacher, String title, String intro, String link, int daysAgo) {
        CourseResource r = new CourseResource();
        r.setClubId(club.getId());
        r.setTeacherId(teacher.getId());
        r.setTitle(title);
        r.setIntro(intro);
        r.setLink(link);
        r.setDisplayStatus(1);
        r.setReviewStatus("passed");
        resourceMapper.insert(r);
        r.setPublishTime(LocalDateTime.now().minusDays(Math.max(0, daysAgo)));
        resourceMapper.updateById(r);
    }

    private void visitLog(LocalDate date, Long userId, int daysAgo) {
        VisitLog v = new VisitLog();
        v.setPath("/");
        v.setUserId(userId);
        v.setVisitDate(date);
        v.setCreateTime(LocalDateTime.now().minusDays(daysAgo));
        visitLogMapper.insert(v);
    }

    /** 系统站点配置：系统名称 / Logo（内联 SVG，无外部依赖）/ 副标题 / 主题色 / 页脚 */
    private void sysConfig() {
        SysConfig c = new SysConfig();
        c.setSiteName("校园社团管理系统");
        c.setSubTitle("发现社团 · 加入社团 · 记录成长");
        c.setThemeColor("#4096ff");
        c.setFooterText("校园社团综合管理系统 · 演示环境");
        c.setLogoUrl(svg("#4096ff", "社"));
        c.setUpdateTime(LocalDateTime.now());
        sysConfigMapper.insert(c);
    }

    /** 内联 SVG 占位图（data URI），避免依赖外部图片文件 */
    private String svg(String color, String text) {
        String s = "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'>"
                + "<rect width='800' height='450' fill='" + color + "'/>"
                + "<text x='50%' y='50%' font-size='30' fill='#ffffff' text-anchor='middle' "
                + "dominant-baseline='middle' font-family='Microsoft YaHei'>" + text + "</text></svg>";
        return "data:image/svg+xml;charset=utf-8," + enc(s);
    }

    /** 内联文本占位文档（data URI），点击可查看/下载 */
    private String doc(String text) {
        return "data:text/plain;charset=utf-8," + enc(text + "（示例过程性材料文档）");
    }

    private String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
