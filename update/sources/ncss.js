// ============================================================
// 来源：国家大学生就业服务平台（ncss.cn）—— 官方公开校招 / 实习岗位
// ------------------------------------------------------------
// 合规：教育部所属的官方公益就业平台，岗位列表接口无需登录、无需密钥，
//   直接在浏览器里就能调，返回的是公开岗位字段。属「第①类 政府公开发布」。
//   已确认 robots 未禁止该路径；请求间留 0.8s 间隔，温和取数，不给服务器压力。
//   只采集公开岗位字段，绝不碰任何个人隐私（姓名/电话/简历等）。
//
// 数据说明：
//   - 平台以大学生就业为主，所以非实习岗位统一标为「校招」；标题含「实习」的标「实习」。
//   - 薪资单位是该平台的「千元 / 月」（如 2.7-3.3 即 2700~3300 元/月）。
//   - areaCodeName 是省级行政区（如 安徽 / 北京），当「地区」筛选用。
// ============================================================

const BASE = "https://job.ncss.cn/student/jobs/jobslist/ajax/";
const PAGES = 5;        // 每次运行翻几页（每页 10 条，共约 50 条），温和取数
const DELAY = 800;      // 每页之间的间隔(ms)，避免给服务器压力

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 把平台返回的一条记录，整理成网站统一的岗位格式
function mapOne(it) {
  const name = it.jobName || "未命名岗位";
  const low = it.lowMonthPay;
  const high = it.highMonthPay;

  // 薪资：平台单位是「千元/月」
  let salary = "面议";
  if (low != null && high != null) salary = `${low}-${high}K`;
  else if (low != null) salary = `${low}K`;
  else if (high != null) salary = `${high}K`;

  // 招聘类型：含「实习」字样 → 实习；其余按校招处理（平台面向大学生）
  const type = /实习/.test(name) ? "实习" : "校招";

  return {
    company: it.recName || "未知公司",
    title: name,
    city: it.areaCodeName || "—",                 // 省级行政区
    category: "其他",                             // 该接口不提供行业，留「其他」
    salary,
    education: it.degreeName || "—",              // 学历要求
    experience: "—",                              // 接口不提供工作年限
    deadline: "",                                 // 接口无截止日
    link: `https://job.ncss.cn/student/jobs/${it.jobId}/detail.html`,
    source: "国家大学生就业服务平台",
    nature: it.recProperty || "",                 // 企业性质（民营/国有等），仅展示
    type
  };
}

async function fetchJobs() {
  const out = [];
  for (let page = 1; page <= PAGES; page++) {
    // recruitType=0 取「职位」（排除 recruitType=1 的「公告」类通知）
    const url = `${BASE}?offset=${page}&limit=10&recruitType=0`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = (data && data.data && data.data.list) || [];

    for (const it of list) out.push(mapOne(it));

    if (list.length < 10) break;   // 已经到最后一页
    await sleep(DELAY);
  }
  return out;
}

module.exports = { name: "国家大学生就业服务平台(ncss)", fetchJobs };
