package com.campus.club.controller;

import com.campus.club.common.R;
import com.campus.club.dto.AdminUserRequest;
import com.campus.club.entity.Clazz;
import com.campus.club.entity.Club;
import com.campus.club.entity.Grade;
import com.campus.club.service.ClubService;
import com.campus.club.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final ClubService clubService;

    public AdminController(UserService userService, ClubService clubService) {
        this.userService = userService;
        this.clubService = clubService;
    }

    // ===================== 用户管理 =====================
    @GetMapping("/users")
    public R<?> users(@RequestParam(defaultValue = "1") long page,
                      @RequestParam(defaultValue = "15") long size,
                      @RequestParam(required = false) String role,
                      @RequestParam(required = false) String keyword) {
        return R.ok(userService.listUsers(page, size, role, keyword));
    }

    @PostMapping("/users")
    public R<?> createUser(@RequestBody AdminUserRequest req) {
        return R.ok(userService.createUser(req));
    }

    @PutMapping("/users/{id}")
    public R<?> updateUser(@PathVariable Long id, @RequestBody AdminUserRequest req) {
        return R.ok(userService.updateUser(id, req));
    }

    @DeleteMapping("/users/{id}")
    public R<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return R.ok();
    }

    // ===================== 社团管理 =====================
    @GetMapping("/clubs")
    public R<?> clubs(@RequestParam(defaultValue = "1") long page,
                      @RequestParam(defaultValue = "15") long size) {
        return R.ok(clubService.listClubs(page, size, null));
    }

    @PostMapping("/clubs")
    public R<?> createClub(@RequestBody Club club) {
        return R.ok(clubService.createClub(club));
    }

    @PutMapping("/clubs/{id}")
    public R<?> updateClub(@PathVariable Long id, @RequestBody Club club) {
        return R.ok(clubService.updateClub(id, club));
    }

    @DeleteMapping("/clubs/{id}")
    public R<?> deleteClub(@PathVariable Long id) {
        clubService.deleteClub(id);
        return R.ok();
    }

    // ===================== 内容审核 =====================
    @GetMapping("/review/materials")
    public R<?> reviewMaterials(@RequestParam(defaultValue = "1") long page,
                                @RequestParam(defaultValue = "15") long size,
                                @RequestParam(required = false) String reviewStatus) {
        return R.ok(clubService.reviewMaterials(page, size, reviewStatus));
    }

    @PostMapping("/review/materials/{id}")
    public R<?> reviewMaterial(@PathVariable Long id, @RequestBody Map<String, String> body) {
        clubService.reviewMaterial(id, body.get("action"));
        return R.ok();
    }

    @GetMapping("/review/resources")
    public R<?> reviewResources(@RequestParam(defaultValue = "1") long page,
                                @RequestParam(defaultValue = "15") long size,
                                @RequestParam(required = false) String reviewStatus) {
        return R.ok(clubService.reviewResources(page, size, reviewStatus));
    }

    @PostMapping("/review/resources/{id}")
    public R<?> reviewResource(@PathVariable Long id, @RequestBody Map<String, String> body) {
        clubService.reviewResource(id, body.get("action"));
        return R.ok();
    }

    @GetMapping("/stats")
    public R<?> stats() {
        return R.ok(clubService.stats());
    }

    // ===================== 年级 / 班级 =====================
    @GetMapping("/grades")
    public R<?> grades() {
        return R.ok(userService.grades());
    }

    @PostMapping("/grades")
    public R<?> createGrade(@RequestParam String name) {
        return R.ok(userService.createGrade(name));
    }

    @DeleteMapping("/grades/{id}")
    public R<?> deleteGrade(@PathVariable Long id) {
        userService.deleteGrade(id);
        return R.ok();
    }

    @GetMapping("/clazzes")
    public R<?> clazzes(@RequestParam(required = false) Long gradeId) {
        return R.ok(userService.clazzes(gradeId));
    }

    @PostMapping("/clazzes")
    public R<?> createClazz(@RequestParam Long gradeId, @RequestParam String name) {
        return R.ok(userService.createClazz(gradeId, name));
    }

    @DeleteMapping("/clazzes/{id}")
    public R<?> deleteClazz(@PathVariable Long id) {
        userService.deleteClazz(id);
        return R.ok();
    }
}
