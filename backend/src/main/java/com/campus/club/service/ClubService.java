package com.campus.club.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.club.common.BizException;
import com.campus.club.common.PageResult;
import com.campus.club.dto.MaterialVO;
import com.campus.club.dto.UserVO;
import com.campus.club.entity.Club;
import com.campus.club.entity.ClubMember;
import com.campus.club.entity.CourseResource;
import com.campus.club.entity.Material;
import com.campus.club.entity.User;
import com.campus.club.mapper.ClubMapper;
import com.campus.club.mapper.ClubMemberMapper;
import com.campus.club.mapper.CourseResourceMapper;
import com.campus.club.mapper.MaterialMapper;
import com.campus.club.mapper.UserMapper;
import com.campus.club.security.SecurityHelper;
import com.campus.club.storage.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ClubService {

    private final ClubMapper clubMapper;
    private final ClubMemberMapper memberMapper;
    private final MaterialMapper materialMapper;
    private final CourseResourceMapper resourceMapper;
    private final UserMapper userMapper;
    private final StorageService storage;
    private final VoBuilder voBuilder;
    private final VisitService visitService;

    public ClubService(ClubMapper clubMapper, ClubMemberMapper memberMapper, MaterialMapper materialMapper,
                       CourseResourceMapper resourceMapper, UserMapper userMapper, StorageService storage,
                       VoBuilder voBuilder, VisitService visitService) {
        this.clubMapper = clubMapper;
        this.memberMapper = memberMapper;
        this.materialMapper = materialMapper;
        this.resourceMapper = resourceMapper;
        this.userMapper = userMapper;
        this.storage = storage;
        this.voBuilder = voBuilder;
        this.visitService = visitService;
    }

    // ===================== 门户：社团浏览 =====================

    public PageResult<Club> listClubs(long page, long size, String keyword) {
        LambdaQueryWrapper<Club> w = new LambdaQueryWrapper<Club>()
                .eq(Club::getStatus, "active")
                .orderByDesc(Club::getCreateTime);
        if (keyword != null && !keyword.isBlank()) w.like(Club::getName, keyword);
        IPage<Club> ip = clubMapper.selectPage(new Page<>(page, size), w);
        return PageResult.of(ip.getRecords(), ip.getTotal(), page, size);
    }

    public Club clubDetail(Long clubId) {
        Club c = clubMapper.selectById(clubId);
        if (c == null || !"active".equals(c.getStatus())) throw new BizException("社团不存在");
        fillClubExtras(c);
        return c;
    }

    /** 填充展示页所需的派生信息：负责教师姓名、当前用户简介编辑权限 */
    private void fillClubExtras(Club c) {
        if (c.getTeacherId() != null) {
            User t = userMapper.selectById(c.getTeacherId());
            if (t != null) c.setTeacherName(t.getName());
        }
        Long uid = SecurityHelper.getCurrentUserIdOpt();
        if (uid == null) {
            c.setCanEditIntro(false);
            return;
        }
        User u = userMapper.selectById(uid);
        if (u != null && "admin".equals(u.getRole())) {
            c.setCanEditIntro(true);
            return;
        }
        if (c.getTeacherId() != null && c.getTeacherId().equals(uid)) {
            c.setCanEditIntro(true);
            return;
        }
        boolean isLeader = memberMapper.selectCount(new LambdaQueryWrapper<ClubMember>()
                .eq(ClubMember::getClubId, c.getId())
                .eq(ClubMember::getUserId, uid)
                .eq(ClubMember::getIdentity, "leader")) > 0;
        c.setCanEditIntro(isLeader);
    }

    /** 当前用户“我的社团”：教师=负责社团；学生=已加入社团 */
    public List<Club> myClubs(Long uid) {
        User u = userMapper.selectById(uid);
        if (u == null) return List.of();
        if ("teacher".equals(u.getRole()) && u.getClubId() != null) {
            Club c = clubMapper.selectById(u.getClubId());
            return c == null ? List.of() : List.of(c);
        }
        if ("student".equals(u.getRole())) {
            List<ClubMember> members = memberMapper.selectList(
                    new LambdaQueryWrapper<ClubMember>().eq(ClubMember::getUserId, uid));
            return members.stream().map(m -> clubMapper.selectById(m.getClubId()))
                    .filter(c -> c != null && "active".equals(c.getStatus()))
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    /** 社团公开过程性内容（前端展示区） */
    public PageResult<MaterialVO> clubMaterials(Long clubId, long page, long size) {
        LambdaQueryWrapper<Material> w = new LambdaQueryWrapper<Material>()
                .eq(Material::getClubId, clubId)
                .eq(Material::getDisplayStatus, 1)
                .eq(Material::getReviewStatus, "passed")
                .orderByDesc(Material::getSubmitTime);
        IPage<Material> ip = materialMapper.selectPage(new Page<>(page, size), w);
        List<MaterialVO> list = ip.getRecords().stream().map(voBuilder::toMaterialVO).collect(Collectors.toList());
        return PageResult.of(list, ip.getTotal(), page, size);
    }

    /** 社团课程资源（上架且通过） */
    public List<CourseResource> clubResources(Long clubId) {
        return resourceMapper.selectList(new LambdaQueryWrapper<CourseResource>()
                .eq(CourseResource::getClubId, clubId)
                .eq(CourseResource::getDisplayStatus, 1)
                .eq(CourseResource::getReviewStatus, "passed")
                .orderByDesc(CourseResource::getPublishTime));
    }

    // ===================== 学生：提交过程性材料 =====================

    public MaterialVO submitMaterial(Long clubId, Long uid, String description,
                                     MultipartFile[] images, MultipartFile video, MultipartFile[] docs) {
        // 社团成员或该社团负责教师/管理员可提交
        boolean isMember = memberMapper.selectCount(new LambdaQueryWrapper<ClubMember>()
                .eq(ClubMember::getClubId, clubId).eq(ClubMember::getUserId, uid)) > 0;
        Club club = clubMapper.selectById(clubId);
        boolean isOwnerTeacher = club != null && club.getTeacherId() != null
                && club.getTeacherId().equals(uid);
        boolean isAdmin = isAdmin(uid);
        if (!isMember && !isOwnerTeacher && !isAdmin) {
            throw new BizException("您不是该社团成员，无法提交材料");
        }
        boolean hasPayload = (images != null && images.length > 0) || (video != null && !video.isEmpty())
                || (docs != null && docs.length > 0);
        if (!hasPayload) {
            throw new BizException("请至少上传一张图片、一个视频或一份文档");
        }
        Material m = new Material();
        m.setUserId(uid);
        m.setClubId(clubId);
        // 需求：材料不支持文字叙述，description 留空（兼容旧数据读取）
        m.setDescription(description);
        m.setDisplayStatus(1);
        m.setReviewStatus("passed"); // 无需审核，默认直接展示
        if (images != null) {
            List<String> urls = new ArrayList<>();
            for (MultipartFile f : images) {
                if (f != null && !f.isEmpty()) urls.add(storage.upload(f, "materials"));
            }
            if (!urls.isEmpty()) m.setImageUrl(String.join(",", urls));
        }
        if (docs != null) {
            List<String> urls = new ArrayList<>();
            for (MultipartFile f : docs) {
                if (f != null && !f.isEmpty()) urls.add(storage.upload(f, "materials"));
            }
            if (!urls.isEmpty()) m.setDocUrl(String.join(",", urls));
        }
        if (video != null && !video.isEmpty()) m.setVideoUrl(storage.upload(video, "materials"));
        materialMapper.insert(m);
        return voBuilder.toMaterialVO(m);
    }

    // ===================== 社团简介编辑（教师 / 管理员 / 社团负责人） =====================

    /** 教师、管理员或该社团负责人（有权限学生）可修改社团介绍词 */
    public Club updateIntro(Long clubId, Long uid, String intro) {
        ensureClubIntroEditor(clubId, uid);
        Club c = clubMapper.selectById(clubId);
        if (c == null) throw new BizException("社团不存在");
        c.setIntro(intro == null ? "" : intro);
        clubMapper.updateById(c);
        return c;
    }

    /** 简介编辑权限：管理员 / 本社团负责教师 / 本社团负责人（identity=leader） */
    public void ensureClubIntroEditor(Long clubId, Long uid) {
        if (isAdmin(uid)) return;
        Club c = clubMapper.selectById(clubId);
        if (c == null) throw new BizException("社团不存在");
        if (c.getTeacherId() != null && c.getTeacherId().equals(uid)) return;
        boolean isLeader = memberMapper.selectCount(new LambdaQueryWrapper<ClubMember>()
                .eq(ClubMember::getClubId, clubId)
                .eq(ClubMember::getUserId, uid)
                .eq(ClubMember::getIdentity, "leader")) > 0;
        if (isLeader) return;
        throw new BizException("无权限编辑该社团简介");
    }

    // ===================== 材料撤展 / 删除 =====================

    /**
     * 撤展：保留记录但不再对外展示（displayStatus=0）。
     * 权限：上传者本人、管理员或该社团负责教师（发现不当内容可撤展）。
     */
    public void hideMaterial(Long id, Long uid) {
        Material m = requireMaterialManageable(id, uid);
        m.setDisplayStatus(0);
        m.setReviewStatus("removed");
        materialMapper.updateById(m);
    }

    /** 删除：逻辑删除记录（发现不当内容可删除）。权限同撤展。 */
    public void deleteMaterial(Long id, Long uid) {
        Material m = requireMaterialManageable(id, uid);
        materialMapper.deleteById(m.getId());
        deleteFiles(m.getImageUrl());
        deleteFiles(m.getVideoUrl());
        deleteFiles(m.getDocUrl());
    }

    private Material requireMaterialManageable(Long id, Long uid) {
        Material m = materialMapper.selectById(id);
        if (m == null) throw new BizException("材料不存在");
        if (m.getUserId() != null && m.getUserId().equals(uid)) return m; // 发布者本人
        if (isAdmin(uid)) return m;                                       // 管理员
        Club c = clubMapper.selectById(m.getClubId());
        if (c != null && c.getTeacherId() != null && c.getTeacherId().equals(uid)) return m; // 负责教师
        throw new BizException("无权限操作该材料");
    }

    private void deleteFiles(String urls) {
        if (urls == null || urls.isBlank()) return;
        for (String u : urls.split(",")) {
            if (!u.isBlank()) storage.delete(u.trim());
        }
    }

    private boolean isAdmin(Long uid) {
        User u = userMapper.selectById(uid);
        return u != null && "admin".equals(u.getRole());
    }

    // ===================== 教师：发布课程资源 =====================

    public CourseResource addResource(Long clubId, Long uid, String title, String intro, String link, MultipartFile video) {
        ensureClubManager(clubId, uid);
        CourseResource r = new CourseResource();
        r.setClubId(clubId);
        r.setTeacherId(uid);
        r.setTitle(title);
        r.setIntro(intro);
        r.setLink(link);
        r.setDisplayStatus(1);
        r.setReviewStatus("passed"); // 默认直接展示（文档 3.5.1）
        if (video != null && !video.isEmpty()) r.setVideoUrl(storage.upload(video, "resources"));
        resourceMapper.insert(r);
        return r;
    }

    // ===================== 课程资源：编辑 / 撤下 / 删除（仅发布者本人或管理员） =====================

    public CourseResource updateResource(Long id, Long uid, String title, String intro, String link) {
        CourseResource r = requireResourceManageable(id, uid);
        if (title != null) r.setTitle(title);
        if (intro != null) r.setIntro(intro);
        if (link != null) r.setLink(link);
        resourceMapper.updateById(r);
        return r;
    }

    /** 撤下：资源保留但不再对外展示 */
    public void hideResource(Long id, Long uid) {
        CourseResource r = requireResourceManageable(id, uid);
        r.setDisplayStatus(0);
        r.setReviewStatus("removed");
        resourceMapper.updateById(r);
    }

    public void deleteResource(Long id, Long uid) {
        CourseResource r = requireResourceManageable(id, uid);
        resourceMapper.deleteById(r.getId());
        if (r.getVideoUrl() != null && !r.getVideoUrl().isBlank()) storage.delete(r.getVideoUrl());
    }

    /** 需求 4：教师或管理员发布的资源，仅本人或管理员可编辑/撤下 */
    private CourseResource requireResourceManageable(Long id, Long uid) {
        CourseResource r = resourceMapper.selectById(id);
        if (r == null) throw new BizException("资源不存在");
        if (r.getTeacherId() != null && r.getTeacherId().equals(uid)) return r; // 发布者本人
        if (isAdmin(uid)) return r;                                            // 管理员
        throw new BizException("无权限操作该资源（仅限发布者本人或管理员）");
    }

    // ===================== 成员管理（教师/管理员） =====================

    public List<UserVO> members(Long clubId, Long uid) {
        ensureClubManager(clubId, uid);
        List<ClubMember> list = memberMapper.selectList(
                new LambdaQueryWrapper<ClubMember>().eq(ClubMember::getClubId, clubId));
        return list.stream().map(m -> {
            User u = userMapper.selectById(m.getUserId());
            UserVO v = voBuilder.toUserVO(u);
            if (v != null) v.setClubName(m.getIdentity()); // 复用字段展示身份 normal/leader
            return v;
        }).filter(v -> v != null).collect(Collectors.toList());
    }

    public void addMember(Long clubId, Long operatorUid, Long targetUserId, String identity) {
        ensureClubManager(clubId, operatorUid);
        if (memberMapper.selectCount(new LambdaQueryWrapper<ClubMember>()
                .eq(ClubMember::getClubId, clubId).eq(ClubMember::getUserId, targetUserId)) > 0) {
            throw new BizException("该学生已是社团成员");
        }
        ClubMember m = new ClubMember();
        m.setClubId(clubId);
        m.setUserId(targetUserId);
        m.setIdentity(identity == null ? "normal" : identity);
        memberMapper.insert(m);
    }

    public void removeMember(Long clubId, Long operatorUid, Long targetUserId) {
        ensureClubManager(clubId, operatorUid);
        memberMapper.delete(new LambdaQueryWrapper<ClubMember>()
                .eq(ClubMember::getClubId, clubId).eq(ClubMember::getUserId, targetUserId));
    }

    /** 学生自助加入社团（无需教师审批），重复加入幂等 */
    public void joinSelf(Long clubId, Long uid) {
        Club c = clubMapper.selectById(clubId);
        if (c == null || !"active".equals(c.getStatus())) throw new BizException("社团不存在或已停用");
        User u = userMapper.selectById(uid);
        if (u == null) throw new BizException("用户不存在");
        if (!"student".equals(u.getRole())) throw new BizException("仅学生可加入社团");
        if (memberMapper.selectCount(new LambdaQueryWrapper<ClubMember>()
                .eq(ClubMember::getClubId, clubId).eq(ClubMember::getUserId, uid)) > 0) {
            throw new BizException("您已加入该社团");
        }
        ClubMember m = new ClubMember();
        m.setClubId(clubId);
        m.setUserId(uid);
        m.setIdentity("normal");
        memberMapper.insert(m);
    }

    // ===================== 管理员：社团 CRUD =====================

    public Club createClub(Club club) {
        club.setStatus(club.getStatus() == null ? "active" : club.getStatus());
        clubMapper.insert(club);
        return club;
    }

    public Club updateClub(Long id, Club club) {
        Club exist = clubMapper.selectById(id);
        if (exist == null) throw new BizException("社团不存在");
        if (club.getName() != null) exist.setName(club.getName());
        if (club.getIntro() != null) exist.setIntro(club.getIntro());
        if (club.getPoster() != null) exist.setPoster(club.getPoster());
        if (club.getTeacherId() != null) exist.setTeacherId(club.getTeacherId());
        if (club.getStatus() != null) exist.setStatus(club.getStatus());
        clubMapper.updateById(exist);
        return exist;
    }

    public void deleteClub(Long id) {
        clubMapper.deleteById(id); // 逻辑删除
    }

    // ===================== 管理员：内容审核 =====================

    public PageResult<MaterialVO> reviewMaterials(long page, long size, String reviewStatus) {
        LambdaQueryWrapper<Material> w = new LambdaQueryWrapper<Material>().orderByDesc(Material::getSubmitTime);
        if (reviewStatus != null && !reviewStatus.isBlank()) w.eq(Material::getReviewStatus, reviewStatus);
        IPage<Material> ip = materialMapper.selectPage(new Page<>(page, size), w);
        List<MaterialVO> list = ip.getRecords().stream().map(voBuilder::toMaterialVO).collect(Collectors.toList());
        return PageResult.of(list, ip.getTotal(), page, size);
    }

    public PageResult<CourseResource> reviewResources(long page, long size, String reviewStatus) {
        LambdaQueryWrapper<CourseResource> w = new LambdaQueryWrapper<CourseResource>().orderByDesc(CourseResource::getPublishTime);
        if (reviewStatus != null && !reviewStatus.isBlank()) w.eq(CourseResource::getReviewStatus, reviewStatus);
        IPage<CourseResource> ip = resourceMapper.selectPage(new Page<>(page, size), w);
        return PageResult.of(ip.getRecords(), ip.getTotal(), page, size);
    }

    public void reviewMaterial(Long id, String action) {
        Material m = materialMapper.selectById(id);
        if (m == null) throw new BizException("材料不存在");
        applyReview(m::setReviewStatus, m::setDisplayStatus, m, action);
        materialMapper.updateById(m);
    }

    public void reviewResource(Long id, String action) {
        CourseResource r = resourceMapper.selectById(id);
        if (r == null) throw new BizException("资源不存在");
        applyReview(r::setReviewStatus, r::setDisplayStatus, r, action);
        resourceMapper.updateById(r);
    }

    private <T> void applyReview(java.util.function.Consumer<String> setStatus,
                                 java.util.function.Consumer<Integer> setDisplay, T entity, String action) {
        switch (action) {
            case "pass" -> { setStatus.accept("passed"); setDisplay.accept(1); }
            case "reject" -> { setStatus.accept("rejected"); setDisplay.accept(0); }
            case "remove" -> { setStatus.accept("removed"); setDisplay.accept(0); }
            default -> throw new BizException("未知审核动作");
        }
    }

    // ===================== 仪表盘统计 =====================

    public Map<String, Object> stats() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userCount", userMapper.selectCount(null));
        m.put("clubCount", clubMapper.selectCount(new LambdaQueryWrapper<Club>().eq(Club::getStatus, "active")));
        m.put("materialCount", materialMapper.selectCount(null));
        m.put("resourceCount", resourceMapper.selectCount(null));
        m.put("pendingMaterial", materialMapper.selectCount(new LambdaQueryWrapper<Material>().eq(Material::getReviewStatus, "pending")));
        // 已撤回（撤展/下架）材料数：材料默认直接展示，不当内容由教师/管理员/本人撤下
        m.put("removedMaterial", materialMapper.selectCount(
                new LambdaQueryWrapper<Material>()
                        .eq(Material::getDisplayStatus, 0)
                        .ne(Material::getReviewStatus, "rejected")));
        // 对外公开展示的材料数（供仪表盘呈现真实运行态）
        m.put("shownMaterial", materialMapper.selectCount(new LambdaQueryWrapper<Material>()
                .eq(Material::getDisplayStatus, 1)
                .eq(Material::getReviewStatus, "passed")));

        // 各社团学生人数列表（饼图 / 直方图）
        List<Map<String, Object>> clubMemberStats = clubMapper
                .selectList(new LambdaQueryWrapper<Club>().eq(Club::getStatus, "active"))
                .stream().map(c -> {
                    long cnt = memberMapper.selectCount(
                            new LambdaQueryWrapper<ClubMember>().eq(ClubMember::getClubId, c.getId()));
                    Map<String, Object> mm = new LinkedHashMap<>();
                    mm.put("clubId", c.getId());
                    mm.put("clubName", c.getName());
                    mm.put("count", cnt);
                    return mm;
                }).collect(Collectors.toList());
        m.put("clubMemberStats", clubMemberStats);

        // 页面访问趋势与站点日活量（DAU）
        m.put("visitTrend", visitService.dailyTrend(14));
        m.put("visitDau", visitService.windowDau(14));
        return m;
    }

    // ===================== 权限校验 =====================

    /** 仅社团负责教师或管理员可管理该社团 */
    public void ensureClubManager(Long clubId, Long uid) {
        User u = userMapper.selectById(uid);
        if (u == null) throw new BizException("用户不存在");
        if ("admin".equals(u.getRole())) return;
        if ("teacher".equals(u.getRole())) {
            Club c = clubMapper.selectById(clubId);
            if (c != null && uid.equals(c.getTeacherId())) return;
        }
        throw new BizException("无权限操作该社团");
    }
}
