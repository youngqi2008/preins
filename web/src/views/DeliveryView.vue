<template>
  <section>
    <header class="head">
      <div>
        <h1>投放数据</h1>
        <p>按广告主维度汇总所选周期的消耗、点击与余额</p>
      </div>
      <button class="btn ghost" type="button" @click="exportCsv">↓ 下载</button>
    </header>

    <div class="card filters">
      <div class="filter-grid">
        <label>
          <span>数据日期</span>
          <div class="range">
            <input v-model="start" type="date" />
            <em>至</em>
            <input v-model="end" type="date" />
          </div>
        </label>
        <label>
          <span>广告主编号</span>
          <input v-model.trim="account" class="control" placeholder="如 23871230" />
        </label>
        <label>
          <span>投放计划名称</span>
          <input v-model.trim="keyword" class="control" placeholder="输入计划或账户关键字" @keyup.enter="pageNo = 1" />
        </label>
      </div>
      <div class="summary">
        <span>账户 <b>{{ accountCount }}</b> 个</span>
        <span>点击量合计 <b>{{ integer(clickTotal) }}</b></span>
        <span>花费合计 <b>¥ {{ money(spendTotal) }}</b></span>
        <div class="actions">
          <button class="btn ghost" type="button" @click="reset">重置</button>
          <button class="btn primary" type="button" @click="pageNo = 1">查询</button>
        </div>
      </div>
    </div>

    <div class="card table-card">
      <div class="table-head">
        <b>数据报表 <em>金额单位：元</em></b>
        <button class="btn ghost" type="button" @click="exportCsv">下载报表</button>
      </div>
      <div v-if="loading" class="loading-line"></div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <div v-else class="table-scroll">
        <table class="sheet">
          <thead>
            <tr>
              <th class="check"><input type="checkbox" :checked="allChecked" @change="toggleAll" /></th>
              <th>账户名称</th>
              <th>计划 ID</th>
              <th>账户状态</th>
              <th class="num">点击量</th>
              <th class="num">点击成本</th>
              <th class="num">余额</th>
              <th class="num">花费</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pageRows" :key="row.id">
              <td class="check"><input v-model="checked" type="checkbox" :value="row.id" /></td>
              <td>
                <div class="name">{{ row.account }}</div>
                <div class="sub">ID: {{ row.accountId || '—' }}</div>
              </td>
              <td>{{ row.id }}</td>
              <td><span :class="['pill', row.tone]">{{ row.status }}</span></td>
              <td class="num">{{ integer(row.clicks) }}</td>
              <td class="num">{{ money(row.cpc) }}</td>
              <td class="num">{{ money(row.balance) }}</td>
              <td class="num spend">{{ money(row.spend) }}</td>
              <td><button class="btn link" type="button" @click="current = row">查看</button></td>
            </tr>
            <tr v-if="!filtered.length"><td colspan="9" class="empty">该周期没有投放数据</td></tr>
          </tbody>
        </table>
      </div>
      <div class="pager">
        <span>共 {{ filtered.length }} 条</span>
        <label>
          每页
          <select v-model.number="pageSize">
            <option :value="8">8</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </label>
        <button type="button" :disabled="pageNo <= 1" @click="pageNo -= 1">‹</button>
        <button type="button" class="on">{{ pageNo }}</button>
        <button type="button" :disabled="pageNo >= pageCount" @click="pageNo += 1">›</button>
      </div>
    </div>

    <div v-if="current" class="mask" @click.self="current = null">
      <div class="dialog">
        <h3>{{ current.name }}</h3>
        <p class="sub">{{ current.account }} · 计划 {{ current.id }}</p>
        <div class="detail">
          <div><span>状态</span><b>{{ current.status }}</b></div>
          <div><span>预算</span><b>{{ yuan(current.budget) }}</b></div>
          <div><span>花费</span><b>{{ yuan(current.spend) }}</b></div>
          <div><span>余额</span><b>{{ yuan(current.balance) }}</b></div>
          <div><span>点击量</span><b>{{ integer(current.clicks) }}</b></div>
          <div><span>点击成本</span><b>{{ yuan(current.cpc) }}</b></div>
          <div><span>投放周期</span><b>{{ current.period }}</b></div>
          <div><span>结算说明</span><b>{{ current.rule }}</b></div>
        </div>
        <div class="dialog-actions">
          <button class="btn ghost" type="button" @click="current = null">关闭</button>
          <router-link class="btn primary go" :to="`/budget`">去投放管理</router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import { fetchAll, type Row } from '@/api/http';
import { downloadCsv, inRange, integer, money, num, yuan } from '@/utils/format';

interface ReportRow {
  id: string;
  name: string;
  account: string;
  accountId: string;
  status: string;
  tone: string;
  clicks: number;
  cpc: number;
  balance: number;
  spend: number;
  budget: number;
  period: string;
  rule: string;
  created: string;
}

const route = useRoute();
const loading = ref(false);
const error = ref('');
const rows = ref<ReportRow[]>([]);
const start = ref(dayjs().subtract(5, 'day').format('YYYY-MM-DD'));
const end = ref(dayjs().format('YYYY-MM-DD'));
const account = ref('');
const keyword = ref(typeof route.query.q === 'string' ? route.query.q : '');
const pageNo = ref(1);
const pageSize = ref(8);
const checked = ref<string[]>([]);
const current = ref<ReportRow | null>(null);

