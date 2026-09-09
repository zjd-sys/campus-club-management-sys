-- =============================================================
-- 校园社团综合管理系统 — MySQL 8 建表脚本
-- 用法：mysql -u root -p < sql/schema.sql
-- 说明：表结构与后端实体一一对应；首次启动应用会自动写入
--       默认账号（admin/teacher/student，密码 123456，BCrypt 加密）。
-- =============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 用户表（三类角色：admin / teacher / student）
CREATE TABLE IF NOT EXISTS `sys_user` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `username`    VARCHAR(64)  NOT NULL                COMMENT '登录账号',
    `password`    VARCHAR(100) NOT NULL                COMMENT 'BCrypt 密码哈希',
    `role`        VARCHAR(20)  NOT NULL                COMMENT 'admin/teacher/student',
    `name`        VARCHAR(64)                          COMMENT '姓名',
    `grade_id`    BIGINT                               COMMENT '年级ID',
    `clazz_id`    BIGINT                               COMMENT '班级ID',
    `age`         INT                                  COMMENT '年龄',
    `gender`      VARCHAR(10)                          COMMENT '性别',
    `club_id`     BIGINT                               COMMENT '教师负责社团ID',
    `status`      VARCHAR(20)  DEFAULT 'normal'        COMMENT 'normal/disabled',
    `fail_count`  INT          DEFAULT 0               COMMENT '连续登录失败次数',
    `lock_until`  DATETIME                             COMMENT '锁定截止时刻',
    `create_time` DATETIME                             COMMENT '创建时间',
    `version`     INT          DEFAULT 0               COMMENT '乐观锁',
    `deleted`     INT          DEFAULT 0               COMMENT '逻辑删除标记',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_username` (`username`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '用户表';

-- 年级
CREATE TABLE IF NOT EXISTS `grade` (
    `id`          BIGINT      NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(64) COMMENT '年级名称',
    `create_time` DATETIME,
    `deleted`     INT DEFAULT 0,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '年级表';

-- 班级（挂载在年级下）
CREATE TABLE IF NOT EXISTS `clazz` (
    `id`          BIGINT      NOT NULL AUTO_INCREMENT,
    `grade_id`    BIGINT COMMENT '所属年级ID',
    `name`        VARCHAR(64) COMMENT '班级名称',
    `create_time` DATETIME,
    `deleted`     INT DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_clazz_grade` (`grade_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '班级表';

-- 社团
CREATE TABLE IF NOT EXISTS `club` (
    `id`          BIGINT        NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(128)  NOT NULL COMMENT '社团名称',
    `intro`       VARCHAR(1000)          COMMENT '社团简介',
    `poster`      VARCHAR(500)           COMMENT '社团海报URL',
    `teacher_id`  BIGINT                 COMMENT '负责教师ID',
    `status`      VARCHAR(20) DEFAULT 'active' COMMENT 'active/inactive',
    `create_time` DATETIME,
    `deleted`     INT DEFAULT 0,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '社团表';

-- 社团成员
CREATE TABLE IF NOT EXISTS `club_member` (
    `id`         BIGINT      NOT NULL AUTO_INCREMENT,
    `club_id`    BIGINT      NOT NULL COMMENT '社团ID',
    `user_id`    BIGINT      NOT NULL COMMENT '用户ID',
    `identity`   VARCHAR(20) DEFAULT 'normal' COMMENT 'normal/leader',
    `join_time`  DATETIME,
    `deleted`    INT DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_member` (`club_id`, `user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '社团成员表';

-- 过程性材料（文 / 图 / 视频）
CREATE TABLE IF NOT EXISTS `material` (
    `id`             BIGINT        NOT NULL AUTO_INCREMENT,
    `user_id`        BIGINT        NOT NULL COMMENT '提交人ID',
    `club_id`        BIGINT        NOT NULL COMMENT '所属社团ID',
    `description`    VARCHAR(1000)          COMMENT '文字描述',
    `image_url`      VARCHAR(1500)          COMMENT '图片URL，多张逗号分隔',
    `video_url`      VARCHAR(500)           COMMENT '视频URL',
    `submit_time`    DATETIME,
    `display_status` INT          DEFAULT 1 COMMENT '1公开 / 0隐藏',
    `review_status`  VARCHAR(20)  DEFAULT 'passed' COMMENT 'pending/passed/rejected/removed',
    `deleted`        INT          DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_material_club` (`club_id`),
    KEY `idx_material_user` (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '过程性材料表';

-- 课程资源
CREATE TABLE IF NOT EXISTS `course_resource` (
    `id`             BIGINT        NOT NULL AUTO_INCREMENT,
    `club_id`        BIGINT        NOT NULL COMMENT '所属社团ID',
    `teacher_id`     BIGINT                 COMMENT '发布教师ID',
    `title`          VARCHAR(255)           COMMENT '资源标题',
    `intro`          VARCHAR(1000)          COMMENT '资源简介',
    `link`           VARCHAR(500)           COMMENT '学习链接',
    `video_url`      VARCHAR(500)           COMMENT '视频URL',
    `publish_time`   DATETIME,
    `display_status` INT          DEFAULT 1 COMMENT '1上架 / 0下架',
    `review_status`  VARCHAR(20)  DEFAULT 'passed' COMMENT 'pending/passed/removed',
    `deleted`        INT          DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_resource_club` (`club_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '课程资源表';

-- 图形验证码（2 分钟有效，一次性消费）
CREATE TABLE IF NOT EXISTS `captcha` (
    `id`          BIGINT      NOT NULL AUTO_INCREMENT,
    `captcha_id`  VARCHAR(64) NOT NULL COMMENT '验证码标识',
    `code`        VARCHAR(16) NOT NULL COMMENT '验证码文本',
    `create_time` DATETIME,
    `expire_time` DATETIME,
    `deleted`     INT DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_captcha_id` (`captcha_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '图形验证码表';

SET FOREIGN_KEY_CHECKS = 1;
