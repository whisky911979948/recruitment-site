// ============================================================
// 来源：Techmap Job Postings API（RapidAPI 免费档）
// ------------------------------------------------------------
// 合规：官方开放接口，白纸黑字可用；返回的是聚合的公开岗位，不含个人隐私。
// 覆盖国内外（含中国），是「扩量」的好来源。
//
// 免费额度：100 次请求 / 月，每次 /search 最多返回 10 条。
//   → 所以本文件默认每次只翻 PAGES 页（下方常量），配合每天跑一次，
//     30 天 ≈ PAGES×30 次请求，控制在 100 以内。想多抓就自己算好别超。
//
// 你需要先做两件事（拿钥匙）：
//   1) 注册 RapidAPI（不用信用卡）：https://rapidapi.com/auth/sign-up
//   2) 订阅「Job Postings API」的 Basic 免费计划，复制你的 API Key
//   3) 把 Key 放进环境变量（千万别写死在代码里！）：
//        Windows PowerShell:  $env:TECHMAP_API_KEY="你的key"
//        macOS/Linux 终端:    export TECHMAP_API_KEY="你的key"
// ============================================================

const HOST = "daily-international-job-postings.p.rapidapi.com";
const BASE = `https://${HOST}/api/v2/jobs/search`;
const PAGES = 3;                 // 每次运行翻几页（决定用量，别超免费额度）
const COUNTRY = "cn";            // "cn"=中国；想抓全球就改成 "" 或 "us" 等

async function fetchJobs() {
  const KEY = process.env.TECHMAP_API_KEY;
  if (!KEY) {
    throw new Error("没找到 TECHMAP_API_KEY 环境变量，请先设置 API Key（见文件顶部说明）");
  }

  // 认证：官方文档写的是 Authorization: Bearer；RapidAPI 网关也认 x-rapidapi-key。
  // 两个都带上，哪种环境都不会被拒。
  const headers = {
    "Authorization": `Bearer ${KEY}`,
    "x-rapidapi-key": KEY,
    "x-rapidapi-host": HOST
  };

  // 取「最近一个月」的岗位（API 要求显式指定日期，不然默认只给前天）
  const ym = new Date().toISOString().slice(0, 7); // 形如 "2026-08"

  const out = [];
  for (let page = 1; page <= PAGES; page++) {
    const url = `${BASE}?dateCreated=${ym}&countryCode=${COUNTRY}&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    for (const j of data.result || []) {
      out.push({
        company: j.company || "未知公司",
        title: j.title || "未命名岗位",
        city: j.city || (j.workPlace && j.workPlace[0]) || "—",
        category: j.industry || "其他",
        salary: formatSalary(j),
        education: "—",                                       // 该接口不提供学历
        experience: (j.careerLevel && j.careerLevel[0]) || "—",
        deadline: "",                                        // 免费档无截止日
        link: (j.jsonLD && j.jsonLD.url) || "",              // 真实投递/详情链接
        source: "Techmap"
      });
    }

    // 这一页没满 10 条，说明已经到末尾，不用再翻了
    if (!data.result || data.result.length < 10) break;
  }
  return out;
}

function formatSalary(j) {
  if (!j.hasSalary || (j.minSalary == null && j.maxSalary == null)) return "面议";
  const min = j.minSalary != null ? j.minSalary : "";
  const max = j.maxSalary != null ? j.maxSalary : "";
  return `${min}-${max}`;
}

module.exports = { name: "Techmap", fetchJobs };
