# 校园社团管理网站 — 前后端接口契约（API Contract）

> 后端地址：`http://localhost:8080`
> 所有请求 JSON（文件上传用 `multipart/form-data`）。鉴权：`Authorization: Bearer <token>`
> 角色：`admin` / `teacher` / `student`

## 通用返回
```json
{ "code": 0, "msg": "success", "data": ... }   // code!=0 表示失败，msg 为错误描述
```
分页：`{ "total": 100, "page": 1, "size": 15, "records": [...] }`

---

## 一、门户端（portal） /api/portal

### 认证
- `POST /api/portal/auth/login`  body:`{username,password,captchaId?,captchaCode?}` → `{token,role,name,userId,username}`
- `GET  /api/portal/captcha/gen` → `{captchaId, image}`（image 为 `data:image/png;base64,...`）
- `POST /api/portal/auth/register` body:`{username,password,name,role('student'|'teacher'),gradeId,clazzId,age,gender}` → `{token,...}`

### 个人
- `GET  /api/portal/profile` → UserVO
- `PUT  /api/portal/profile` body:`{name,age,gender,gradeId,clazzId}` → UserVO
- `GET  /api/portal/material/mine?page=1&size=15&keyword=` → PageResult<MaterialVO>
  - 说明：后端同时兼容 `/api/portal/materials/mine`，两者等价。

### 社团（浏览）
- `GET /api/portal/clubs?page=1&size=15&keyword=` → PageResult<Club>
- `GET /api/portal/clubs/joined` → Club[]
- `GET /api/portal/clubs/{id}` → Club
- `GET /api/portal/clubs/{id}/materials?page=1&size=15` → PageResult<MaterialVO>
- `GET /api/portal/clubs/{id}/resources` → CourseResource[]

### 社团（操作）
- `POST /api/portal/clubs/{id}/materials`（multipart：`description`,`images[]`,`video`）→ MaterialVO  （仅社团成员）
- `POST /api/portal/clubs/{id}/resources`（multipart：`title`,`intro`,`link`,`video`）→ CourseResource （仅负责教师）
- `GET  /api/portal/clubs/{id}/members` → UserVO[] （仅负责教师/管理员）
- `POST /api/portal/clubs/{id}/members` body:`{userId,identity('normal'|'leader')}` （仅负责教师/管理员）
- `DELETE /api/portal/clubs/{id}/members/{userId}` （仅负责教师/管理员）

---

## 二、管理端（admin，仅 admin 角色） /api/admin

- `POST /api/admin/auth/login` body:`{username,password,adminSecret}` → `{token,role:'admin',name,userId,username,adminLevel}`
- `GET  /api/admin/stats` → `{userCount,clubCount,materialCount,resourceCount,pendingMaterial}`
- 用户：`GET /api/admin/users?page&size&role&keyword`  `POST /api/admin/users`  `PUT /api/admin/users/{id}`  `DELETE /api/admin/users/{id}`
  - body：`{username,password?,name,role,gradeId,clazzId,age,gender,clubId,status}`
- 社团：`GET /api/admin/clubs?page&size`  `POST /api/admin/clubs`  `PUT /api/admin/clubs/{id}`  `DELETE /api/admin/clubs/{id}`
  - body：`{name,intro,poster,teacherId,status}`
- 审核材料：`GET /api/admin/review/materials?page&size&reviewStatus`  `POST /api/admin/review/materials/{id}` body:`{action:'pass'|'reject'|'remove'}`
- 审核资源：`GET /api/admin/review/resources?page&size&reviewStatus`  `POST /api/admin/review/resources/{id}` body:`{action:'pass'|'remove'}`
- 年级：`GET /api/admin/grades`  `POST /api/admin/grades?name=`  `DELETE /api/admin/grades/{id}`
- 班级：`GET /api/admin/clazzes?gradeId=`  `POST /api/admin/clazzes?gradeId=&name=`  `DELETE /api/admin/clazzes/{id}`
- 系统设置（仅超管）：`GET/PUT /api/admin/settings`  `POST /api/admin/settings/resource?field=logo|background|banner`  `DELETE /api/admin/settings/resource?field=`
- 文件资源（仅超管）：`GET /api/admin/files`  `POST /api/admin/files/upload?subDir=`  `DELETE /api/admin/files?path=`

---

## 三、数据结构

**UserVO**: `{id,username,name,role,gradeId,gradeName,clazzId,clazzName,age,gender,clubId,clubName,status,adminLevel,createTime}`
（`adminLevel` 仅 role=admin 有意义：`super` 超级管理员 / `normal` 普通管理员）

## 四、管理员层级与管理员组接口
管理员分两个层级（`sys_user.admin_level`）：`super` 超级管理员 / `normal` 普通管理员。
**普通管理员之间互不可管理**——`/api/admin/admins/**` 仅 `ROLE_SUPER_ADMIN` 可访问（否则 403），
服务层每次操作前还会回库校验操作者层级。

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/admin/me` | 管理员 | 当前账号信息（含 adminLevel / isSuper） |
| PUT | `/api/admin/me/token` | 管理员 | 修改**自身**令牌（需校验旧令牌） |
| GET | `/api/admin/admins` | 仅超管 | 管理员列表（不含密钥） |
| POST | `/api/admin/admins` | 仅超管 | body `{username,password,name,secret?,adminLevel?}`；返回明文令牌**仅一次** |
| POST | `/api/admin/admins/{id}/token` | 仅超管 | 重置他人令牌（不能重置自己） |
| PUT | `/api/admin/admins/{id}/level` | 仅超管 | body `{adminLevel:'super'\|'normal'}`（不能改自己） |
| PUT | `/api/admin/admins/{id}/status` | 仅超管 | body `{status:'normal'\|'disabled'}`（不能操作自己） |
| DELETE | `/api/admin/admins/{id}` | 仅超管 | 删除管理员（不能删自己） |

约束：最后一名可用超管不可被降级 / 禁用 / 删除；用户管理接口禁止创建、修改、删除 `admin` 角色。

**Club**: `{id,name,intro,poster,teacherId,status,createTime}`
**MaterialVO**: `{id,userId,userName,clubId,clubName,description,imageUrl(逗号分隔多张),videoUrl,submitTime,reviewStatus,displayStatus}`
**CourseResource**: `{id,clubId,teacherId,title,intro,link,videoUrl,publishTime,displayStatus,reviewStatus}`
**Grade**: `{id,name}`  **Clazz**: `{id,gradeId,name}`

## 五、UI 规范（高中校园风）
- 主色 `#4096ff`（清爽校园蓝）、辅助 `#67c23a`、警示 `#f56c6c`、底色 `#f5f7fa`、卡片 `#ffffff`
- 学生端 8px 圆角，浅阴影 `0 2px 12px rgba(0,0,0,0.06)`
- 分页固定 15 条/页；字体 微软雅黑（标题16-18 / 正文14 / 辅助12）
- 统一顶部导航：首页、我的社团、右侧头像+用户名（点进个人中心）
- 复用组件：`ClubCard`（社团卡片）、`ClubArticleList`（左用户信息+右内容，最新置顶）、分页组件、提交表单
- 登录页：居中卡片、8px 圆角、浅蓝主色、极简

## 六、默认演示账号（dev 环境）
- 管理员：`admin` / `123456`，密钥 `admin123`
- 教师：`teacher` / `123456`（负责「文学社」）
- 学生：`student` / `123456`（「文学社」成员）
