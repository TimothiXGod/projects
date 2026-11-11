const KEY = "tally-data-v1";
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const monthKey = (d) => d.slice(0, 7);
const thisMonth = monthKey(today());
const monthLabel = (k) => {
  const [y, m] = k.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
};

let state = load();
let view = thisMonth;
let chart = null;

function load() {
  const fresh = { currency: "USD", budgets: {}, expenses: [] };
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.expenses)) {
      const out = { ...fresh, ...s, budgets: s.budgets || {} };
      if (s.budget > 0 && !s.budgets) out.budgets[thisMonth] = s.budget; // migrate older saves
      delete out.budget;
      return out;
    }
  } catch (e) { /* storage unavailable or corrupted: start fresh */ }
  return fresh;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

function money(n) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: state.currency }).format(n); }
  catch (e) { return state.currency + " " + n.toFixed(2); }
}
const spentIn = (k) => state.expenses.filter((e) => monthKey(e.date) === k).reduce((s, e) => s + e.amount, 0);

function daysLeftInMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1; // includes today
}

function render() {
  const items = state.expenses.filter((e) => monthKey(e.date) === view).sort((a, b) => b.date.localeCompare(a.date));
  const budget = state.budgets[view] || 0;
  const spent = spentIn(view);
  const left = budget - spent;
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const isCurrent = view === thisMonth;
  const label = monthLabel(view);

  $("viewMonth").value = view;
  $("currency").value = state.currency;
  $("budgetTitle").textContent = `Budget for ${label}`;
  $("budgetInput").value = budget > 0 ? budget : "";
  $("listTitle").textContent = `Expenses in ${label}`;

  // Hero
  const num = $("safeToday");
  num.classList.toggle("over", budget > 0 && left < 0);
  if (budget <= 0) {
    $("heroLabel").textContent = isCurrent ? "You can safely spend today" : `Left in ${label}`;
    num.textContent = money(0);
    $("heroSub").textContent = `Set a budget for ${label} below to get started.`;
  } else if (isCurrent) {
    $("heroLabel").textContent = "You can safely spend today";
    num.textContent = money(left > 0 ? left / daysLeftInMonth() : 0);
    $("heroSub").textContent = left > 0
      ? `${money(left)} left of ${money(budget)} for the next ${daysLeftInMonth()} days.`
      : `You’re ${money(-left)} over budget with ${daysLeftInMonth()} days left.`;
  } else {
    $("heroLabel").textContent = `Left in ${label}`;
    num.textContent = money(Math.max(left, 0));
    $("heroSub").textContent = `Spent ${money(spent)} of ${money(budget)}.` + (left < 0 ? ` Over by ${money(-left)}.` : "");
  }

  // Meter
  const fill = $("meterFill");
  fill.style.width = pct + "%";
  fill.className = pct >= 100 ? "over" : pct >= 80 ? "warn" : "";
  $("meter").setAttribute("aria-valuenow", Math.round(pct));

  // Expenses list
  const list = $("list");
  list.innerHTML = "";
  items.forEach((e) => {
    const li = document.createElement("li");
    const main = document.createElement("div");
    main.className = "li-main";
    const title = document.createElement("strong");
    title.textContent = e.note || e.category;
    const meta = document.createElement("small");
    meta.textContent = `${e.category} · ${e.date}`;
    main.append(title, meta);
    const amt = document.createElement("span");
    amt.className = "amt";
    amt.textContent = money(e.amount);
    const del = document.createElement("button");
    del.className = "del";
    del.type = "button";
    del.textContent = "Delete";
    del.setAttribute("aria-label", `Delete ${title.textContent}, ${money(e.amount)}`);
    del.addEventListener("click", () => { state.expenses = state.expenses.filter((x) => x.id !== e.id); save(); render(); });
    li.append(main, amt, del);
    list.appendChild(li);
  });
  $("listEmpty").hidden = items.length > 0;

  renderMonths();
  renderChart(items);
  $("date").value = isCurrent ? today() : view + "-01";
}

function renderMonths() {
  const keys = new Set([thisMonth, view, ...Object.keys(state.budgets), ...state.expenses.map((e) => monthKey(e.date))]);
  const list = $("months");
  list.innerHTML = "";
  [...keys].sort().reverse().forEach((k) => {
    const b = state.budgets[k] || 0;
    const s = spentIn(k);
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "month-btn";
    if (k === view) btn.setAttribute("aria-current", "true");
    const name = document.createElement("strong");
    name.textContent = monthLabel(k);
    const info = document.createElement("span");
    info.className = "amt" + (b > 0 && s > b ? " bad" : "");
    info.textContent = b > 0 ? `${money(s)} of ${money(b)}` : `${money(s)} spent, no budget`;
    btn.append(name, info);
    btn.addEventListener("click", () => { view = k; render(); window.scrollTo({ top: 0 }); });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function renderChart(items) {
  const totals = {};
  items.forEach((e) => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
  const labels = Object.keys(totals);
  $("chartEmpty").hidden = labels.length > 0;
  $("chart").hidden = labels.length === 0;
  if (typeof Chart === "undefined") return; // CDN blocked: the rest of the app still works
  if (chart) { chart.destroy(); chart = null; }
  if (!labels.length) return;
  chart = new Chart($("chart"), {
    type: "doughnut",
    data: { labels, datasets: [{ data: labels.map((l) => totals[l]), backgroundColor: ["#0b7f72", "#f2b632", "#d9442f", "#4a6fa5", "#8e6bbf", "#7a8794"], borderWidth: 0 }] },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { color: getComputedStyle(document.body).color } },
        tooltip: { callbacks: { label: (c) => `${c.label}: ${money(c.parsed)}` } },
      },
    },
  });
}

$("viewMonth").addEventListener("change", (e) => { if (e.target.value) { view = e.target.value; render(); } });
$("currency").addEventListener("change", (e) => { state.currency = e.target.value; save(); render(); });

$("saveBudget").addEventListener("click", () => {
  const v = parseFloat($("budgetInput").value);
  if (isNaN(v) || v < 0) { $("budgetInput").focus(); return; }
  state.budgets[view] = v;
  save();
  render();
});

$("expenseForm").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const amount = parseFloat($("amount").value);
  if (isNaN(amount) || amount <= 0) return;
  const date = $("date").value || today();
  state.expenses.push({ id: Date.now() + Math.random(), amount, category: $("category").value, date, note: $("note").value.trim() });
  view = monthKey(date); // jump to the month the expense belongs to
  save();
  $("amount").value = "";
  $("note").value = "";
  render();
  $("amount").focus();
});

$("exportBtn").addEventListener("click", () => {
  const rows = [["date", "category", "note", "amount"]].concat(
    state.expenses.filter((e) => monthKey(e.date) === view).map((e) => [e.date, e.category, `"${e.note.replace(/"/g, '""')}"`, e.amount.toFixed(2)])
  );
  const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `expenses-${view}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

render();
