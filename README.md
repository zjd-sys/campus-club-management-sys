# 校园社团综合管理系统

面向校园场景的全栈社团管理平台：**学生**加入社团、上传过程性材料；**教师**发布课程资源、管理成员；**超级管理员**在后台管理用户、社团、内容、文件、系统品牌配置与**管理员组**。

- **门户端**（学生 / 教师）：社团浏览、我的社团 / 招新、过程性材料上传与展示、课程资源、个人档案
- **管理端**：管理员分**超级管理员 / 普通管理员**两个层级——超管可管理整个管理员组（增删管理员、升降级、启停、重置他人令牌）+ 系统设置 + 文件资源；**普通管理员彼此之间互不可管理**
- **管理端模块**：用户管理、社团管理、内容审核、年级班级、我的账号、文件资源（超管）、管理员与令牌（超管）、系统设置（超管）
- **后端**：Spring Boot 3.2 + MyBatis-Plus + JWT + BCrypt + RBAC 三角色隔离
- **可迁移**：所有资源引用均为相对路径或环境变量占位，Windows / Linux 均可直接部署，开箱即用

---

## 目录

1. [环境准备](#一环境准备)
2. [快速开始](#二快速开始)
3. [演示账号（完整生态）](#三演示账号完整生态)
4. [配置与环境变量](#四配置与环境变量)
5. [功能清单](#五功能清单)
6. [管理员权限层级（超管 vs 普通管理员）](#六管理员权限层级超管-vs-普通管理员)
7. [超级管理员后台能力](#七超级管理员后台能力)
8. [部署（Windows / Linux）](#八部署windows--linux)
9. [跨环境迁移说明](#九跨环境迁移说明)
10. [目录结构](#十目录结构)
11. [技术栈与安全策略](#十一技术栈与安全策略)
12. [常见问题](#十二常见问题)
13. [冒烟自测](#十三冒烟自测)

---

## 一、环境准备

| 依赖 | 版本要求 | 说明 | 下载 |
|------|----------|------|------|
| JDK | **17+** | 后端运行/编译 | https://adoptium.net |
| Maven | **3.8+** | 后端构建（也可用 IDE 内置） | https://maven.apache.org |
| Node.js | **18+**（推荐 20/22） | 前端构建与开发服务器 | https://nodejs.org |
| MySQL | 8.x（**可选**） | 仅生产部署需要；本地开发默认用 H2 内存库 | https://dev.mysql.com |
| MinIO / S3 | 任意（**可选**） | 仅当需要对象存储时启用；默认用本地磁盘 | https://min.io |

### 检查环境

```bash
java -version      # 需 17+
mvn -v             # 需 3.8+
node -v && npm -v  # 需 18+
```

### Windows 环境注意事项

- 请使用 **PowerShell** 或 **CMD**，并确保 `java`、`mvn`、`node` 已加入 `PATH`。
- 本项目全部使用 `java.nio.file.Paths` 处理路径，**不写死盘符与反斜杠**，Windows 下无需改动任何配置。
- 若 PowerShell 执行策略阻止脚本，可执行：`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`。

### Linux 环境注意事项

- 建议使用发行版自带的 OpenJDK 17：`sudo apt install openjdk-17-jdk maven`（Debian/Ubuntu）。
- Node.js 建议通过 nvm 或 NodeSource 安装 18+。
- 若用 systemd 托管后端，见 [第七章](#七部署windows--linux)。

---

## 二、快速开始

### 方式 A：一键脚本（推荐）

**Linux / macOS**

```bash
bash scripts/start-dev.sh      # 构建后端 + 启动后端 + 启动两个前端
```

**Windows**

```bat
scripts\start-dev.bat
```

启动后访问：

| 端 | 地址 |
|----|------|
| 门户端（学生 / 教师） | http://localhost:5173 |
| 管理后台（超级管理员） | http://localhost:5174 |
| 后端接口 | http://localhost:8080/api/portal/clubs |
| H2 控制台（仅 dev） | http://localhost:8080/h2-console |

> 默认使用 **H2 内存库**，启动即自动建表并灌入完整演示数据，无需安装数据库。
> H2 为内存库，**重启后端数据会重置**为初始演示数据。

### 方式 B：手动分步启动

**1）后端**

```bash
cd backend
mvn -DskipTests package
java -jar target/campus-club-backend.jar --server.port=8080
```

**2）门户前端**

```bash
cd portal-web
npm install
npm run dev            # http://localhost:5173
```

**3）管理前端**

```bash
cd admin-web
npm install
npm run dev            # http://localhost:5174
```

前端默认使用**相对路径** `/api/**`、`/files/**`，由 Vite 开发代理转发到 `http://localhost:8080`，
代码中不含任何硬编码域名或端口（详见 [第八章](#八跨环境迁移说明)）。

### 方式 C：生产构建

```bash
bash scripts/build-all.sh        # Linux / macOS
scripts\build-all.bat            # Windows
```

产物：

```
backend/target/campus-club-backend.jar
portal-web/dist
admin-web/dist
```

---

## 三、演示账号（完整生态）

> dev（H2）环境启动即自动灌入下列账号与数据，**任意账号登录均可完整演示其功能**（账号相互独立、数据彼此关联成完整业务闭环）。
> **所有账号初始密码统一为 `123456`。**

| 角色 | 账号 | 姓名 | 预置业务数据（登录即可演示） |
|------|------|------|------------------------------|
| 超级管理员 | `admin` | 超级管理员 | 管理员令牌 `admin123`；全站配置、全部用户/社团/文件资源管理权限 |
| 超级管理员 | `admin2` | 教务管理员 | 管理员令牌 `admin2-secret`；演示多管理员与令牌重置 |
| 教师 | `teacher` | 王老师 | 负责**文学社**，已发布 2 条课程资源；可管理成员、编辑简介 |
| 教师 | `lilaoshi` | 李老师 | 负责**篮球社**，已发布 2 条课程资源 |
| 教师 | `chenlaoshi` | 陈老师 | 负责**科技创新社**，已发布 2 条课程资源 |
| 教师 | `zhaolaoshi` | 赵老师 | 负责**音乐社**，已发布 2 条课程资源 |
| 教师 | `liulaoshi` | 刘老师 | 负责**美术社**，已发布 2 条课程资源 |
| 学生 | `student` | 张三 | 25届 2501 班，**文学社**负责人，1 条过程性材料 |
| 学生 | `lisi` | 李四 | 25届 2501 班，文学社，1 条材料 |
| 学生 | `zhengshi` | 郑十 | 25届 2501 班，文学社，1 条材料 + 1 条已撤展材料 |
| 学生 | `sunqi` | 孙七 | 25届 2501 班，**科技创新社**负责人，多条材料（演示完整流程主角） |
| 学生 | `jiangwu` | 蒋五 | 25届 2501 班，美术社负责人 |
| 学生 | `zhouba` | 周八 | 25届 2502 班，篮球社负责人 |
| 学生 | `fengyi` / `wujiu` | 冯一 / 吴九 | 25届 2502 班，篮球社 / 科技创新社 |
| 学生 | `chener` / `wanger` | 陈二 / 王二 | 25届 2503 班，科技创新社 / 美术社 |
| 学生 | `wangwu` / `chusan` / `weisi` | 王五 / 褚三 / 卫四 | 26届 2601 班，篮球社 / 音乐社 / 音乐社 |

**数据规模（体现真实运行态与联动关系）**

- 5 个社团，**每个社团**都具备：负责教师、成员（2~3 人）、过程性材料、课程资源 —— 不存在“半成品”社团。
- **每名学生均至少加入一个社团**，因此「我的社团 / 招新」「上传材料」「我的材料」对所有学生账号均可用。
- 科技创新社过程性材料 **> 30 条**，用于演示展示页「30 条/页」分页。
- 含 **1 条已撤展材料**，使后台「已撤回材料」指标为真实运行态数据。
- 近 14 天访问日志，使仪表盘**饼图（各社团占比）/ 直方图（各社团人数）/ 日活量 DAU** 呈现真实数据。
- 分类规范：年级为「25届 / 26届」，班级为「2501 / 2502 / 2503 / 2601」。

> 生产（`mysql` profile）**不灌入任何演示数据**，测试数据与主库严格隔离，无数据即留空。

---

## 四、配置与环境变量

### 后端（`backend/src/main/resources/application*.yml`）

所有配置项均支持**环境变量注入**，未设置时使用安全默认值：

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `SERVER_PORT` | `8080` | 后端端口 |
| `JWT_SECRET` | 内置开发密钥 | JWT 签名密钥，**生产必须修改**（≥32 字节） |
| `ADMIN_SECRET` | `admin123` | 全局管理员回退密钥（管理员未配置独立令牌时使用） |
| `STORAGE_TYPE` | `local` | 存储方式：`local`（本地磁盘）/ `minio`（对象存储） |
| `STORAGE_LOCAL_PATH` | `./uploads` | 本地存储目录（相对或绝对路径均可） |
| `APP_CORS_ALLOWED_ORIGINS` | `*` | 跨域白名单，逗号分隔 |
| `DB_HOST` / `DB_PORT` | `localhost` / `3306` | MySQL 地址（`mysql` profile） |
| `DB_NAME` | `campus_club` | 数据库名 |
| `DB_USER` / `DB_PASSWORD` | `campus_app` / `campus_app_pwd` | 数据库账号 |
| `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BUCKET` | `http://localhost:9000` / `minioadmin` … | MinIO 配置（`STORAGE_TYPE=minio` 时生效） |

示例：

```bash
export JWT_SECRET="$(openssl rand -base64 48)"
export ADMIN_SECRET="your-strong-admin-token"
export STORAGE_LOCAL_PATH=./data/uploads
java -jar backend/target/campus-club-backend.jar --spring.profiles.active=mysql
```

### 前端（`portal-web/.env.example`、`admin-web/.env.example`）

复制为 `.env.development` / `.env.production` / `.env.local` 后按需修改；**全部可选项，不配置即用相对路径**。

| 变量 | 默认 | 说明 |
|------|------|------|
| `VITE_API_BASE_URL` | `/api/portal` | 门户接口基址 |
| `VITE_ADMIN_API_BASE_URL` | `/api/admin` | 管理端接口基址 |
| `VITE_FILE_BASE_URL` | 空（同源） | 静态文件前缀；文件托管在 CDN / 对象存储时填写 |
| `VITE_DEV_PROXY_TARGET` | `http://localhost:8080` | **仅开发**：dev server 代理目标 |
| `VITE_DEV_PORT` | `5173` / `5174` | **仅开发**：dev server 端口 |

---

## 五、功能清单

### 门户端（学生 / 教师）

| 模块 | 功能 |
|------|------|
| 访问与登录 | **打开即进主页，无需登录**；学生可自助注册（**注册强制为学生角色**）；登录后可在任意页面停留 |
| 首页 | 顶部横幅轮播（可由后台配置）+ 与横幅同宽的**宽幅社团栏目**垂直排列；社团搜索与分页 |
| 我的社团 / 招新 | 未加入任何社团时展示为**社团招新页**，每个栏目下方「加入」按钮，点击即自动归入该社团 |
| 社团展示页 | 顶部约半屏**海报轮播** → 负责教师 + 社团简介（教师 / 管理员 / 社团负责人可编辑）→ **过程性材料区** |
| 材料上传 | 虚线拖拽框（带加号），支持**图片 / 视频 / 文档**，**不支持文字叙述**；材料**免审核直接展示** |
| 材料展示 | 论坛帖式、按时间倒序、**每页 30 条**、分页折叠；文档可点击查看/下载 |
| 内容治理 | 发布者本人 / 管理员 / 负责教师可**撤展**（保留记录）或**删除**材料；资源仅本人或管理员可编辑/撤下/删除 |
| 课程资源 | 教师发布（标题 / 简介 / 学习链接 / 视频），学生浏览 |
| 成员管理 | 负责教师添加 / 移除社团成员、设置学生负责人 |
| 个人中心 | 档案展示与编辑、我的材料检索 |
| 访问统计 | 路由变化自动上报页面访问，驱动后台访问趋势与日活量 |

### 管理端（管理员 / 超级管理员）

| 模块 | 可用层级 | 功能 |
|------|----------|------|
| 登录 | 全部 | 账号 + 密码 + **管理员令牌**三重校验（令牌按管理员独立配置） |
| 仪表盘 | 全部 | 用户 / 社团 / 材料 / 资源统计；**各社团学生占比饼图**、**各社团人数直方图**、**每日访问趋势 + 站点日活量(DAU)** |
| 用户管理 | 全部 | 增删改查、按角色与关键词筛选；**可任命教师**、可修改全部学生/教师参数（管理员账号不在此列，避免越权提权） |
| 社团管理 | 全部 | 增删改查、负责教师指派、海报与简介维护 |
| 内容审核 | 全部 | 材料与资源的通过 / 驳回 / 下架，按状态筛选 |
| 年级班级 | 全部 | 年级与班级层级维护 |
| 我的账号 | 全部 | 查看自身账号信息与层级；**修改自身令牌**（需校验当前令牌） |
| **文件资源** | 仅超级管理员 | 查看 / 上传 / 删除全部上传资源，复制相对引用 |
| **管理员与令牌** | 仅超级管理员 | 创建管理员并生成令牌、**设置层级（升为超管 / 降为普通）**、启用/禁用、重置他人令牌、删除管理员 |
| **系统设置** | 仅超级管理员 | 系统名称、Logo、背景图、首页横幅、主题色、页脚文案 |

---

## 六、管理员权限层级（超管 vs 普通管理员）

系统对管理员分两个层级，字段为 `sys_user.admin_level`（`super` / `normal`）：

| 能力 | 超级管理员 `super` | 普通管理员 `normal` |
|------|:---:|:---:|
| 查看管理员列表 | ✅ | ❌ 看不到任何其他管理员 |
| 新增 / 删除管理员 | ✅ | ❌ |
| 提拔 / 降级管理员 | ✅ | ❌ |
| 启用 / 禁用管理员 | ✅ | ❌ |
| 重置**他人**令牌 | ✅ | ❌ |
| 修改**自身**令牌 | ✅ | ✅ |
| 系统设置 / 文件资源 | ✅ | ❌ |
| 用户 / 社团 / 审核 / 年级班级 | ✅ | ✅ |

**核心规则：管理员之间不可互相管理**——普通管理员既看不到、也改不了其他管理员（包括同为普通管理员的账号），彼此完全隔离，只有超级管理员能管理管理员组。

安全设计要点：

1. **接口层拦截**：`/api/admin/admins/**` 在 `SecurityConfig` 中被限定为 `ROLE_SUPER_ADMIN`，普通管理员携带合法令牌访问同样返回 403（响应体带业务码 403）。
2. **回库二次校验**：`AdminAccountService` 每次操作前都会重新读取操作者当前层级，因此超管被降级后，其旧令牌立即失去管理能力（不依赖令牌中的旧声明）。
3. **令牌声明**：JWT 中携带 `adminLevel`，过滤器据此授予 `ROLE_SUPER_ADMIN`；升级前签发的旧令牌不含该声明，**升级后需重新登录**才拥有超管能力（安全的默认值）。
4. **最后一名超管保护**：无法把最后一名可用超管降级、禁用或删除，避免出现无人能管理管理员组的死锁。
5. **禁止自我操作**：超管不能删除自己、禁用自己、降级自己，也不能在此重置自身令牌（须走「我的账号」并校验旧令牌）。
6. **封堵提权通道**：用户管理接口禁止创建/修改/删除 `admin` 角色账号，管理员账号只能从「管理员与令牌」进入；普通用户列表也不再返回管理员账号。
7. **禁用即失效**：被禁用的管理员无法登录（`adminLogin` 校验 `status=normal`）。

> 历史数据兼容：`admin_level` 为空的旧数据按「超级管理员」处理（升级前所有管理员权限相同），
> 因此升级后不会出现无人可管的空档；可在「管理员与令牌」页按需下调为普通管理员。

---

## 七、超级管理员后台能力

### 1. 系统设置（系统名称 / Logo / 背景图）

管理后台 → **系统设置**：

- 修改**系统名称、副标题、主题色、页脚文案**；
- 上传替换 **Logo、全站背景图、首页横幅**（支持多张横幅，英文逗号分隔）；
- 门户端导航栏 Logo / 系统名称、首页横幅、全站背景图**即时联动**；管理后台左上角品牌同步更新。

### 2. 教师 / 学生 / 社团参数

- 管理后台 → **用户管理**：可新增 / 编辑 / 删除任意用户，修改姓名、角色、年级、班级、年龄、性别、状态、密码；
  **任命教师**只需新建用户时选择角色「教师」，或在现有用户上修改角色为「教师」。
- 管理后台 → **社团管理**：可修改社团名称、简介、海报、负责教师、状态。
- 管理后台 → **年级班级**：维护年级与班级层级。

### 3. 文件资源

- 管理后台 → **文件资源**：列出存储目录内全部文件（文件名、分组、大小、修改时间、相对引用），
  支持**上传**、**按分组上传**、**删除**、**复制资源引用**。图片类型直接预览缩略图。

### 4. 管理员与令牌（管理员组管理）

- 管理后台 → **管理员与令牌**（仅超级管理员可见）：
  - **创建管理员账号并生成令牌**：可指定层级（普通管理员 / 超级管理员），令牌明文**仅显示一次**，请立即保存；
  - **设置层级**：一键「升为超管」/「降级」；
  - **启用 / 禁用**：禁用后该管理员立即无法登录；
  - **重置他人令牌**：列表操作列一键重置（对自己不可用）；
  - **删除管理员**：逻辑删除，账号立即失效；同名账号可随时重新创建（系统自动复活原记录并重置为全新账号，
    既避免用户名唯一索引冲突，也让该账号的历史业务引用不变成孤儿数据）；
  - **修改自身令牌**：右上角头像 →「我的账号」，需校验当前令牌。

> 管理员登录 = 账号 + 密码 + 管理员令牌。令牌以 BCrypt 密文入库；
> 若某管理员未配置独立令牌，则回落到全局 `ADMIN_SECRET`（向后兼容）。

---

## 八、部署（Windows / Linux）

### 1. Windows 部署

```bat
REM 1) 生产构建
scripts\build-all.bat

REM 2) 启动后端（默认 mysql profile）
set PROFILE=mysql
set SERVER_PORT=8080
set DB_HOST=127.0.0.1
set DB_USER=campus_app
set DB_PASSWORD=your_password
set JWT_SECRET=your-32byte-plus-secret
set ADMIN_SECRET=your-strong-admin-token
scripts\start-prod.bat
```

前端 `portal-web\dist`、`admin-web\dist` 交给 IIS 或 Nginx 托管，
并把 `/api`、`/files` 反向代理到 `http://127.0.0.1:8080`。

### 2. Linux 部署

```bash
# 1) 生产构建
bash scripts/build-all.sh

# 2) 初始化数据库
mysql -u root -p -e "CREATE DATABASE campus_club DEFAULT CHARSET utf8mb4;"
mysql -u root -p campus_club < sql/schema.sql

# 3) 启动后端
export JWT_SECRET="$(openssl rand -base64 48)"
export ADMIN_SECRET="your-strong-admin-token"
export DB_HOST=127.0.0.1 DB_NAME=campus_club DB_USER=campus_app DB_PASSWORD=your_password
bash scripts/start-prod.sh
```

### 3. Nginx 参考配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 门户前端
    location / {
        root /opt/campus/portal-web/dist;
        try_files $uri $uri/ /index.html;      # SPA 路由回退
    }

    # 管理后台（可换独立域名 / 端口）
    location /admin/ {
        alias /opt/campus/admin-web/dist/;
        try_files $uri $uri/ /admin/index.html;
    }

    # 后端接口与静态文件
    location /api/   { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host; }
    location /files/ { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host; }
    client_max_body_size 60m;                  # 与后端 multipart 上限一致
}
```

### 4. systemd 托底（Linux）

```ini
# /etc/systemd/system/campus-club.service
[Unit]
Description=Campus Club Backend
After=network.target

[Service]
User=campus
WorkingDirectory=/opt/campus
Environment=PROFILE=mysql
Environment=DB_HOST=127.0.0.1
Environment=DB_NAME=campus_club
Environment=DB_USER=campus_app
Environment=DB_PASSWORD=your_password
Environment=JWT_SECRET=your-32byte-plus-secret
Environment=ADMIN_SECRET=your-strong-admin-token
Environment=STORAGE_LOCAL_PATH=/opt/campus/data/uploads
ExecStart=/usr/bin/java -jar /opt/campus/backend/target/campus-club-backend.jar --spring.profiles.active=${PROFILE} --server.port=8080
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now campus-club
```

---

## 九、跨环境迁移说明

### 设计原则

1. **接口地址**：前端只使用相对路径（`/api/portal`、`/api/admin`），可通过 `VITE_*` 环境变量覆盖；
   开发环境由 Vite 代理转发，生产环境由 Nginx 反向代理。
2. **静态资源**：后端返回的图片 / 视频 / 文档引用统一为 `/files/**` 相对路径（由 `storage.local.base-url` 决定，
   默认 `/files`），可通过 `VITE_FILE_BASE_URL` 指向 CDN / 对象存储。
3. **上传目录**：由 `STORAGE_LOCAL_PATH` 控制（默认 `./uploads`，相对进程工作目录），不写死盘符与绝对路径；
   路径处理统一使用 `java.nio.file.Paths`，Windows / Linux 行为一致。
4. **数据库**：由 `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` 环境变量注入，代码零硬编码。
5. **密钥**：`JWT_SECRET`、`ADMIN_SECRET` 走环境变量，配置文件仅保留“仅用于本地开发”的占位默认值。
6. **数据隔离**：演示数据仅在 `dev`（H2）profile 注入；`mysql`（生产）profile 不注入任何数据。

### 迁移步骤

```bash
# 在新环境：只需 4 步，无需改代码
1. git clone <repo> && cd campus-club-management-sys
2. bash scripts/build-all.sh
3. 配置环境变量（数据库 / 密钥 / 存储目录）
4. bash scripts/start-prod.sh
```

### 绝对路径与环境相关引用审计（本次整改结论）

| 位置 | 原状态 | 整改后 |
|------|--------|--------|
| `portal-web/src/utils/request.js` | `http://localhost:8080/api/portal` | `import.meta.env.VITE_API_BASE_URL \|\| '/api/portal'` |
| `admin-web/src/utils/request.js` | `http://localhost:8080/api/admin` | `import.meta.env.VITE_ADMIN_API_BASE_URL \|\| '/api/admin'` |
| `admin-web/src/api/index.js` | `getClubMembers` 硬编码 `http://localhost:8080/api/portal/...` | 独立门户实例 + 相对路径 `/clubs/{id}/members` |
| `portal-web/vite.config.js` | proxy `target: 'http://localhost:8080'` 写死 | `VITE_DEV_PROXY_TARGET`，默认 8080；新增 `/files` 代理 |
| `admin-web/vite.config.js` | 同上，且端口与门户重复（均 5173） | `VITE_DEV_PROXY_TARGET` + 端口修正为 5174 |
| `WebConfig` / `SecurityConfig` CORS | `allowedOriginPatterns("*")` 写死 | 读取 `app.cors.allowed-origins`（`APP_CORS_ALLOWED_ORIGINS`） |
| 存储路径 / 数据库 / 密钥 | 已为相对路径或环境变量 | 保持不变，并补充文档与 `.env.example` |
| `application-mysql.yml` MinIO endpoint | `${MINIO_ENDPOINT:http://localhost:9000}` | 已为环境变量（默认值仅本地开发占位） |

> 审计命令（可作为回归检查）：
> ```bash
> grep -rniE "localhost:8080|127\.0\.0\.1(:[0-9]+)?/(api|files)|[A-Z]:\\\\|/Users/|/home/" \
>   --include=*.java --include=*.js --include=*.jsx --include=*.yml --include=*.json \
>   backend/src portal-web/src admin-web/src
> ```
> 当前结果：仅 `application-mysql.yml` 的 MinIO 默认占位值（环境变量，合法）。

---

## 十、目录结构

```
campus-club-management-sys/
├── backend/                         # Spring Boot 后端
│   └── src/main/
│       ├── java/com/campus/club/
│       │   ├── common/              # 统一响应 R、分页、全局异常
│       │   ├── config/              # MyBatis-Plus、Web(CORS/静态资源)、演示数据初始化
│       │   ├── controller/          # Auth / Profile / Club / Site / Admin
│       │   ├── dto/                 # 请求与视图对象
│       │   ├── entity/              # 9 张表实体（含 sys_config）
│       │   ├── mapper/              # MyBatis-Plus Mapper
│       │   ├── security/            # JWT、验证码、登录防护、鉴权拦截（含 ROLE_SUPER_ADMIN）
│       │   ├── storage/             # 本地磁盘存储 / MinIO 可切换
│       │   └── service/             # 业务逻辑（含系统配置、文件资源、管理员组管理）
│       └── resources/
│           ├── application.yml      # 通用配置（端口、JWT、存储、安全策略）
│           ├── application-dev.yml  # H2 内存库（开发）
│           ├── application-mysql.yml# MySQL + MinIO（生产）
│           └── db/schema.sql        # H2 建表脚本
├── portal-web/                      # 门户前端（React + Vite + AntD）
│   └── .env.example                 # 前端环境变量示例
├── admin-web/                       # 管理前端（React + Vite + AntD）
│   └── .env.example
├── scripts/                         # 跨平台构建 / 启动脚本
│   ├── build-all.sh  / .bat
│   ├── start-dev.sh  / .bat
│   └── start-prod.sh / .bat
├── sql/schema.sql                   # MySQL 建表脚本（生产，含 admin_secret / admin_level 增量说明）
├── tools/smoke_admin_level.py       # 冒烟自测：管理员层级与管理员组权限（59 项）
├── tools/smoke_regression.py        # 冒烟自测：门户/管理端主流程回归 + 环境净度校验（42 项）
├── uploads/                         # 默认本地上传目录（.gitignore 忽略）
└── API_CONTRACT.md                  # 前后端接口契约
```

---

## 十一、技术栈与安全策略

| 层 | 技术 |
|----|------|
| 门户 / 管理前端 | React 18、Vite 5、Ant Design 5、React Router 6、Axios |
| 后端 | Spring Boot 3.2.5、MyBatis-Plus 3.5.7、Spring Security 6 |
| 认证 | JWT（jjwt 0.11.5）、BCrypt |
| 数据库 | MySQL 8（生产）/ H2 内存库（本地开发） |
| 文件存储 | 本地磁盘（默认）/ MinIO（生产可选） |

| 安全策略 | 实现 |
|----------|------|
| 密码存储 | BCrypt 强哈希，明文不落库 |
| 注册约束 | 门户注册**强制学生**角色，教师权限仅可由管理员在后台分配 |
| 管理员三重校验 | 账号 + 密码 + 管理员令牌（支持每管理员独立令牌，密文入库） |
| 管理员层级隔离 | `sys_user.admin_level`（super / normal）：`/api/admin/admins/**` 仅 `ROLE_SUPER_ADMIN` 可访问，普通管理员互相不可管理；服务层每次回库校验层级 |
| 超管防死锁 | 最后一名可用超管不可被降级 / 禁用 / 删除；超管不可删除、禁用、降级自己 |
| 防提权 | 用户管理接口禁止创建/修改/删除 admin 角色；普通用户列表不返回管理员账号 |
| 登录失败延时 | 后端固定延时 1000ms 后返回 |
| IP 限流 | 单 IP 每分钟最多 8 次登录尝试 |
| 账号锁定 | 连续失败 5 次锁定 10 分钟 |
| 动态验证码 | 图形验证码，2 分钟有效，一次性消费 |
| 角色隔离 | 学生 / 教师令牌访问 `/api/admin/**` 直接 403 |
| SQL 注入 | 全参数化查询（MyBatis-Plus） |
| 路径穿越防护 | 文件资源删除校验目标路径必须位于存储根目录内 |
| 传输安全 | 生产建议前置 Nginx 配置 HTTPS |

---

## 十二、常见问题

**Q1：门户 / 管理前端打开后接口 404 或跨域报错？**
开发环境确认后端已在 `8080` 启动；如后端端口不同，设置 `VITE_DEV_PROXY_TARGET=http://localhost:<port>` 后重启 dev server。

**Q2：重启后端后数据变了？**
dev 使用 H2 内存库，重启即重置为初始演示数据，属预期行为。需要持久化请切换到 `mysql` profile。

**Q3：上传的图片显示不出来？**
确认反向代理已把 `/files/**` 转发到后端（开发环境由 Vite 代理处理）。若文件托管在独立域名，请设置 `VITE_FILE_BASE_URL`。

**Q4：管理后台登录提示“管理员密钥错误”？**
管理员登录需「账号 + 密码 + 管理员令牌」三项。演示环境 `admin`（超级管理员）的令牌为 `admin123`、
`admin2`（普通管理员）为 `admin2-secret`；若已重置过令牌，请使用新令牌。

**Q4-1：普通管理员登录后看不到「管理员与令牌」「系统设置」「文件资源」？**
这是设计使然：只有超级管理员能管理管理员组与系统级配置。普通管理员彼此之间互不可管理，
只能通过右上角头像 →「我的账号」修改自身令牌。需调整管理员请用 `admin` 登录。
若刚升级过版本且旧会话仍在，请**重新登录**以携带新的层级信息。

**Q5：如何切换为对象存储？**
设置 `STORAGE_TYPE=minio` 及 `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BUCKET` 后重启后端，业务代码无需改动。

**Q6：生产库已有数据如何升级？**
执行 `sql/schema.sql` 中的增量语句（重复执行安全，已存在的列会报错可忽略）：
```sql
-- v2
ALTER TABLE sys_user ADD COLUMN admin_secret VARCHAR(120) COMMENT '管理员独立密钥(BCrypt)';
-- v3：管理员层级（超级管理员 / 普通管理员）
ALTER TABLE sys_user ADD COLUMN admin_level VARCHAR(20) DEFAULT 'normal'
  COMMENT '管理员层级 super=超级管理员/normal=普通管理员；仅 role=admin 使用';
-- 指定现有超管（其余按普通管理员对待）
UPDATE sys_user SET admin_level = 'super' WHERE role = 'admin' AND username = 'admin';
-- 其余新表使用 CREATE TABLE IF NOT EXISTS，重复执行安全
```
> 说明：`admin_level` 为空的历史数据后端会按「超级管理员」兼容处理，
> 因此即使不执行上面的 `UPDATE` 也不会出现无人可管的情况；执行后语义更明确。

**Q7：如何调整上传大小上限？**
修改 `application.yml` 的 `spring.servlet.multipart.max-file-size` / `max-request-size`（默认 50MB），
并同步调整 Nginx 的 `client_max_body_size`。

---

## 十三、冒烟自测

后端启动后（默认 `http://127.0.0.1:8080`），可直接运行内置自测脚本，无需额外依赖：

```bash
python tools/smoke_admin_level.py    # 管理员层级 / 管理员组权限（59 项断言）
python tools/smoke_regression.py     # 门户 + 管理端主流程回归、环境净度（42 项断言）
```

- 脚本使用独立的 `smoke_*` 临时账号，运行前后会自行清理，不会污染演示数据；
- 覆盖：超管与普通管理员的权限边界（普通管理员访问管理员组接口一律 403）、
  管理员增删/升降级/启停/令牌重置、防提权、角色隔离、删除后同名重建等；
- 若后端端口或地址不同，修改脚本顶部的 `BASE` 即可；
- 命中登录限流（单账号每分钟 8 次）时脚本会自动等待一个窗口后重试。

> 提示：新增管理员层级能力后，**旧登录会话需重新登录**（令牌才会携带 `adminLevel` 声明）。
