// ============================================================
// 自动更新主程序（fetch.js）
// ------------------------------------------------------------
// 「自动更新」就是：这个脚本去各个来源把岗位抓回来 → 合并 → 去重 →
// 写回 ../jobs.js（也就是网站读的那个数据文件）。
// 下次再跑，jobs.js 就被新鲜数据覆盖了。
//
// 用法（在你电脑的「终端/命令行」里，进入 update 文件夹后运行）：
//   node fetch.js
// ============================================================

const fs = require("fs");
const path = require("path");

const SOURCES_DIR = path.join(__dirname, "sources");          // 各个来源的代码放这里
const OUTPUT = path.join(__dirname, "..", "jobs.js");          // 写回网站的数据文件

// —— 手动示例种子（第 1 步那 10 条）。想纯自动就删掉这段。 ——
const SEED = [
  { company: "【示例】星河科技", title: "前端开发实习生", city: "北京", category: "互联网", salary: "200-300/天", education: "本科", experience: "在校/应届", deadline: "2026-09-30", link: "https://example.com/job/1", source: "校招官网", type: "实习" },
  { company: "【示例】云图数据", title: "数据分析师（校招）", city: "上海", category: "互联网", salary: "15-22K", education: "本科", experience: "应届", deadline: "2026-10-15", link: "https://example.com/job/2", source: "企业招聘页", type: "校招" },
  { company: "【示例】远见咨询", title: "商业分析实习生", city: "广州", category: "金融", salary: "180-260/天", education: "本科", experience: "在校/应届", deadline: "2026-09-20", link: "https://example.com/job/3", source: "校招官网", type: "实习" },
  { company: "【示例】新光传媒", title: "内容运营（社招）", city: "深圳", category: "传媒", salary: "10-16K", education: "大专", experience: "1-3年", deadline: "2026-12-01", link: "https://example.com/job/4", source: "企业招聘页", type: "社招" },
  { company: "【示例】恒信制造", title: "供应链管理培训生", city: "苏州", category: "制造", salary: "9-13K", education: "本科", experience: "应届", deadline: "2026-11-10", link: "https://example.com/job/5", source: "校招官网", type: "校招" },
  { company: "【示例】智联医疗", title: "医学事务专员", city: "杭州", category: "医疗", salary: "12-18K", education: "硕士", experience: "应届", deadline: "2026-10-31", link: "https://example.com/job/6", source: "企业招聘页", type: "校招" },
  { company: "【示例】方圆教育", title: "课程产品经理（实习）", city: "北京", category: "教育", salary: "200-280/天", education: "本科", experience: "在校/应届", deadline: "2026-09-25", link: "https://example.com/job/7", source: "校招官网", type: "实习" },
  { company: "【示例】蓝海游戏", title: "游戏策划实习生", city: "上海", category: "互联网", salary: "220-300/天", education: "本科", experience: "在校/应届", deadline: "2026-10-20", link: "https://example.com/job/8", source: "企业招聘页", type: "实习" },
  { company: "【示例】绿野农业", title: "农业技术销售", city: "成都", category: "制造", salary: "8-12K", education: "大专", experience: "1-3年", deadline: "2026-12-15", link: "https://example.com/job/9", source: "社招官网", type: "社招" },
  { company: "【示例】明德研究院", title: "行业研究员（校招）", city: "北京", category: "金融", salary: "14-20K", education: "硕士", experience: "应届", deadline: "2026-11-05", link: "https://example.com/job/10", source: "校招官网", type: "校招" }
];

// ---------- 招聘类型兜底：把「校招 / 实习 / 社招」标清楚 ----------
// 每条岗位最终都要有 type 字段。来源没给时，按标题/经历关键字推断：
//   含「实习」→ 实习；含「校招/校园/应届」→ 校招；其余默认 社招。
const TYPES = ["校招", "实习", "社招"];
function normalizeType(j) {
  if (j.type && TYPES.includes(j.type)) return j;
  const t = `${j.title || ""}${j.experience || ""}${j.category || ""}`;
  let type = "社招";
  if (/实习/.test(t)) type = "实习";
  else if (/校招|校园|应届|graduate/i.test(t)) type = "校招";
  return Object.assign({}, j, { type });
}

async function main() {
  // 读取 sources 文件夹里所有 .js（下划线开头的 _template.js 会被忽略，不会运行）
  const files = fs.readdirSync(SOURCES_DIR)
    .filter(f => f.endsWith(".js") && !f.startsWith("_"));

  let all = SEED.map(normalizeType); // 先放入手动示例（已带 type），再追加各来源抓回的数据

  for (const f of files) {
    const mod = require(path.join(SOURCES_DIR, f));
    try {
      const jobs = await mod.fetchJobs();
      console.log(`✓ ${mod.name || f}: 抓到 ${jobs.length} 条`);
      all = all.concat(jobs);
    } catch (e) {
      console.warn(`✗ ${mod.name || f} 失败: ${e.message}`);
    }
  }

  // 兜底：确保所有岗位都有正确的 type（校招/实习/社招）
  all = all.map(normalizeType);

  // 去重：同一 link 只留一条（没有 link 就用 公司+岗位+城市 当指纹）
  const seen = new Set();
  const deduped = [];
  for (const j of all) {
    const key = j.link || `${j.company}|${j.title}|${j.city}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(j);
  }

  const header = "// 本文件由 update/fetch.js 自动生成，请勿手改；数据来自各来源。\n";
  const body = `window.JOBS = ${JSON.stringify(deduped, null, 2)};\n`;
  fs.writeFileSync(OUTPUT, header + body, "utf8");
  console.log(`\n完成：共 ${deduped.length} 条，已写入 ${OUTPUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
