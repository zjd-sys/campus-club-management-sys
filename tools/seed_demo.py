# -*- coding: utf-8 -*-
"""按 UTF-8 精确构造 multipart 请求，验证中文能否正确存取并注入演示数据。"""
import json
import urllib.request
import urllib.error
import uuid

BASE = "http://localhost:8080"


def post_json(path, obj, token=None):
    data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(BASE + path, data=data, method="POST")
    req.add_header("Content-Type", "application/json; charset=utf-8")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))


def put_json(path, obj, token=None):
    data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(BASE + path, data=data, method="PUT")
    req.add_header("Content-Type", "application/json; charset=utf-8")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))


def get(path, token=None):
    req = urllib.request.Request(BASE + path)
    if token:
        req.add_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))


def post_multipart(path, fields, token=None):
    """fields: dict[str, str]，按 UTF-8 编码写入 multipart 正文。"""
    boundary = "----wb" + uuid.uuid4().hex
    body = b""
    for k, v in fields.items():
        body += ("--%s\r\n" % boundary).encode("utf-8")
        body += ('Content-Disposition: form-data; name="%s"\r\n' % k).encode("utf-8")
        body += "Content-Type: text/plain; charset=utf-8\r\n\r\n".encode("utf-8")
        body += (v + "\r\n").encode("utf-8")
    body += ("--%s--\r\n" % boundary).encode("utf-8")
    req = urllib.request.Request(BASE + path, data=body, method="POST")
    req.add_header("Content-Type", "multipart/form-data; boundary=" + boundary)
    if token:
        req.add_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def login(path, payload):
    return post_json(path, payload)["data"]["token"]


def main():
    t_teacher = login("/api/portal/auth/login",
                      {"username": "teacher", "password": "123456"})
    t_admin = login("/api/admin/auth/login",
                    {"username": "admin", "password": "123456",
                     "adminSecret": "admin123"})
    t_student = login("/api/portal/auth/login",
                      {"username": "student", "password": "123456"})
    t_lisi = login("/api/portal/auth/login",
                   {"username": "lisi", "password": "123456"})
    t_wangwu = login("/api/portal/auth/login",
                     {"username": "wangwu", "password": "123456"})
    print("[登录] teacher / admin / student / lisi / wangwu 全部成功")

    # 1) 让 teacher 成为全部社团的负责教师，便于铺演示数据
    clubs = get("/api/portal/clubs?page=1&size=15", t_teacher)["data"]["records"]
    for c in clubs:
        if c.get("teacherId") is None:
            put_json("/api/admin/clubs/%d" % c["id"], {"teacherId": 1}, t_admin)
    print("[社团] %d 个社团已绑定负责教师" % len(clubs))

    # 2) 把三名学生加入各社团
    students = [(2, t_student), (3, t_lisi), (4, t_wangwu)]
    for c in clubs:
        for uid, _tok in students:
            try:
                post_json("/api/portal/clubs/%d/members" % c["id"],
                          {"userId": uid, "identity": "normal"}, t_teacher)
            except urllib.error.HTTPError as e:
                pass  # 已是成员则跳过
    print("[成员] 三名学生已加入全部社团")

    # 3) 注入过程性材料（中文，UTF-8 精确编码）
    materials = {
        1: ["参加文学社读书分享会，交流了《乡土中国》的阅读体会，收获很大。",
            "本周完成了社团征文初稿，主题是「校园的秋天」。"],
        2: ["篮球社日常训练：运球、三步上篮与防守站位练习。",
            "参加了校队选拔，成功进入第二阵容。"],
        3: ["科技创新社：完成了 Arduino 智能小车的组装与调试。",
            "学习了 Python 爬虫基础，爬取了校园公告数据做分析。"],
        4: ["音乐社排练：合唱《我和我的祖国》，分声部练习。",
            "社团吉他弹唱交流活动，分享了基础和弦走向。"],
        5: ["美术社写生：校园秋景速写练习，完成作品 3 幅。",
            "参与校园美育展览的布展筹备工作。"],
    }
    n = 0
    for cid, descs in materials.items():
        for i, d in enumerate(descs):
            tok = students[i % len(students)][1]
            post_multipart("/api/portal/clubs/%d/materials" % cid,
                           {"description": d}, tok)
            n += 1
    print("[材料] 已注入 %d 条过程性材料" % n)

    # 4) 注入课程资源
    resources = {
        1: ("《乡土中国》整本书阅读指导", "从概念梳理到论证分析，帮助学生建立整本书阅读的方法框架。",
            "https://example.com/course/xiangtu"),
        2: ("篮球基础技术训练教程", "运球、传接球、投篮与防守四大模块的系统训练方法。",
            "https://example.com/course/basketball"),
        3: ("Python 编程入门十讲", "从语法基础到小项目实战，适合零基础社团成员。",
            "https://example.com/course/python"),
        4: ("合唱发声与气息训练", "科学的发声方法与合唱声部配合技巧。",
            "https://example.com/course/chorus"),
        5: ("素描基础：结构与明暗", "从几何体到静物，建立造型与光影的基本认知。",
            "https://example.com/course/sketch"),
    }
    for cid, (title, intro, link) in resources.items():
        post_multipart("/api/portal/clubs/%d/resources" % cid,
                       {"title": title, "intro": intro, "link": link}, t_teacher)
    print("[资源] 已注入 %d 条课程资源" % len(resources))

    # 5) 回读校验中文是否正确
    r = get("/api/portal/clubs/1/materials", t_teacher)
    recs = r["data"] if isinstance(r["data"], dict) else r["data"]
    if isinstance(recs, dict):
        recs = recs.get("records", [])
    print("\n[校验] 文学社材料回读结果：")
    for m in recs[:3]:
        print("   -", m.get("description"))


if __name__ == "__main__":
    main()
