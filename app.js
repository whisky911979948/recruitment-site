// ============================================================
// 逻辑文件（app.js）
// ------------------------------------------------------------
// 它做的事：把 jobs.js 里的数据，变成页面上能看、能搜、能筛的列表。
// 你不用完全看懂每一行；先知道「它负责让网站动起来」就够了。
// ============================================================

// 拿到了数据（jobs.js 里定义的 window.JOBS）
const jobs = window.JOBS || [];

// ---------- 1. 把薪资字符串变成可以比较的数字 ----------
// 薪资有两种写法：「15-22K」按月；「200-300/天」按天（实习）。
// 这个函数把文字翻译成 {最小, 最大, 是否按天}，方便后面按区间筛选。
function parseSalary(s) {
  if (!s) return { perDay: false };
  if (s.includes("天")) {
    const m = s.match(/(\d+)\s*-\s*(\d+)/);
    if (m) return { min: +m[1], max: +m[2], perDay: true };
    const n = s.match(/(\d+)/);
    if (n) return { min: +n[1], max: +n[1], perDay: true };
    return { perDay: true };
  }
  const m = s.match(/([\d.]+)\s*-\s*([\d.]+)\s*K/i);
  if (m) return { min: +m[1] * 1000, max: +m[2] * 1000, perDay: false };
  const n = s.match(/([\d.]+)\s*K/i);
  if (n) return { min: +n[1] * 1000, max: +n[1] * 1000, perDay: false };
  return { perDay: false };
}

// ---------- 2. 自动把「城市 / 行业」填进下拉框 ----------
// 不用你手填，脚本会扫描数据里有哪些城市、哪些行业，自动列出来。
function fillSelect(id, values) {
  const sel = document.getElementById(id);
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v; opt.textContent = v;
    sel.appendChild(opt);
  });
}
const cities = [...new Set(jobs.map(j => j.city))].sort();
const categories = [...new Set(jobs.map(j => j.category))].sort();
const types = [...new Set(jobs.map(j => j.type))].sort();
fillSelect("cityFilter", cities);
fillSelect("categoryFilter", categories);
fillSelect("typeFilter", types);

// ---------- 3. 根据搜索框 + 筛选条件，挑出要显示的岗位 ----------
function getFiltered() {
  const kw = document.getElementById("searchInput").value.trim().toLowerCase();
  const city = document.getElementById("cityFilter").value;
  const cat = document.getElementById("categoryFilter").value;
  const type = document.getElementById("typeFilter").value;
  const sal = document.getElementById("salaryFilter").value; // 如 "15000-25000" 或 "perday"

  return jobs.filter(j => {
    // 关键词：岗位名或公司名里包含就算命中
    if (kw && !(j.title + j.company).toLowerCase().includes(kw)) return false;
    // 城市
    if (city && j.city !== city) return false;
    // 行业
    if (cat && j.category !== cat) return false;
    // 招聘类型：校招 / 实习 / 社招
    if (type && j.type !== type) return false;
    // 薪资区间
    if (sal) {
      const s = parseSalary(j.salary);
      if (sal === "perday") {
        if (!s.perDay) return false;
      } else {
        const [lo, hi] = sal.split("-").map(Number);
        if (s.perDay) return false;                 // 按月区间只比月薪
        if (!(s.max >= lo && s.min <= hi)) return false;
      }
    }
    return true;
  });
}

// ---------- 4. 把岗位画成一张张卡片 ----------
function render() {
  const list = getFiltered();
  const box = document.getElementById("jobList");
  document.getElementById("countBar").textContent = `共 ${list.length} 个岗位`;

  if (list.length === 0) {
    box.innerHTML = `<div class="empty">没有匹配的岗位，试试放宽筛选条件～</div>`;
    return;
  }

  box.innerHTML = list.map(j => `
    <div class="job-card">
      <div class="job-title">
        <a href="${j.link}" target="_blank" rel="noopener">${j.title}</a>
      </div>
      <div class="job-meta">
        <span class="tag type-${j.type}">${j.type}</span>
        <span class="tag">${j.company}</span>
        <span class="tag">${j.city}</span>
        <span class="tag">${j.category}</span>
        ${j.nature ? `<span class="tag">${j.nature}</span>` : ""}
        <span class="tag salary">${j.salary}</span>
        <span class="tag">${j.education}</span>
        <span class="tag">${j.experience}</span>
        <span class="tag source">来源：${j.source}</span>
      </div>
      <div class="job-foot">截止：${j.deadline || "未注明"} ｜ 投递 / 查看详情请点上方标题</div>
    </div>
  `).join("");
}

// ---------- 5. 让控件「一变就刷新」 ----------
["searchInput", "cityFilter", "categoryFilter", "typeFilter", "salaryFilter"].forEach(id => {
  document.getElementById(id).addEventListener("input", render);
  document.getElementById(id).addEventListener("change", render);
});

// 第一次打开先画一版
render();
