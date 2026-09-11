package com.campus.club.service;

import com.campus.club.dto.MaterialVO;
import com.campus.club.dto.UserVO;
import com.campus.club.entity.Club;
import com.campus.club.entity.Clazz;
import com.campus.club.entity.Grade;
import com.campus.club.entity.Material;
import com.campus.club.entity.User;
import com.campus.club.mapper.ClazzMapper;
import com.campus.club.mapper.ClubMapper;
import com.campus.club.mapper.GradeMapper;
import com.campus.club.mapper.UserMapper;
import org.springframework.stereotype.Component;

/** 视图对象装配：避免 Controller 直接拼装，统一命名/脱敏 */
@Component
public class VoBuilder {

    private final UserMapper userMapper;
    private final ClubMapper clubMapper;
    private final GradeMapper gradeMapper;
    private final ClazzMapper clazzMapper;

    public VoBuilder(UserMapper userMapper, ClubMapper clubMapper, GradeMapper gradeMapper, ClazzMapper clazzMapper) {
        this.userMapper = userMapper;
        this.clubMapper = clubMapper;
        this.gradeMapper = gradeMapper;
        this.clazzMapper = clazzMapper;
    }

    public UserVO toUserVO(User u) {
        if (u == null) return null;
        UserVO v = UserVO.from(u);
        if (u.getGradeId() != null) {
            Grade g = gradeMapper.selectById(u.getGradeId());
            if (g != null) v.setGradeName(g.getName());
        }
        if (u.getClazzId() != null) {
            Clazz c = clazzMapper.selectById(u.getClazzId());
            if (c != null) v.setClazzName(c.getName());
        }
        if (u.getClubId() != null) {
            Club club = clubMapper.selectById(u.getClubId());
            if (club != null) v.setClubName(club.getName());
        }
        return v;
    }

    public MaterialVO toMaterialVO(Material m) {
        MaterialVO v = new MaterialVO();
        v.setId(m.getId());
        v.setUserId(m.getUserId());
        v.setClubId(m.getClubId());
        v.setDescription(m.getDescription());
        v.setImageUrl(m.getImageUrl());
        v.setVideoUrl(m.getVideoUrl());
        v.setDocUrl(m.getDocUrl());
        v.setSubmitTime(m.getSubmitTime());
        v.setReviewStatus(m.getReviewStatus());
        v.setDisplayStatus(m.getDisplayStatus());

        User u = userMapper.selectById(m.getUserId());
        v.setUserName(u != null ? u.getName() : "未知用户");
        Club club = clubMapper.selectById(m.getClubId());
        v.setClubName(club != null ? club.getName() : "未知社团");
        return v;
    }
}