const filtered = computed(() =>
  rows.value.filter((row) => {
    const accountHit = !account.value || row.accountId.includes(account.value) || row.account.includes(account.value);
    const text = `${row.name} ${row.id} ${row.account}`.toLowerCase();
    const keyHit = !keyword.value || text.includes(keyword.value.toLowerCase());
    return accountHit && keyHit;
  }),
);
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));
const pageRows = computed(() => {
  const begin = (pageNo.value - 1) * pageSize.value;
  return filtered.value.slice(begin, begin + pageSize.value);
});
const allChecked = computed(() => pageRows.value.length > 0 && pageRows.value.every((row) => checked.value.includes(row.id)));
const accountCount = computed(() => new Set(filtered.value.map((row) => row.accountId || row.account)).size);
const clickTotal = computed(() => filtered.value.reduce((sum, row) => sum + row.clicks, 0));
const spendTotal = computed(() => filtered.value.reduce((sum, row) => sum + row.spend, 0));

watch([start, end, account, keyword, pageSize], () => {
  pageNo.value = 1;
});
watch(pageCount, () => {
  if (pageNo.value > pageCount.value) pageNo.value = pageCount.value;
});
watch(
  () => route.query.q,
  (value) => {
    if (typeof value === 'string') keyword.value = value;
  },
);

function statusOf(value: unknown) {
  const n = Number(value);
  if (n === 1) return { status: '正常', tone: 'ok' };
  if (n === 2) return { status: '余额不足', tone: 'bad' };
  if (n === 0) return { status: '已暂停', tone: '' };
  return { status: '审核中', tone: 'warn' };
}

function build(budgets: Row[], orders: Row[]) {
  return budgets.map((budget) => {
    const related = orders.filter(
      (order) => String(order.budgetid || '') === String(budget.id) && inRange(order.createTime, start.value, end.value),
    );
    const spend = related.reduce((sum, order) => sum + (num(order.channelprice) || num(order.outprice)), 0);
    const budgetAmount = num(budget.upprice);
    const clicks = related.length;
    const state = statusOf(budget.onlinestatus);
    return {
      id: String(budget.id || ''),
      name: String(budget.taskname || budget.appname || budget.id || ''),
      account: String(budget.supplier || '未命名账户'),
      accountId: String(budget.supplierid || ''),
      ...state,
      clicks,
      spend,
      budget: budgetAmount,
      balance: budgetAmount - spend,
      cpc: clicks ? spend / clicks : 0,
      period: [budget.startTime, budget.endTime].filter(Boolean).join(' 至 ') || '—',
      rule: String(budget.transobjdesc || '—'),
      created: String(budget.createTime || ''),
    };
  });
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [budgets, orders] = await Promise.all([fetchAll('/preinstall/cTBudget/list'), fetchAll('/preinstall/cTOrder/list')]);
    rows.value = build(budgets, orders);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '报表加载失败';
  } finally {
    loading.value = false;
  }
}

function reset() {
  start.value = dayjs().subtract(5, 'day').format('YYYY-MM-DD');
  end.value = dayjs().format('YYYY-MM-DD');
  account.value = '';
  keyword.value = '';
  load();
}

function toggleAll(event: Event) {
  const on = (event.target as HTMLInputElement).checked;
  const ids = pageRows.value.map((row) => row.id);
  checked.value = on ? Array.from(new Set([...checked.value, ...ids])) : checked.value.filter((id) => !ids.includes(id));
}

function exportCsv() {
  const source = checked.value.length ? filtered.value.filter((row) => checked.value.includes(row.id)) : filtered.value;
  downloadCsv(`投放数据_${start.value}_${end.value}.csv`, [
    ['账户名称', '账户ID', '计划ID', '计划名称', '状态', '点击量', '点击成本', '余额', '花费'],
    ...source.map((row) => [
      row.account,
      row.accountId,
      row.id,
      row.name,
      row.status,
      String(row.clicks),
      money(row.cpc),
      money(row.balance),
      money(row.spend),
    ]),
  ]);
}

onMounted(load);
watch([start, end], load);
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
h1 { margin: 0; font-size: 22px; }
.head p { margin: 6px 0 0; color: var(--muted); font-size: 13px; }
.filters, .table-card { margin-bottom: 14px; }
.filters { padding: 16px; }
.filter-grid { display: grid; grid-template-columns: 1.3fr 1fr 1.2fr; gap: 12px; }
.filter-grid span, .summary { color: #8d8084; font-size: 12px; }
.filter-grid span { display: block; margin-bottom: 6px; }
.range, .summary { display: flex; align-items: center; gap: 8px; }
.range input, .filter-grid .control { background: #f7f4f4; }
.range input { height: 38px; border: 0; border-radius: 8px; padding: 0 10px; background: #f7f4f4; color: var(--ink); }
.summary { margin-top: 14px; font-size: 13px; }
.summary b { color: var(--ink); font-size: 14px; }
.actions { margin-left: auto; display: flex; gap: 8px; }
.table-card { padding: 8px 8px 12px; }
.table-head { display: flex; justify-content: space-between; align-items: center; padding: 8px 8px 4px; }
.table-head em { font-style: normal; color: #b0a4a7; font-weight: 400; font-size: 12px; margin-left: 6px; }
.table-scroll { overflow: auto; }
.check { width: 42px; }
.name { color: #3c3336; }
.sub { color: #b0a4a7; font-size: 12px; margin-top: 3px; }
.spend { color: #c51432; font-weight: 650; }
.detail { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.detail span { display: block; color: #8d8084; font-size: 12px; margin-bottom: 4px; }
.go { display: inline-grid; place-items: center; }
@media (max-width: 1000px) {
  .filter-grid { grid-template-columns: 1fr; }
  .summary { flex-wrap: wrap; }
  .actions { margin-left: 0; }
}
</style>
