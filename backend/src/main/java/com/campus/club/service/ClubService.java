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

    public ClubService(ClubMapper clubMapper, ClubMemberMapper memberMapper, MaterialMapper materialMapper,
                       CourseResourceMapper resourceMapper, UserMapper userMapper, StorageService storage, VoBuilder voBuilder) {
        this.clubMapper = clubMapper;
        this.memberMapper = memberMapper;
        this.materialMapper = materialMapper;
        this.resourceMapper = resourceMapper;
        this.userMapper = userMapper;
        this.storage = storage;
        this.voBuilder = voBuilder;
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
        return c;
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
                                     MultipartFile[] images, MultipartFile video) {
        // 社团成员或该社团负责教师可提交
        boolean isMember = memberMapper.selectCount(new LambdaQueryWrapper<ClubMember>()
                .eq(ClubMember::getClubId, clubId).eq(ClubMember::getUserId, uid)) > 0;
        Club club = clubMapper.selectById(clubId);
        boolean isOwnerTeacher = club != null && club.getTeacherId() != null
                && club.getTeacherId().equals(uid);
        if (!isMember && !isOwnerTeacher) {
            throw new BizException("您不是该社团成员，无法提交材料");
        }
        Material m = new Material();
        m.setUserId(uid);
        m.setClubId(clubId);
        m.setDescription(description);
        m.setDisplayStatus(1);
        m.setReviewStatus("passed"); // 默认直接公开展示（文档 3.3.2）
        if (images != null) {
            List<String> urls = new ArrayList<>();
            for (MultipartFile f : images) {
                if (f != null && !f.isEmpty()) urls.add(storage.upload(f, "materials"));
            }
            if (!urls.isEmpty()) m.setImageUrl(String.join(",", urls));
        }
        if (video != null && !video.isEmpty()) m.setVideoUrl(storage.upload(video, "materials"));
        materialMapper.insert(m);
        return voBuilder.toMaterialVO(m);
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
