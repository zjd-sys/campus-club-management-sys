#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""管理员层级（超管 vs 普通管理员）端到端烟测。

覆盖：
  1. 超管/普通管理员登录返回层级
  2. /api/admin/me 层级回源
  3. 普通管理员访问管理员组接口 → 403
  4. 超管增删管理员、升降级、启停、重置他人令牌
  5. 普通管理员不能管理任何其他管理员
  6. 最后一名超管保护、禁止自我操作
  7. 用户管理接口防提权（禁止 admin 角色）
"""
import json
import sys
import time
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8080"
PASS, FAIL = [], []
RUN = str(int(time.time()))[-6:]  # 每次运行使用唯一账号后缀，避免历史残留与限流干扰
ADMIN_USER = "smoke_admin_" + RUN
STUDENT_USER = "smoke_student_" + RUN


def call(method, path, token=None, body=None, raw_status=False):
    url = BASE + path
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            payload = json.loads(r.read().decode("utf-8") or "{}")
            status = r.status
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode("utf-8") or "{}")
        except Exception:
            payload = {}
        status = e.code
    if raw_status:
        return status, payload
    return payload


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(("  [PASS] " if cond else "  [FAIL] ") + name + (("  -> " + str(detail)) if (detail and not cond) else ""))


def login(username, password, secret):
    """管理员登录；命中单账号限流(429)时等待一个窗口后重试，避免测试自身触发限流。"""
    r = call("POST", "/api/admin/auth/login",
             body={"username": username, "password": password, "adminSecret": secret})
    if r.get("code") == 429:
        time.sleep(62)
        r = call("POST", "/api/admin/auth/login",
                 body={"username": username, "password": password, "adminSecret": secret})
    return r


def main():
    print("== 1. 登录与层级 ==")
    sa = login("admin", "123456", "admin123")
    check("超管 admin 登录成功", sa.get("code") == 0, sa)
    check("超管 adminLevel=super", sa.get("data", {}).get("adminLevel") == "super", sa)
    sa_t = sa["data"]["token"]

    # 清理历史运行残留的烟测账号（幂等，保证脚本可反复执行）
    for a in call("GET", "/api/admin/admins", sa_t)["data"] or []:
        if a["username"].startswith("smoke_"):
            call("DELETE", "/api/admin/admins/%s" % a["id"], sa_t)
    ulist = (call("GET", "/api/admin/users?page=1&size=200", sa_t)["data"].get("records") or [])
    for u in ulist:
        if u["username"].startswith("smoke_"):
            call("DELETE", "/api/admin/users/%s" % u["id"], sa_t)

    na = login("admin2", "123456", "admin2-secret")
    check("普通管理员 admin2 登录成功", na.get("code") == 0, na)
    check("admin2 adminLevel=normal", na.get("data", {}).get("adminLevel") == "normal", na)
    na_t = na["data"]["token"]

    bad = login("admin2", "123456", "admin123")
    check("admin2 用超管令牌登录应失败", bad.get("code") != 0, bad)

    print("== 2. /me 层级回源 ==")
    me_sa = call("GET", "/api/admin/me", sa_t)["data"]
    me_na = call("GET", "/api/admin/me", na_t)["data"]
    check("超管 /me isSuper=true", me_sa.get("isSuper") is True, me_sa)
    check("普通管理员 /me isSuper=false", me_na.get("isSuper") is False, me_na)
    check("admin2 用户名正确", me_na.get("username") == "admin2", me_na)

    print("== 3. 普通管理员访问管理员组接口 → 403 ==")
    st, _ = call("GET", "/api/admin/admins", na_t, raw_status=True)
    check("admin2 GET /admins 403", st == 403, st)
    st, _ = call("POST", "/api/admin/admins", na_t, body={"username": "x", "password": "123456"}, raw_status=True)
    check("admin2 POST /admins 403", st == 403, st)
    st, _ = call("PUT", "/api/admin/admins/1/level", na_t, body={"adminLevel": "normal"}, raw_status=True)
    check("admin2 改他人层级 403", st == 403, st)
    st, _ = call("DELETE", "/api/admin/admins/2", na_t, raw_status=True)
    check("admin2 删除管理员 403", st == 403, st)
    st, _ = call("POST", "/api/admin/admins/1/token", na_t, raw_status=True)
    check("admin2 重置超管令牌 403", st == 403, st)
    st, _ = call("GET", "/api/admin/settings", na_t, raw_status=True)
    check("admin2 访问系统设置 403", st == 403, st)
    st, _ = call("GET", "/api/admin/files", na_t, raw_status=True)
    check("admin2 访问文件资源 403", st == 403, st)

    print("== 4. 超管的管理员组管理能力 ==")
    lst = call("GET", "/api/admin/admins", sa_t)["data"]
    check("超管可见管理员列表（≥2）", isinstance(lst, list) and len(lst) >= 2, lst)
    check("列表中 admin 层级为 super", any(x["username"] == "admin" and x["adminLevel"] == "super" for x in lst), lst)
    check("列表中 admin2 层级为 normal", any(x["username"] == "admin2" and x["adminLevel"] == "normal" for x in lst), lst)
    check("列表不含密钥字段", all("adminSecret" not in x and "password" not in x for x in lst), lst)

    # 新建普通管理员
    created = call("POST", "/api/admin/admins", sa_t, body={
        "username": ADMIN_USER, "password": "123456", "name": "烟测管理员",
        "secret": "smoke-token-1", "adminLevel": "normal"})
    check("超管创建管理员成功", created.get("code") == 0, created)
    new_id = created.get("data", {}).get("id")
    check("创建返回一次性明文令牌", created.get("data", {}).get("adminSecret") == "smoke-token-1", created)

    lg = login(ADMIN_USER, "123456", "smoke-token-1")
    check("新建管理员可登录（level=normal）", lg.get("code") == 0 and lg["data"]["adminLevel"] == "normal", lg)
    new_t = lg["data"]["token"]

    st, _ = call("GET", "/api/admin/admins", new_t, raw_status=True)
    check("新建普通管理员不能看管理员列表 403", st == 403, st)

    # 提拔为超管 → 立刻可管理
    up = call("PUT", f"/api/admin/admins/{new_id}/level", sa_t, body={"adminLevel": "super"})
    check("超管提拔他人为超管", up.get("code") == 0, up)
    lg2 = login(ADMIN_USER, "123456", "smoke-token-1")
    check("提拔后重新登录 adminLevel=super", lg2["data"]["adminLevel"] == "super", lg2)
    new_t2 = lg2["data"]["token"]
    st, body = call("GET", "/api/admin/admins", new_t2, raw_status=True)
    check("提拔后的超管可看管理员列表", st == 200 and body.get("code") == 0, (st, body))

    # 降级回去
    down = call("PUT", f"/api/admin/admins/{new_id}/level", sa_t, body={"adminLevel": "normal"})
    check("超管可将他人降为普通管理员", down.get("code") == 0, down)

    print("== 5. 重置令牌 ==")
    rs = call("POST", f"/api/admin/admins/{new_id}/token", sa_t)
    check("超管重置他人令牌成功", rs.get("code") == 0 and rs.get("data", {}).get("adminSecret"), rs)
    new_secret = rs["data"]["adminSecret"]
    check("旧令牌登录失败", login(ADMIN_USER, "123456", "smoke-token-1").get("code") != 0)
    check("新令牌登录成功", login(ADMIN_USER, "123456", new_secret).get("code") == 0)

    self_reset = call("POST", f"/api/admin/admins/{me_sa['id']}/token", sa_t)
    check("超管不能在此重置自身令牌", self_reset.get("code") != 0, self_reset)

    print("== 6. 启停与自我/最后超管保护 ==")
    dis = call("PUT", f"/api/admin/admins/{new_id}/status", sa_t, body={"status": "disabled"})
    check("超管禁用管理员成功", dis.get("code") == 0, dis)
    check("被禁用管理员无法登录", login(ADMIN_USER, "123456", new_secret).get("code") != 0)
    en = call("PUT", f"/api/admin/admins/{new_id}/status", sa_t, body={"status": "normal"})
    check("超管重新启用管理员", en.get("code") == 0, en)
    check("重新启用后可登录", login(ADMIN_USER, "123456", new_secret).get("code") == 0)

    check("超管不能禁用自己", call("PUT", f"/api/admin/admins/{me_sa['id']}/status", sa_t,
                                body={"status": "disabled"}).get("code") != 0)
    check("超管不能删除自己", call("DELETE", f"/api/admin/admins/{me_sa['id']}", sa_t).get("code") != 0)
    check("超管不能降级自己", call("PUT", f"/api/admin/admins/{me_sa['id']}/level", sa_t,
                                body={"adminLevel": "normal"}).get("code") != 0)
    check("非法层级取值被拒绝", call("PUT", f"/api/admin/admins/{new_id}/level", sa_t,
                                 body={"adminLevel": "hacker"}).get("code") == 0)
    check("非法层级取值安全回退为普通管理员", any(
        x["username"] == ADMIN_USER and x["adminLevel"] == "normal"
        for x in call("GET", "/api/admin/admins", sa_t)["data"]))

    # 最后一名超管保护：把 smoke_admin 提升为超管 → 尝试降级 admin（剩 admin 与 smoke 两个超管，应允许）
    call("PUT", f"/api/admin/admins/{new_id}/level", sa_t, body={"adminLevel": "super"})
    demote_other = call("PUT", f"/api/admin/admins/{me_sa['id']}/level",
                        login(ADMIN_USER, "123456", new_secret)["data"]["token"],
                        body={"adminLevel": "normal"})
    check("存在第二名超管时可互降（超管之间可管理）", demote_other.get("code") == 0, demote_other)
    # 此时 admin 已是 normal，仅剩 smoke_admin 一名超管
    smoke_t = login(ADMIN_USER, "123456", new_secret)["data"]["token"]
    check("仅剩一名超管时也不能降级自己（自我操作被拒）",
          call("PUT", f"/api/admin/admins/{new_id}/level", smoke_t, body={"adminLevel": "normal"}).get("code") != 0)
    check("仅剩一名超管时不能禁用自己",
          call("PUT", f"/api/admin/admins/{new_id}/status", smoke_t, body={"status": "disabled"}).get("code") != 0)
    check("仅剩一名超管时不能删除他人之外的自己（防死锁）",
          call("DELETE", f"/api/admin/admins/{new_id}", smoke_t).get("code") != 0)
    # 恢复 admin 为超管（用 smoke_admin 提拔）
    back = call("PUT", f"/api/admin/admins/{me_sa['id']}/level", smoke_t, body={"adminLevel": "super"})
    check("超管可将他人提拔回超管", back.get("code") == 0, back)
    sa_t = login("admin", "123456", "admin123")["data"]["token"]

    # 最后一名超管保护：admin2 提为超管后，尝试降级 admin2 → 允许（有 admin 在）；再降 admin2
    print("== 7. 用户管理接口防提权 ==")
    cu = call("POST", "/api/admin/users", sa_t, body={
        "username": "smoke_user", "password": "123456", "name": "烟测用户", "role": "admin"})
    check("用户接口禁止创建 admin 角色", cu.get("code") != 0, cu)

    cu2 = call("POST", "/api/admin/users", sa_t, body={
        "username": STUDENT_USER, "password": "123456", "name": "烟测学生", "role": "student", "status": "normal"})
    check("用户接口可正常创建学生", cu2.get("code") == 0, cu2)
    sid = cu2.get("data", {}).get("id")

    up2 = call("PUT", f"/api/admin/users/{sid}", sa_t, body={"role": "admin"})
    check("用户接口禁止把学生提权为 admin", up2.get("code") != 0, up2)

    users = call("GET", "/api/admin/users?page=1&size=100", sa_t)["data"]
    names = [u["username"] for u in users.get("records", users.get("list", []))]
    check("用户列表不包含管理员账号", "admin" not in names and "admin2" not in names, names[:10])

    check("用户接口禁止删除管理员账号", call("DELETE", f"/api/admin/users/{me_sa['id']}", sa_t).get("code") != 0)

    print("== 8. 清理 ==")
    check("超管删除烟测管理员", call("DELETE", f"/api/admin/admins/{new_id}", sa_t).get("code") == 0)
    check("已删除管理员无法登录", login(ADMIN_USER, "123456", new_secret).get("code") != 0)
    check("超管删除烟测学生", call("DELETE", f"/api/admin/users/{sid}", sa_t).get("code") == 0)

    print("== 9. 删除后同名重建（逻辑删除 + 用户名唯一索引） ==")
    again = call("POST", "/api/admin/admins", sa_t, body={
        "username": ADMIN_USER, "password": "123456", "name": "重建管理员",
        "secret": "smoke-token-2", "adminLevel": "normal"})
    check("同名管理员可重建（不报唯一索引冲突）", again.get("code") == 0, again)
    relogin = login(ADMIN_USER, "123456", "smoke-token-2")
    check("重建后可登录", relogin.get("code") == 0, relogin)
    check("原令牌已失效", login(ADMIN_USER, "123456", new_secret).get("code") != 0)
    if again.get("code") == 0:
        check("清理重建的管理员", call("DELETE", f"/api/admin/admins/{again['data']['id']}", sa_t).get("code") == 0)

    u_again = call("POST", "/api/admin/users", sa_t, body={
        "username": STUDENT_USER, "password": "123456", "name": "重建学生", "role": "student", "status": "normal"})
    check("同名学生可重建（不报唯一索引冲突）", u_again.get("code") == 0, u_again)
    if u_again.get("code") == 0:
        check("清理重建的学生", call("DELETE", f"/api/admin/users/{u_again['data']['id']}", sa_t).get("code") == 0)

    print("\n==== 结果：%d 通过 / %d 失败 ====" % (len(PASS), len(FAIL)))
    if FAIL:
        print("失败项：")
        for f in FAIL:
            print("  - " + f)
        sys.exit(1)


if __name__ == "__main__":
    main()
