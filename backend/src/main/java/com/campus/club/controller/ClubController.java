package com.campus.club.controller;

import com.campus.club.common.R;
import com.campus.club.dto.UserVO;
import com.campus.club.entity.Club;
import com.campus.club.entity.CourseResource;
import com.campus.club.security.SecurityHelper;
import com.campus.club.service.ClubService;
import com.campus.club.service.VisitService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portal")
public class ClubController {

    private final ClubService clubService;
    private final VisitService visitService;

    public ClubController(ClubService clubService, VisitService visitService) {
        this.clubService = clubService;
        this.visitService = visitService;
    }

    @GetMapping("/clubs")
    public R<?> clubs(@RequestParam(defaultValue = "1") long page,
                     @RequestParam(defaultValue = "15") long size,
                     @RequestParam(required = false) String keyword) {
        return R.ok(clubService.listClubs(page, size, keyword));
    }

    @GetMapping("/clubs/joined")
    public R<?> myClubs() {
        return R.ok(clubService.myClubs(SecurityHelper.getCurrentUserId()));
    }

    @GetMapping("/clubs/{id}")
    public R<?> detail(@PathVariable Long id) {
        return R.ok(clubService.clubDetail(id));
    }

    /** 过程性材料：按时间倒序，默认每页 30 条（需求 4） */
    @GetMapping("/clubs/{id}/materials")
    public R<?> materials(@PathVariable Long id,
                          @RequestParam(defaultValue = "1") long page,
                          @RequestParam(defaultValue = "30") long size) {
        return R.ok(clubService.clubMaterials(id, page, size));
    }

    @GetMapping("/clubs/{id}/resources")
    public R<?> resources(@PathVariable Long id) {
        return R.ok(clubService.clubResources(id));
    }

    /** 学生提交过程性材料（图片 / 视频 / 文档；不支持文字叙述，直接展示） */
    @PostMapping("/clubs/{id}/materials")
    public R<?> submitMaterial(@PathVariable Long id,
                              @RequestParam(required = false) String description,
                              @RequestPart(value = "images", required = false) MultipartFile[] images,
                              @RequestPart(value = "video", required = false) MultipartFile video,
                              @RequestPart(value = "docs", required = false) MultipartFile[] docs) {
        return R.ok(clubService.submitMaterial(id, SecurityHelper.getCurrentUserId(), description, images, video, docs));
    }

    /** 社团介绍词编辑：教师 / 管理员 / 社团负责人（有权限学生） */
    @PutMapping("/clubs/{id}/intro")
    public R<?> updateIntro(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String intro = body == null ? null : body.get("intro");
        return R.ok(clubService.updateIntro(id, SecurityHelper.getCurrentUserId(), intro));
    }

    /** 撤展：材料保留但不再对外展示（作者本人 / 管理员 / 负责教师） */
    @PostMapping("/materials/{id}/hide")
    public R<?> hideMaterial(@PathVariable Long id) {
        clubService.hideMaterial(id, SecurityHelper.getCurrentUserId());
        return R.ok();
    }

    /** 删除：发现不当内容可删除（作者本人 / 管理员 / 负责教师） */
    @DeleteMapping("/materials/{id}")
    public R<?> deleteMaterial(@PathVariable Long id) {
        clubService.deleteMaterial(id, SecurityHelper.getCurrentUserId());
        return R.ok();
    }

    /** 课程资源编辑：仅发布者本人或管理员（需求 4） */
    @PutMapping("/resources/{id}")
    public R<?> updateResource(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return R.ok(clubService.updateResource(id, SecurityHelper.getCurrentUserId(),
                body == null ? null : body.get("title"),
                body == null ? null : body.get("intro"),
                body == null ? null : body.get("link")));
    }

    /** 课程资源撤下：仅发布者本人或管理员 */
    @PostMapping("/resources/{id}/hide")
    public R<?> hideResource(@PathVariable Long id) {
        clubService.hideResource(id, SecurityHelper.getCurrentUserId());
        return R.ok();
    }

    /** 课程资源删除：仅发布者本人或管理员 */
    @DeleteMapping("/resources/{id}")
    public R<?> deleteResource(@PathVariable Long id) {
        clubService.deleteResource(id, SecurityHelper.getCurrentUserId());
        return R.ok();
    }

    /** 教师发布课程资源 */
    @PostMapping("/clubs/{id}/resources")
    public R<?> addResource(@PathVariable Long id,
                            @RequestParam String title,
                            @RequestParam(required = false) String intro,
                            @RequestParam(required = false) String link,
                            @RequestPart(value = "video", required = false) MultipartFile video) {
        return R.ok(clubService.addResource(id, SecurityHelper.getCurrentUserId(), title, intro, link, video));
    }

    @GetMapping("/clubs/{id}/members")
    public R<?> members(@PathVariable Long id) {
        return R.ok(clubService.members(id, SecurityHelper.getCurrentUserId()));
    }

    @PostMapping("/clubs/{id}/members")
    public R<?> addMember(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long target = Long.valueOf(body.get("userId").toString());
        String identity = body.get("identity") == null ? "normal" : body.get("identity").toString();
        clubService.addMember(id, SecurityHelper.getCurrentUserId(), target, identity);
        return R.ok();
    }

    @DeleteMapping("/clubs/{id}/members/{userId}")
    public R<?> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        clubService.removeMember(id, SecurityHelper.getCurrentUserId(), userId);
        return R.ok();
    }

    /** 学生自助加入社团（无需审批） */
    @PostMapping("/clubs/{id}/join")
    public R<?> joinClub(@PathVariable Long id) {
        clubService.joinSelf(id, SecurityHelper.getCurrentUserId());
        return R.ok();
    }

    /** 记录一次页面访问（公开接口，用于统计每日访问次数 / 日活量） */
    @PostMapping("/visit")
    public R<?> visit(@RequestBody(required = false) Map<String, String> body) {
        String path = body == null ? null : body.get("path");
        visitService.recordVisit(path, SecurityHelper.getCurrentUserIdOpt());
        return R.ok();
    }
}
