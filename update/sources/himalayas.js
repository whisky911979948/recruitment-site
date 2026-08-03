// ============================================================
// 来源示例：Himalayas 免费公开 JSON API（无需密钥）
// ------------------------------------------------------------
// 合规说明：这是官方开放的接口，文档要求注明来源——我们已在 source
// 字段标注 "Himalayas·远程岗"。属于上文第②类「免费公开 API」。
//
// 注意：Himalayas 主要是「海外 / 远程」岗位，用来演示「自动更新」
// 管道能不能跑通最合适。等后面接国内政府/高校来源（第①类），
// 照着这个文件的写法再写一个 sources/xxx.js 就行。
// ============================================================

const ENDPOINT = "https://himalayas.app/jobs/api";

// 每个来源都必须导出：name（名字）和 fetchJobs（返回岗位数组的异步函数）
async function fetchJobs() {
  const out = [];
  let offset = 0;
  const limit = 20;

  // 演示只取前 3 页（60 条），避免请求过多被限流。真实用可加大或写循环翻页。
  for (let page = 0; page < 3; page++) {
    const url = `${ENDPOINT}?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    for (const j of data.jobs || []) {
      out.push({
        company: j.companyName || "未知公司",
        title: j.title || "未命名岗位",
        city: (j.locationRestrictions || []).join("、") || "远程",
        category: (j.parentCategories && j.parentCategories[0]) || (j.categories && j.categories[0]) || "其他",
        salary: formatSalary(j),
        education: "—",                                  // 该接口不提供学历，留空
        experience: (j.seniority && j.seniority[0]) || "—",
        deadline: "",                                   // 该接口无截止日，留空（网站显示"未注明"）
        link: j.applicationLink || `https://himalayas.app/companies/${j.companySlug}`,
        source: "Himalayas·远程岗"
      });
    }

    offset += limit;
    if (!data.jobs || data.jobs.length < limit) break;   // 没更多了就停
  }
  return out;
}

// 把接口里的薪资数字整理成网站能显示的字符串
function formatSalary(j) {
  if (j.minSalary == null && j.maxSalary == null) return "面议";
  const cur = j.currency || "USD";
  const min = j.minSalary != null ? j.minSalary : "";
  const max = j.maxSalary != null ? j.maxSalary : "";
  const period = j.salaryPeriod === "annual" ? "/年" : (j.salaryPeriod || "");
  return `${cur} ${min}-${max}${period}`;
}

module.exports = { name: "Himalayas", fetchJobs };
