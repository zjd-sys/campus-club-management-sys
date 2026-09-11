// ============================================================================
// 演示模式测试数据（仅 VITE_DEMO=true 时由 request.js 注入 axios adapter）
// 数据形状严格遵循 API_CONTRACT.md，确保页面在无后端时也能正常渲染内容。
// ============================================================================

const wrap = (text, c1, c2) =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='240'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>` +
      `<rect width='400' height='240' fill='url(#g)'/>` +
      `<text x='50%' y='54%' font-size='30' fill='#fff' text-anchor='middle' font-family='Microsoft YaHei' font-weight='bold'>${text}</text></svg>`
  )

// ---------- 社团 ----------
export const CLUBS = [
  { id: 1, name: '文学社', intro: '以文会友，笔墨生香。定期开展读书分享、征文比赛与校刊编辑，欢迎热爱文字的你。', poster: wrap('文学社', '#67c23a', '#4096ff'), teacherId: 2, status: 'active', createTime: '2025-09-01 09:00:00' },
  { id: 2, name: '篮球社', intro: '热血球场，挥洒汗水。校队梯队培养，每周三次训练与友谊赛，强身健体结交伙伴。', poster: wrap('篮球社', '#f56c6c', '#e6a23c'), teacherId: 3, status: 'active', createTime: '2025-09-02 10:00:00' },
  { id: 3, name: '合唱团', intro: '天籁之音，唱响校园。美声与流行并重，承担校庆、艺术节等大型演出。', poster: wrap('合唱团', '#722ed1', '#eb2f96'), teacherId: 4, status: 'active', createTime: '2025-09-03 11:00:00' },
  { id: 4, name: '科技创新社', intro: '动手造物，探索未来。机器人、3D 打印与编程竞赛，培养工程思维。', poster: wrap('科技创新社', '#13c2c2', '#4096ff'), teacherId: 5, status: 'active', createTime: '2025-09-04 14:00:00' },
  { id: 5, name: '美术社', intro: '笔触之间，看见世界。素描、水彩与国画，定期举办校园画展。', poster: wrap('美术社', '#fa8c16', '#f56c6c'), teacherId: 6, status: 'active', createTime: '2025-09-05 15:00:00' },
  { id: 6, name: '志愿者协会', intro: '微光成炬，服务校园与社区。敬老、环保与大型活动志愿，累计服务超千小时。', poster: wrap('志愿者协会', '#4096ff', '#67c23a'), teacherId: 7, status: 'active', createTime: '2025-09-06 16:00:00' }
]

// ---------- 用户（门户 profile / 成员列表共用） ----------
export const USERS = [
  { id: 1, username: 'admin', name: '系统管理员', role: 'admin', gradeId: null, gradeName: '', clazzId: null, clazzName: '', age: 35, gender: 'male', clubId: null, clubName: '', status: 'active', createTime: '2025-08-20 08:00:00' },
  { id: 2, username: 'teacher_wang', name: '王老师', role: 'teacher', gradeId: 1, gradeName: '高一', clazzId: 1, clazzName: '1班', age: 38, gender: 'female', clubId: 1, clubName: '文学社', status: 'active', createTime: '2025-08-21 08:00:00' },
  { id: 3, username: 'teacher_li', name: '李老师', role: 'teacher', gradeId: 1, gradeName: '高一', clazzId: 2, clazzName: '2班', age: 40, gender: 'male', clubId: 2, clubName: '篮球社', status: 'active', createTime: '2025-08-21 08:00:00' },
  { id: 4, username: 'teacher_zhao', name: '赵老师', role: 'teacher', gradeId: 2, gradeName: '高二', clazzId: 3, clazzName: '1班', age: 36, gender: 'female', clubId: 3, clubName: '合唱团', status: 'active', createTime: '2025-08-21 08:00:00' },
  { id: 5, username: 'teacher_qian', name: '钱老师', role: 'teacher', gradeId: 2, gradeName: '高二', clazzId: 4, clazzName: '2班', age: 33, gender: 'male', clubId: 4, clubName: '科技创新社', status: 'active', createTime: '2025-08-21 08:00:00' },
  { id: 6, username: 'teacher_sun', name: '孙老师', role: 'teacher', gradeId: 3, gradeName: '高三', clazzId: 5, clazzName: '1班', age: 41, gender: 'female', clubId: 5, clubName: '美术社', status: 'active', createTime: '2025-08-21 08:00:00' },
  { id: 7, username: 'teacher_zhou', name: '周老师', role: 'teacher', gradeId: 3, gradeName: '高三', clazzId: 6, clazzName: '2班', age: 39, gender: 'male', clubId: 6, clubName: '志愿者协会', status: 'active', createTime: '2025-08-21 08:00:00' },
  { id: 9, username: 'student_zhang', name: '张三', role: 'student', gradeId: 1, gradeName: '高一', clazzId: 1, clazzName: '1班', age: 16, gender: 'male', clubId: 1, clubName: '文学社', status: 'active', createTime: '2025-09-10 09:00:00' },
  { id: 10, username: 'student_li', name: '李四', role: 'student', gradeId: 1, gradeName: '高一', clazzId: 1, clazzName: '1班', age: 16, gender: 'female', clubId: 1, clubName: '文学社', status: 'active', createTime: '2025-09-10 09:00:00' },
  { id: 11, username: 'student_wang', name: '王五', role: 'student', gradeId: 1, gradeName: '高一', clazzId: 2, clazzName: '2班', age: 15, gender: 'male', clubId: 2, clubName: '篮球社', status: 'active', createTime: '2025-09-11 09:00:00' },
  { id: 12, username: 'student_zhao', name: '赵六', role: 'student', gradeId: 2, gradeName: '高二', clazzId: 3, clazzName: '1班', age: 17, gender: 'female', clubId: 3, clubName: '合唱团', status: 'active', createTime: '2025-09-12 09:00:00' },
  { id: 13, username: 'student_qian', name: '钱七', role: 'student', gradeId: 2, gradeName: '高二', clazzId: 4, clazzName: '2班', age: 16, gender: 'male', clubId: 4, clubName: '科技创新社', status: 'active', createTime: '2025-09-13 09:00:00' },
  { id: 14, username: 'student_sun', name: '孙八', role: 'student', gradeId: 3, gradeName: '高三', clazzId: 5, clazzName: '1班', age: 18, gender: 'female', clubId: 5, clubName: '美术社', status: 'active', createTime: '2025-09-14 09:00:00' },
  { id: 15, username: 'student_zhou', name: '周九', role: 'student', gradeId: 3, gradeName: '高三', clazzId: 6, clazzName: '2班', age: 18, gender: 'male', clubId: 6, clubName: '志愿者协会', status: 'active', createTime: '2025-09-15 09:00:00' }
]

// 演示登录用户（学生，归属文学社，便于展示「我是成员」Tab）
export const DEMO_PROFILE = USERS.find((u) => u.id === 9)

// ---------- 过程性材料（按社团） ----------
const img = (label) => wrap(label, '#4096ff', '#67c23a')
export const MATERIALS = {
  1: [
    { id: 101, userId: 9, userName: '张三', clubId: 1, clubName: '文学社', description: '九月读书分享会：《乡土中国》读后感，费孝通笔下的差序格局让人深思。', imageUrl: img('读书笔记'), videoUrl: '', submitTime: '2025-10-08 19:30:00', reviewStatus: 'passed', displayStatus: 'show' },
    { id: 102, userId: 10, userName: '李四', clubId: 1, clubName: '文学社', description: '校刊《晨曦》第三期征稿进行中，收录散文、诗歌共 24 篇。', imageUrl: img('校刊排版'), videoUrl: '', submitTime: '2025-10-12 20:10:00', reviewStatus: 'passed', displayStatus: 'show' },
    { id: 103, userId: 9, userName: '张三', clubId: 1, clubName: '文学社', description: '征文比赛初赛作品：以「我的校园」为题的记叙文。', imageUrl: '', videoUrl: '', submitTime: '2025-10-20 21:00:00', reviewStatus: 'pending', displayStatus: 'show' }
  ],
  2: [
    { id: 201, userId: 11, userName: '王五', clubId: 2, clubName: '篮球社', description: '秋季友谊赛集锦：三分线外的准度与快攻配合。', imageUrl: img('球场风采'), videoUrl: '', submitTime: '2025-10-09 18:00:00', reviewStatus: 'passed', displayStatus: 'show' }
  ],
  3: [
    { id: 301, userId: 12, userName: '赵六', clubId: 3, clubName: '合唱团', description: '校庆大合唱《我和我的祖国》声部分配与排练记录。', imageUrl: img('排练现场'), videoUrl: '', submitTime: '2025-10-10 17:00:00', reviewStatus: 'passed', displayStatus: 'show' }
  ],
  4: [
    { id: 401, userId: 13, userName: '钱七', clubId: 4, clubName: '科技创新社', description: '机器人小车巡线测试成功，附调试日志与电路图。', imageUrl: img('机器人调试'), videoUrl: '', submitTime: '2025-10-11 16:00:00', reviewStatus: 'passed', displayStatus: 'show' }
  ],
  5: [
    { id: 501, userId: 14, userName: '孙八', clubId: 5, clubName: '美术社', description: '水彩风景写生：校园银杏大道，金秋时节。', imageUrl: img('水彩写生'), videoUrl: '', submitTime: '2025-10-13 15:00:00', reviewStatus: 'passed', displayStatus: 'show' }
  ],
  6: [
    { id: 601, userId: 15, userName: '周九', clubId: 6, clubName: '志愿者协会', description: '敬老院志愿服务纪实：陪伴与清洁，累计 4 小时。', imageUrl: img('志愿同行'), videoUrl: '', submitTime: '2025-10-14 14:00:00', reviewStatus: 'passed', displayStatus: 'show' }
  ]
}

// ---------- 课程资源（按社团） ----------
export const RESOURCES = {
  1: [
    { id: 1001, clubId: 1, teacherId: 2, title: '现代散文写作入门', intro: '从观察生活到谋篇布局，配套范文与练习。', link: 'https://example.com/wenxue/essay', videoUrl: '', publishTime: '2025-10-15 10:00:00', displayStatus: 'show', reviewStatus: 'passed' }
  ],
  2: [
    { id: 2001, clubId: 2, teacherId: 3, title: '篮球基础战术讲解', intro: '挡拆、联防与快攻的基本跑位。', link: 'https://example.com/lanqiu/tactics', videoUrl: '', publishTime: '2025-10-16 10:00:00', displayStatus: 'show', reviewStatus: 'passed' }
  ],
  3: [
    { id: 3001, clubId: 3, teacherId: 4, title: '发声与气息训练', intro: '合唱团日常基本功视频合集。', link: 'https://example.com/hesheng/voice', videoUrl: '', publishTime: '2025-10-17 10:00:00', displayStatus: 'show', reviewStatus: 'passed' }
  ],
  4: [
    { id: 4001, clubId: 4, teacherId: 5, title: 'Arduino 入门套件指南', intro: '从点亮 LED 到传感器联动。', link: 'https://example.com/arduino/guide', videoUrl: '', publishTime: '2025-10-18 10:00:00', displayStatus: 'show', reviewStatus: 'passed' }
  ],
  5: [
    { id: 5001, clubId: 5, teacherId: 6, title: '水彩工具与技法', intro: '颜料、画笔与裱纸方法。', link: 'https://example.com/art/watercolor', videoUrl: '', publishTime: '2025-10-19 10:00:00', displayStatus: 'show', reviewStatus: 'passed' }
  ],
  6: [
    { id: 6001, clubId: 6, teacherId: 7, title: '志愿服务礼仪手册', intro: '沟通、安全与服务规范。', link: 'https://example.com/volunteer/etiquette', videoUrl: '', publishTime: '2025-10-20 10:00:00', displayStatus: 'show', reviewStatus: 'passed' }
  ]
}

// 各社团成员（用于 ClubDetail 成员 Tab 与管理端成员接口）
export const MEMBERS = {
  1: [
    { id: 9, name: '张三', username: 'student_zhang', role: 'student', gradeName: '高一', clazzName: '1班', identity: 'leader' },
    { id: 10, name: '李四', username: 'student_li', role: 'student', gradeName: '高一', clazzName: '1班', identity: 'normal' },
    { id: 2, name: '王老师', username: 'teacher_wang', role: 'teacher', gradeName: '高一', clazzName: '1班', identity: 'normal' }
  ],
  2: [
    { id: 11, name: '王五', username: 'student_wang', role: 'student', gradeName: '高一', clazzName: '2班', identity: 'leader' },
    { id: 3, name: '李老师', username: 'teacher_li', role: 'teacher', gradeName: '高一', clazzName: '2班', identity: 'normal' }
  ],
  3: [
    { id: 12, name: '赵六', username: 'student_zhao', role: 'student', gradeName: '高二', clazzName: '1班', identity: 'leader' },
    { id: 4, name: '赵老师', username: 'teacher_zhao', role: 'teacher', gradeName: '高二', clazzName: '1班', identity: 'normal' }
  ],
  4: [
    { id: 13, name: '钱七', username: 'student_qian', role: 'student', gradeName: '高二', clazzName: '2班', identity: 'leader' },
    { id: 5, name: '钱老师', username: 'teacher_qian', role: 'teacher', gradeName: '高二', clazzName: '2班', identity: 'normal' }
  ],
  5: [
    { id: 14, name: '孙八', username: 'student_sun', role: 'student', gradeName: '高三', clazzName: '1班', identity: 'leader' },
    { id: 6, name: '孙老师', username: 'teacher_sun', role: 'teacher', gradeName: '高三', clazzName: '1班', identity: 'normal' }
  ],
  6: [
    { id: 15, name: '周九', username: 'student_zhou', role: 'student', gradeName: '高三', clazzName: '2班', identity: 'leader' },
    { id: 7, name: '周老师', username: 'teacher_zhou', role: 'teacher', gradeName: '高三', clazzName: '2班', identity: 'normal' }
  ]
}

function page(list, page = 1, size = 15) {
  const start = (page - 1) * size
  return { total: list.length, page, size, records: list.slice(start, start + size) }
}

function pathOf(config) {
  const base = config.baseURL || ''
  const url = config.url || ''
  return url.startsWith('http') ? url : base + url
}

// 路由：返回业务 data（adapter 会包成 {code:0,data}）
export function routePortal(method, fullPath, config) {
  const m = method.toLowerCase()
  const p = fullPath.replace(/\/api\/portal/, '')

  // 认证
  if (m === 'post' && p === '/auth/login') {
    const role = (config.data && config.data.username === 'admin') ? 'admin' : 'student'
    return { token: 'demo-portal-token', role, name: '张三', userId: 9, username: 'student_zhang' }
  }
  if (m === 'post' && p === '/auth/register') return { token: 'demo-portal-token', role: 'student', name: '新同学', userId: 99, username: 'new_stu' }
  if (m === 'get' && p === '/captcha/gen') return { captchaId: 'cap1', image: wrap('验证码', '#4096ff', '#67c23a') }

  // 个人
  if (m === 'get' && p === '/profile') return DEMO_PROFILE
  if (m === 'put' && p === '/profile') return { ...DEMO_PROFILE, ...(config.data || {}) }
  if (m === 'get' && p === '/material/mine') return page(MATERIALS[1] || [], Number(config.params?.page) || 1, Number(config.params?.size) || 15)

  // 社团列表
  if (m === 'get' && p === '/clubs') {
    const kw = (config.params?.keyword || '').trim()
    const list = kw ? CLUBS.filter((c) => c.name.includes(kw) || c.intro.includes(kw)) : CLUBS
    return page(list, Number(config.params?.page) || 1, Number(config.params?.size) || 15)
  }
  if (m === 'get' && p === '/clubs/joined') return CLUBS.filter((c) => c.id === 1)

  // 社团详情 / 材料 / 资源 / 成员
  const detail = p.match(/^\/clubs\/(\d+)$/)
  if (m === 'get' && detail) {
    const club = CLUBS.find((c) => c.id === Number(detail[1]))
    return club || null
  }
  const mat = p.match(/^\/clubs\/(\d+)\/materials$/)
  if (m === 'get' && mat) return page(MATERIALS[Number(mat[1])] || [], Number(config.params?.page) || 1, Number(config.params?.size) || 15)
  if (m === 'post' && mat) return { id: Date.now(), userId: 9, userName: '张三', clubId: Number(mat[1]), clubName: (CLUBS.find((c) => c.id === Number(mat[1])) || {}).name, description: (config.data && config.data.get && config.data.get('description')) || '新提交的材料', imageUrl: '', videoUrl: '', submitTime: new Date().toISOString().slice(0, 19).replace('T', ' '), reviewStatus: 'pending', displayStatus: 'show' }
  const res = p.match(/^\/clubs\/(\d+)\/resources$/)
  if (m === 'get' && res) return RESOURCES[Number(res[1])] || []
  if (m === 'post' && res) return { id: Date.now(), clubId: Number(res[1]), teacherId: 2, title: (config.data && config.data.get && config.data.get('title')) || '新课程资源', intro: (config.data && config.data.get && config.data.get('intro')) || '', link: (config.data && config.data.get && config.data.get('link')) || '', videoUrl: '', publishTime: new Date().toISOString().slice(0, 19).replace('T', ' '), displayStatus: 'show', reviewStatus: 'passed' }
  const mem = p.match(/^\/clubs\/(\d+)\/members$/)
  if (m === 'get' && mem) return MEMBERS[Number(mem[1])] || []
  if (m === 'post' && mem) return { id: Number(mem[1]), ok: true }
  const delMem = p.match(/^\/clubs\/(\d+)\/members\/(\d+)$/)
  if (m === 'delete' && delMem) return { ok: true }

  return null
}

export function demoAdapter(config) {
  const fullPath = pathOf(config)
  const method = config.method || 'get'
  const data = routePortal(method, fullPath, config)
  return Promise.resolve({
    data: { code: 0, msg: 'success', data },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
    request: {}
  })
}
