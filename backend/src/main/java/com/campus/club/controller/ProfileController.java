package com.campus.club.controller;

import com.campus.club.common.R;
import com.campus.club.dto.ProfileUpdateRequest;
import com.campus.club.security.SecurityHelper;
import com.campus.club.service.ProfileService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/portal")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/profile")
    public R<?> profile() {
        return R.ok(profileService.getProfile(SecurityHelper.getCurrentUserId()));
    }

    @PutMapping("/profile")
    public R<?> update(@RequestBody ProfileUpdateRequest req) {
        return R.ok(profileService.updateProfile(SecurityHelper.getCurrentUserId(), req));
    }

    @GetMapping({"/materials/mine", "/material/mine"})
    public R<?> myMaterials(@RequestParam(defaultValue = "1") long page,
                            @RequestParam(defaultValue = "15") long size,
                            @RequestParam(required = false) String keyword) {
        return R.ok(profileService.myMaterials(SecurityHelper.getCurrentUserId(), page, size, keyword));
    }
}
