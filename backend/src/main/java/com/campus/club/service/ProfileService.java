package com.campus.club.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.support.SFunction;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.club.common.PageResult;
import com.campus.club.dto.MaterialVO;
import com.campus.club.dto.ProfileUpdateRequest;
import com.campus.club.dto.UserVO;
import com.campus.club.entity.Material;
import com.campus.club.entity.User;
import com.campus.club.mapper.MaterialMapper;
import com.campus.club.mapper.UserMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final UserMapper userMapper;
    private final MaterialMapper materialMapper;
    private final VoBuilder voBuilder;

    public ProfileService(UserMapper userMapper, MaterialMapper materialMapper, VoBuilder voBuilder) {
        this.userMapper = userMapper;
        this.materialMapper = materialMapper;
        this.voBuilder = voBuilder;
    }

    public UserVO getProfile(Long uid) {
        return voBuilder.toUserVO(userMapper.selectById(uid));
    }

    public UserVO updateProfile(Long uid, ProfileUpdateRequest req) {
        User u = userMapper.selectById(uid);
        if (u == null) throw new com.campus.club.common.BizException("用户不存在");
        if (req.getName() != null) u.setName(req.getName());
        if (req.getAge() != null) u.setAge(req.getAge());
        if (req.getGender() != null) u.setGender(req.getGender());
        if (req.getGradeId() != null) u.setGradeId(req.getGradeId());
        if (req.getClazzId() != null) u.setClazzId(req.getClazzId());
        userMapper.updateById(u);
        return voBuilder.toUserVO(u);
    }

    public PageResult<MaterialVO> myMaterials(Long uid, long page, long size, String keyword) {
        LambdaQueryWrapper<Material> w = new LambdaQueryWrapper<Material>()
                .eq(Material::getUserId, uid)
                .orderByDesc(Material::getSubmitTime);
        if (keyword != null && !keyword.isBlank()) {
            w.like(Material::getDescription, keyword);
        }
        IPage<Material> ip = materialMapper.selectPage(new Page<>(page, size), w);
        List<MaterialVO> list = ip.getRecords().stream().map(voBuilder::toMaterialVO).collect(Collectors.toList());
        return PageResult.of(list, ip.getTotal(), page, size);
    }
}
