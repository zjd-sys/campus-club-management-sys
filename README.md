# 校园社团综合管理系统

基于四份设计文档（需求与技术设计、整体架构与技术方案、UI 设计规范、用户信息安全策略）落地的全栈实现。

- **门户端**（学生 / 教师）：社团浏览、过程性材料提交、课程资源、社团成员管理、个人档案
- **管理端**（超级管理员）：用户管理、社团管理、内容后置审核、年级班级维护
- **后端**：Spring Boot 3.2 + MyBatis-Plus + JWT + BCrypt + RBAC 三角色隔离

---

## 一、快速启动（默认 H2 内存库，开箱即用）

### 1. 启动后端

```bash
cd backend
mvn -DskipTests package
java -jar target/campus-club-backend.jar
```

启动成功后监听 `http://localhost:8080`，并自动写入初始化账号与示例社团。

### 2. 启动门户前端

```bash
cd portal-web
npm install
npm run dev        # http://localhost:5173
```

### 3. 启动管理前端

```bash
cd admin-web
npm install
npm run dev        # http://localhost:5174
```

> 前端通过 `http://localhost:8080` 直连后端，已开启 CORS。

### 可选：注入演示数据

H2 为内存库，**每次重启数据会重置**。重启后端后若想让页面有内容可看，执行：

```bash
python tools/seed_demo.py
```

脚本会为 5 个社团绑定负责教师、加入 3 名学生，并注入 10 条过程性材料与 5 条课程资源（纯标准库，无需安装依赖）。

> 注意：若用 curl 提交中文内容出现乱码，是 Windows 版 curl 按 ANSI 编码发送所致，
> 浏览器与 `tools/seed_demo.py` 均按 UTF-8 提交，服务端存取正常。

### 默认账号（初始密码统一 `123456`）

| 角色 | 账号 | 说明 |
|------|------|------|
| 超级管理员 | `admin` | 管理端登录需额外输入**管理员密钥** `admin123` |
| 教师 | `teacher` | 门户端，负责文学社，可发布资源、管理成员 |
| 学生 | `student` / `lisi` / `wangwu` | 门户端，可提交过程性材料 |

---

## 二、项目结构

```
campus-club-management-sys/
├── backend/                       # Spring Boot 后端
│   └── src/main/java/com/campus/club/
│       ├── common/                # 统一响应 R、分页、全局异常
│       ├── config/                # MyBatis-Plus、Web、数据初始化
│       ├── controller/            # Auth / Profile / Club / Admin 控制器
│       ├── dto/                   # 请求与视图对象
│       ├── entity/                # 8 张表实体
│       ├── mapper/                # MyBatis-Plus Mapper
│       ├── security/              # JWT、验证码、登录防护、鉴权拦截
│       ├── storage/               # 本地存储 / MinIO 可切换
│       └── service/               # 业务逻辑
│   └── src/main/resources/db/     # MySQL 建表脚本
├── portal-web/                    # 门户前端（React + Vite + AntD）
├── admin-web/                     # 管理前端（React + Vite + AntD）
├── sql/                           # 数据库脚本
└── API_CONTRACT.md                # 前后端接口契约
```

---

## 三、已实现功能

### 门户端（学生 / 教师）

| 模块 | 功能 |
|------|------|
| 认证 | 账号密码登录、动态图形验证码、注册建档 |
| 首页 | 轮播横幅 + 全校社团卡片网格，点击进入社团详情（**游客可浏览**） |
| 社团详情 | 海报轮播、Tabs（过程性内容 / 材料提交 / 课程资源 / 成员管理）（**游客可浏览**） |
| 导航栏 | 左起：Logo 预留区 / 首页 / 我的社团 / 个人中心（未登录显示「请登录」） |
| 我的社团 | 查数据库取当前用户已加入（教师为负责）的社团：单个直达、多个下拉选择、未登录跳登录页 |
| 过程性材料 | 文字 + 图片 + 视频提交，最新置顶，15 条/页 |
| 课程资源 | 教师发布（标题/简介/学习链接/视频），学生浏览 |
| 成员管理 | 负责教师添加/移除社团成员 |
| 个人中心 | 档案展示与编辑、我的材料检索（**未登录时页面内提示「请登录」**） |

