package com.campus.club.controller;

import com.campus.club.common.R;
import com.campus.club.dto.AdminUserRequest;
import com.campus.club.entity.Clazz;
import com.campus.club.entity.Club;
import com.campus.club.entity.Grade;
import com.campus.club.entity.SysConfig;
import com.campus.club.security.SecurityHelper;
import com.campus.club.service.AdminAccountService;
import com.campus.club.service.ClubService;
import com.campus.club.service.StorageAdminService;
import com.campus.club.service.SysConfigService;
import com.campus.club.service.UserService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final ClubService clubService;
    private final SysConfigService sysConfigService;
    private final StorageAdminService storageAdminService;
    private final AdminAccountService adminAccountService;

    public AdminController(UserService userService, ClubService clubService,
                           SysConfigService sysConfigService, StorageAdminService storageAdminService,
                           AdminAccountService adminAccountService) {
        this.userService = userService;
        this.clubService = clubService;
        this.sysConfigService = sysConfigService;
        this.storageAdminService = storageAdminService;
        this.adminAccountService = adminAccountService;
    }

    // ===================== 系统设置（系统名称 / Logo / 背景图 / 横幅） =====================
    @GetMapping("/settings")
    public R<?> settings() {
        return R.ok(sysConfigService.get());
    }

    @PutMapping("/settings")
    public R<?> updateSettings(@RequestBody SysConfig req) {
        return R.ok(sysConfigService.update(req));
    }

    /** 上传并替换某项资源：field = logo | background | banner */
    @PostMapping("/settings/resource")
    public R<?> uploadSettingResource(@RequestParam String field,
                                      @RequestPart("file") MultipartFile file) {
        Map<String, Object> up = storageAdminService.upload(file, "system");
        String url = (String) up.get("url");
        return R.ok(sysConfigService.setResource(field, url));
    }

    /** 清除某项资源引用：field = logo | background | banner */
    @DeleteMapping("/settings/resource")
    public R<?> clearSettingResource(@RequestParam String field) {
        return R.ok(sysConfigService.setResource(field, null));
    }

    // ===================== 文件资源管理（查看 / 上传 / 删除） =====================
    @GetMapping("/files")
    public R<?> files() {
        return R.ok(storageAdminService.list());
    }

    @PostMapping("/files/upload")
    public R<?> uploadFile(@RequestParam(required = false) String subDir,
                           @RequestPart("file") MultipartFile file) {
        return R.ok(storageAdminService.upload(file, subDir));
    }

    @DeleteMapping("/files")
    public R<?> deleteFile(@RequestParam String path) {
        storageAdminService.delete(path);
        return R.ok();
    }

    // ===================== 管理员组管理（仅超级管理员） =====================
    // 权限双层保障：
    //   1) SecurityConfig 将 /api/admin/admins/** 限定为 ROLE_SUPER_ADMIN（普通管理员 403）；
    //   2) AdminAccountService 每次操作前回库校验操作者层级（超管被降级后旧令牌立即失效）。
    // 普通管理员之间互不可管理，只能通过 /api/admin/me/token 修改自身令牌。

    /** 当前登录管理员信息（含层级），所有管理员可用 */
    @GetMapping("/me")
    public R<?> me() {
        return R.ok(adminAccountService.me(SecurityHelper.getCurrentUserId()));
    }

    /** 修改自身的超级管理员令牌（所有管理员可用，需校验旧令牌） */
    @PutMapping("/me/token")
    public R<?> changeOwnToken(@RequestBody Map<String, String> body) {
        adminAccountService.changeOwnSecret(SecurityHelper.getCurrentUserId(),
                body.get("oldSecret"), body.get("newSecret"));
        return R.ok();
    }

    @GetMapping("/admins")
    public R<?> admins() {
        return R.ok(adminAccountService.listAdmins(SecurityHelper.getCurrentUserId()));
    }

    /** 创建管理员账号并生成管理员令牌（明文仅返回一次） */
    @PostMapping("/admins")
    public R<?> createAdmin(@RequestBody Map<String, String> body) {
        return R.ok(adminAccountService.createAdmin(SecurityHelper.getCurrentUserId(),
                body.get("username"), body.get("password"), body.get("name"),
                body.get("secret"), body.get("adminLevel")));
    }

    /** 设置管理员层级：super=提拔为超级管理员 / normal=降为普通管理员 */
    @PutMapping("/admins/{id}/level")
    public R<?> updateAdminLevel(@PathVariable Long id, @RequestBody Map<String, String> body) {
        adminAccountService.updateLevel(SecurityHelper.getCurrentUserId(), id, body.get("adminLevel"));
        return R.ok();
    }

    /** 启用 / 禁用管理员账号 */
    @PutMapping("/admins/{id}/status")
    public R<?> updateAdminStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        adminAccountService.updateStatus(SecurityHelper.getCurrentUserId(), id, body.get("status"));
        return R.ok();
    }

    /** 重置指定管理员的令牌（明文仅返回一次） */
    @PostMapping("/admins/{id}/token")
    public R<?> resetAdminToken(@PathVariable Long id) {
        return R.ok(adminAccountService.resetToken(SecurityHelper.getCurrentUserId(), id));
    }

    /** 删除管理员账号 */
    @DeleteMapping("/admins/{id}")
    public R<?> deleteAdmin(@PathVariable Long id) {
        adminAccountService.deleteAdmin(SecurityHelper.getCurrentUserId(), id);
        return R.ok();
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
