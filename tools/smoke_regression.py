#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""管理员层级改造后的回归烟测：确认既有主流程未被破坏。"""
import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8080"
PASS, FAIL = [], []


def call(method, path, token=None, body=None):
    url = BASE + path
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode("utf-8") or "{}")
        except Exception:
            return e.code, {}


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(("  [PASS] " if cond else "  [FAIL] ") + name + (("  -> " + str(detail)) if (detail and not cond) else ""))


def login_portal(u, p):
    st, r = call("POST", "/api/portal/auth/login", body={"username": u, "password": p})
    return (r.get("data") or {}).get("token") if r.get("code") == 0 else None


def main():
    print("== 门户端 ==")
    st, cfg = call("GET", "/api/portal/site-config")
    check("公开站点配置 200", st == 200 and cfg.get("code") == 0, (st, cfg))

    stu = login_portal("student", "123456")
    check("学生登录成功", bool(stu))
    tea = login_portal("teacher", "123456")
    check("教师登录成功", bool(tea))

    st, clubs = call("GET", "/api/portal/clubs?page=1&size=10")
    check("社团列表公开可读", st == 200 and clubs.get("code") == 0, (st, clubs))
    cid = (clubs.get("data", {}).get("records") or [{}])[0].get("id")
    check("社团列表非空", bool(cid), clubs)

    st, mats = call("GET", f"/api/portal/clubs/{cid}/materials?page=1&size=30")
    check("社团材料公开可读（30/页）", st == 200 and mats.get("code") == 0, (st, mats))
    st, res = call("GET", f"/api/portal/clubs/{cid}/resources")
    check("社团课程资源公开可读", st == 200 and res.get("code") == 0, (st, res))

    st, joined = call("GET", "/api/portal/clubs/joined", stu)
    check("我的社团（学生）", st == 200 and joined.get("code") == 0, (st, joined))

    print("== 管理端（超管） ==")
    sa = call("POST", "/api/admin/auth/login",
              body={"username": "admin", "password": "123456", "adminSecret": "admin123"})[1]["data"]["token"]

    st, st1 = call("GET", "/api/admin/stats", sa)
    check("仪表盘统计", st == 200 and st1.get("code") == 0, (st, st1))
    d = st1.get("data") or {}
    for k in ("userCount", "clubCount", "materialCount", "resourceCount", "visitTrend", "visitDau"):
        check("stats 含 " + k, k in d, list(d.keys()))

    st, us = call("GET", "/api/admin/users?page=1&size=15", sa)
    check("用户列表", st == 200 and us.get("code") == 0, (st, us))
    tot = (us.get("data") or {}).get("total")
    check("用户列表分页 total>0", bool(tot), tot)

    st, t2 = call("POST", "/api/admin/users", sa, body={
        "username": "smoke_teacher", "password": "123456", "name": "烟测教师", "role": "teacher", "status": "normal"})
    check("超管可任命教师", t2.get("code") == 0, t2)
    tid = (t2.get("data") or {}).get("id")
    check("被任命教师可登录", bool(login_portal("smoke_teacher", "123456")))
    st, _ = call("DELETE", f"/api/admin/users/{tid}", sa)
    check("清理烟测教师", st == 200, st)

    st, cl = call("GET", "/api/admin/clubs?page=1&size=15", sa)
    check("社团管理列表", st == 200 and cl.get("code") == 0, (st, cl))
    check("社团列表非空", bool((cl.get("data") or {}).get("records")), cl)

    st, rv = call("GET", "/api/admin/review/materials?page=1&size=15", sa)
    check("内容审核列表", st == 200 and rv.get("code") == 0, (st, rv))

    st, gr = call("GET", "/api/admin/grades", sa)
    check("年级列表", st == 200 and gr.get("code") == 0, (st, gr))

    st, se = call("GET", "/api/admin/settings", sa)
    check("超管读取系统设置", st == 200 and se.get("code") == 0, (st, se))
    st, fs = call("GET", "/api/admin/files", sa)
    check("超管读取文件资源", st == 200 and fs.get("code") == 0, (st, fs))

    print("== 角色隔离 ==")
    st, _ = call("GET", "/api/admin/users", stu)
    check("学生令牌访问管理端 403", st == 403, st)
    st, _ = call("GET", "/api/admin/users", tea)
    check("教师令牌访问管理端 403", st == 403, st)
    st, _ = call("GET", "/api/admin/admins", stu)
    check("学生令牌访问管理员组 403", st == 403, st)

    print("== 普通管理员可用范围 ==")
    na = call("POST", "/api/admin/auth/login",
              body={"username": "admin2", "password": "123456", "adminSecret": "admin2-secret"})[1]["data"]["token"]
    st, _ = call("GET", "/api/admin/users?page=1&size=5", na)
    check("普通管理员可用用户管理", st == 200, st)
    st, _ = call("GET", "/api/admin/clubs?page=1&size=5", na)
    check("普通管理员可用社团管理", st == 200, st)
    st, _ = call("GET", "/api/admin/review/materials?page=1&size=5", na)
    check("普通管理员可用内容审核", st == 200, st)
    st, _ = call("GET", "/api/admin/stats", na)
    check("普通管理员可用仪表盘", st == 200, st)
    st, me = call("GET", "/api/admin/me", na)
    check("普通管理员可用 /me", st == 200 and me.get("data", {}).get("isSuper") is False, (st, me))
    # 普通管理员改自身令牌（改成新值再改回）
    st, r = call("PUT", "/api/admin/me/token", na, body={"oldSecret": "admin2-secret", "newSecret": "admin2-new"})
    check("普通管理员可改自身令牌", st == 200 and r.get("code") == 0, (st, r))
    na2 = call("POST", "/api/admin/auth/login",
               body={"username": "admin2", "password": "123456", "adminSecret": "admin2-new"})
    check("新令牌可登录", na2[1].get("code") == 0, na2)
    na2_t = na2[1]["data"]["token"]
    st, r = call("PUT", "/api/admin/me/token", na2_t, body={"oldSecret": "admin2-new", "newSecret": "admin2-secret"})
    check("还原 admin2 令牌（演示环境复位）", st == 200 and r.get("code") == 0, (st, r))
    check("原令牌可登录", call("POST", "/api/admin/auth/login",
                           body={"username": "admin2", "password": "123456", "adminSecret": "admin2-secret"})[1].get("code") == 0)

    print("== 最终状态校验（演示环境干净） ==")
    admins = call("GET", "/api/admin/admins", sa)[1]["data"]
    check("管理员列表无烟测残留", not [a for a in admins if a["username"].startswith("smoke_")],
          [a["username"] for a in admins])
    check("admin 为超级管理员", any(a["username"] == "admin" and a["adminLevel"] == "super" for a in admins), admins)
    check("admin2 为普通管理员", any(a["username"] == "admin2" and a["adminLevel"] == "normal" for a in admins), admins)
    us = call("GET", "/api/admin/users?page=1&size=200", sa)[1]["data"].get("records") or []
    check("用户列表无烟测残留", not [u for u in us if u["username"].startswith("smoke_")],
          [u["username"] for u in us if u["username"].startswith("smoke_")])

    print("\n==== 结果：%d 通过 / %d 失败 ====" % (len(PASS), len(FAIL)))
    if FAIL:
        print("失败项：")
        for f in FAIL:
            print("  - " + f)
        sys.exit(1)


if __name__ == "__main__":
    main()
