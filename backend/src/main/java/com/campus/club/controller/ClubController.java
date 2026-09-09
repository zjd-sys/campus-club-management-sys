package com.campus.club.controller;

import com.campus.club.common.R;
import com.campus.club.dto.UserVO;
import com.campus.club.entity.Club;
import com.campus.club.entity.CourseResource;
import com.campus.club.security.SecurityHelper;
import com.campus.club.service.ClubService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portal")
public class ClubController {

    private final ClubService clubService;

    public ClubController(ClubService clubService) {
        this.clubService = clubService;
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

    @GetMapping("/clubs/{id}/materials")
    public R<?> materials(@PathVariable Long id,
                          @RequestParam(defaultValue = "1") long page,
                          @RequestParam(defaultValue = "15") long size) {
        return R.ok(clubService.clubMaterials(id, page, size));
    }

    @GetMapping("/clubs/{id}/resources")
    public R<?> resources(@PathVariable Long id) {
        return R.ok(clubService.clubResources(id));
    }

    /** 学生提交过程性材料（文/图/视频） */
    @PostMapping("/clubs/{id}/materials")
    public R<?> submitMaterial(@PathVariable Long id,
                              @RequestParam(required = false) String description,
                              @RequestPart(value = "images", required = false) MultipartFile[] images,
                              @RequestPart(value = "video", required = false) MultipartFile video) {
        return R.ok(clubService.submitMaterial(id, SecurityHelper.getCurrentUserId(), description, images, video));
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
}
