-- 校园社团管理网站 数据库结构
-- 同时兼容 MySQL 与 H2(MySQL 模式)。生产环境使用 MySQL 时执行本文件即可建表。

CREATE TABLE IF NOT EXISTS sys_user (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(64)  NOT NULL,
    password    VARCHAR(100) NOT NULL,
    role        VARCHAR(20)  NOT NULL COMMENT 'admin/teacher/student',
    name        VARCHAR(64),
    grade_id    BIGINT,
    clazz_id    BIGINT,
    age         INT,
    gender      VARCHAR(10),
    club_id     BIGINT COMMENT '教师负责社团ID',
    status      VARCHAR(20)  DEFAULT 'normal',
    fail_count  INT          DEFAULT 0,
    lock_until  DATETIME,
    create_time DATETIME,
    version     INT          DEFAULT 0,
    deleted     INT          DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_user_username ON sys_user(username);

CREATE TABLE IF NOT EXISTS grade (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(64),
    create_time DATETIME,
    deleted     INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clazz (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    grade_id    BIGINT,
    name        VARCHAR(64),
    create_time DATETIME,
    deleted     INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS club (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(128) NOT NULL,
    intro       VARCHAR(1000),
    poster      VARCHAR(500) COMMENT '社团海报URL',
    teacher_id  BIGINT COMMENT '负责教师ID',
    status      VARCHAR(20)  DEFAULT 'active',
    create_time DATETIME,
    deleted     INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS club_member (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    club_id     BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    identity    VARCHAR(20) DEFAULT 'normal' COMMENT 'normal/leader',
    join_time   DATETIME,
    deleted     INT DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_member ON club_member(club_id, user_id);

CREATE TABLE IF NOT EXISTS material (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    club_id       BIGINT NOT NULL,
    description   VARCHAR(1000),
    image_url     VARCHAR(1500) COMMENT '多张逗号分隔',
    video_url     VARCHAR(500),
    submit_time   DATETIME,
    display_status INT DEFAULT 1 COMMENT '1公开/0隐藏',
    review_status VARCHAR(20) DEFAULT 'passed' COMMENT 'pending/passed/rejected/removed',
    deleted       INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS course_resource (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    club_id       BIGINT NOT NULL,
    teacher_id    BIGINT,
    title         VARCHAR(255),
    intro         VARCHAR(1000),
    link          VARCHAR(500),
    video_url     VARCHAR(500),
    publish_time  DATETIME,
    display_status INT DEFAULT 1 COMMENT '1上架/0下架',
    review_status VARCHAR(20) DEFAULT 'passed' COMMENT 'pending/passed/removed',
    deleted       INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS captcha (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    captcha_id  VARCHAR(64) NOT NULL,
    code        VARCHAR(16) NOT NULL,
    create_time DATETIME,
    expire_time DATETIME,
    deleted     INT DEFAULT 0
);