**访问策略**：首页与社团详情页公开，无需登录；个人中心、材料提交、成员管理等需登录。
后端放行 `GET /clubs`、`GET /clubs/{id}`、`GET /clubs/{id}/materials`、`GET /clubs/{id}/resources`，
`/clubs/joined` 及其余门户接口仍需令牌。未携带或无效令牌访问受保护接口返回 401。

### 管理端（超级管理员）

| 模块 | 功能 |
|------|------|
| 登录 | 账号 + 密码 + **管理员密钥**三重校验 |
| 仪表盘 | 用户/社团/材料/资源/待审核数量统计 |
| 用户管理 | 增删改查、按角色与关键词筛选、状态标记 |
| 社团管理 | 增删改查、负责教师指派 |
| 内容审核 | 材料与资源的通过 / 驳回 / 下架，按状态筛选 |
| 年级班级 | 年级与班级层级维护 |

---

## 四、安全策略落地情况

| 策略 | 实现 |
|------|------|
| 密码存储 | BCrypt 强哈希，明文不落库 |
| 登录失败延时 | 后端固定延时 1000ms 后返回（实测 1.03s） |
| IP 限流 | 单 IP 每分钟最多 8 次登录尝试 |
| 账号锁定 | 连续失败 5 次锁定 10 分钟 |
| 动态验证码 | 图形验证码，2 分钟有效，一次性消费 |
| 管理员双重验证 | 账号密码 + 独立管理密钥 |
| 角色隔离 | 学生令牌访问 `/api/admin/**` 直接 403 |
| 传输安全 | 生产环境建议前置 Nginx 配置 HTTPS |
| SQL 注入 | 全参数化查询（MyBatis-Plus） |

---

## 五、切换到生产环境（MySQL + MinIO）

### 1. MySQL

```bash
mysql -u root -p < sql/schema.sql
```

修改 `backend/src/main/resources/application.yml`：

```yaml
spring:
  profiles:
    active: mysql
  datasource:
    url: jdbc:mysql://localhost:3306/campus_club?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: your_user
    password: your_password
```

### 2. MinIO 对象存储

```yaml
storage:
  type: minio          # local | minio
  minio:
    endpoint: http://localhost:9000
    access-key: minioadmin
    secret-key: minioadmin
    bucket: campus-club
```

切换后 `LocalStorageServiceImpl` 自动失效，`MinioStorageServiceImpl` 接管，业务代码无感知。

### 3. 安全加固（上线前必改）

```yaml
jwt:
  secret: <改为 32 位以上随机字符串>
admin-secret: <改为强密钥>
```

建议通过环境变量注入：`JWT_SECRET`、`ADMIN_SECRET`。

---

## 六、技术栈

| 层 | 技术 |
|----|------|
| 门户/管理前端 | React 18、Vite 5、Ant Design 5、React Router 6、Axios |
| 后端 | Spring Boot 3.2.5、MyBatis-Plus 3.5.7、Spring Security 6 |
| 认证 | JWT（jjwt 0.11.5）、BCrypt |
| 数据库 | MySQL 8（生产）/ H2（本地开发） |
| 文件存储 | MinIO（生产）/ 本地磁盘（本地开发） |

---

## 七、UI 规范遵循

- 主色 `#4096ff`，辅助色 `#67c23a`，警示色 `#f56c6c`
- 页面底色 `#f5f7fa`，卡片纯白；门户端 8px 圆角 + 浅阴影，管理端 4px 圆角、线条分栏
- 全站统一分页 **15 条/页**
- 字体微软雅黑，AntD 中文 locale
