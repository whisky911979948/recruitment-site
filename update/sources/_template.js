// ============================================================
// 来源模板（_template.js）—— 复制它、改名字、填逻辑，就能加一个新来源。
// 注意：文件名以「_」开头时，fetch.js 不会运行它（当草稿/说明用）。
// 想启用，把它复制成 sources/你来源名.js（不要下划线开头）即可。
// ============================================================
//
// ┌─────────────────────────── 接入新来源前，先做合规自检 ───────────────────────────┐
// │ 1) 看 robots.txt：浏览器打开  https://目标网站/robots.txt ，确认没禁止你抓的目录。 │
// │ 2) 看用户协议/条款：确认没有「禁止批量采集 / 商业使用」之类限制。                │
// │ 3) 控频率：每次请求间隔 1~2 秒，别并发狂刷，避免把人家服务器搞挂 / 被封 IP。      │
// │ 4) 不碰隐私：绝不采集姓名、电话、身份证、简历等个人敏感字段。                  │
// │ 5) 留痕溯源：每条岗位保留 原始链接 + 来源名 + 抓取时间，方便用户跳转核对。       │
// │ 6) 优先官方 API / RSS；没有才考虑解析网页，且只抓「公开岗位字段」。              │
// └────────────────────────────────────────────────────────────────────────────┘
//
// 下面是两种常见写法骨架，按你的来源挑一种改。

// ---------- 写法 A：来源本身就是 JSON 接口（类似 Himalayas） ----------
// async function fetchJobs() {
//   const res = await fetch("https://某个API地址");
//   const data = await res.json();
//   return data.list.map(x => ({
//     company: x.company,
//     title: x.title,
//     city: x.city,
//     category: x.category,
//     salary: x.salary,
//     education: x.edu || "—",
//     experience: x.exp || "—",
//     deadline: x.deadline || "",
//     link: x.url,
//     source: "你的来源名"
//   }));
// }

// ---------- 写法 B：来源是 RSS（如 Techmap 免费档，需 RapidAPI 密钥） ----------
// 先把密钥放进环境变量（别写死在代码里！）：终端运行  export RAPIDAPI_KEY=你的key
// const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
// async function fetchJobs() {
//   const res = await fetch("https://job-postings-rss-feed.p.rapidapi.com/api/rss/v1/jobs_full?format=json", {
//     headers: { "X-RapidAPI-Key": RAPIDAPI_KEY }
//   });
//   const data = await res.json();
//   return data.jobs.map(j => ({
//     company: j.company, title: j.title, city: j.location,
//     category: j.industry, salary: j.salaryText,
//     education: "—", experience: "—", deadline: "",
//     link: j.applyUrl, source: "Techmap"
//   }));
// }

// ---------- 写法 C：国内政府/高校公开页（第①类，需逐站解析 HTML） ----------
// 这类没有现成接口，要用类似「读网页 → 按规律抠字段」的方式。
// 新手建议先用「查看网页源代码 / 浏览器开发者工具」看清岗位列表的 HTML 结构，
// 再用 cheerio 之类库按标签提取。每个站结构不同，所以要「一个站一个文件」。
// （这一步我建议你先选定 1~2 个具体网站，我再带你逐站写，避免瞎猜结构。）

// module.exports = { name: "你的来源名", fetchJobs };
