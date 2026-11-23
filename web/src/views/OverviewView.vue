<template>
  <section>
    <header class="head">
      <h1>概览</h1>
      <span>最新数据：{{ updatedAt }}</span>
    </header>

    <div v-if="error" class="card warn-card">{{ error }}</div>

    <div class="metrics card">
      <article>
        <span>当前预算总额</span>
        <strong>{{ yuan(kpi.budget) }}</strong>
      </article>
      <article>
        <span>今日广告消耗</span>
        <strong>{{ yuan(kpi.spend) }}</strong>
      </article>
      <article>
        <span>今日收益</span>
        <strong>{{ yuan(kpi.income) }}</strong>
      </article>
      <article>
        <span>今日有效点击量</span>
        <strong>{{ integer(kpi.clicks) }}<small> 次</small></strong>
      </article>
    </div>

    <div class="card chart-card">
      <div class="chart-head">
        <b>数据趋势 <em>预算/消耗/收益/点击</em></b>
        <label>
          <input v-model="rangeStart" type="date" />
          <span>至</span>
          <input v-model="rangeEnd" type="date" />
        </label>
      </div>
      <div ref="chartEl" class="chart"></div>
    </div>

    <div class="split">
      <div class="card block">
        <div class="block-title">今日创建 <em>共 {{ createdToday.length }} 条</em></div>
        <table class="sheet">
          <thead>
            <tr>
              <th>计划名称</th>
              <th class="num">点击量</th>
              <th class="num">预算消耗</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in createdToday" :key="item.id">
              <td>{{ item.name }}</td>
              <td class="num">{{ integer(item.clicks) }}</td>
              <td class="num">{{ money(item.spend) }}</td>
            </tr>
            <tr v-if="!createdToday.length"><td colspan="3" class="empty">今天还没有新建计划</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card block">
        <div class="block-title">计划消耗 <em>按已消耗金额</em></div>
        <ul class="consume">
          <li v-for="item in consumeTop" :key="item.id">
            <div class="row">
              <b>{{ item.name }}</b>
              <span>{{ item.percent }}%</span>
              <em>¥ {{ money(item.spend) }}</em>
            </div>
            <div class="bar"><i :style="{ width: item.percent + '%' }"></i></div>
          </li>
          <li v-if="!consumeTop.length" class="empty">暂无消耗数据</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import dayjs from 'dayjs';
import * as echarts from 'echarts';
import { fetchAll, type Row } from '@/api/http';
import { integer, money, num, yuan } from '@/utils/format';

const updatedAt = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'));
const error = ref('');
const budgets = ref<Row[]>([]);
const orders = ref<Row[]>([]);
const rangeStart = ref(dayjs().subtract(5, 'day').format('YYYY-MM-DD'));
const rangeEnd = ref(dayjs().format('YYYY-MM-DD'));
const chartEl = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;
let timer = 0;

const today = computed(() => dayjs().format('YYYY-MM-DD'));

function orderSpend(row: Row) {
  return num(row.channelprice) || num(row.outprice);
}

const todayOrders = computed(() => orders.value.filter((row) => String(row.createTime || '').startsWith(today.value)));

const kpi = computed(() => {
  const budget = budgets.value
    .filter((row) => Number(row.onlinestatus) === 1)
    .reduce((sum, row) => sum + num(row.upprice), 0);
  const spend = todayOrders.value.reduce((sum, row) => sum + orderSpend(row), 0);
  const income = todayOrders.value
    .filter((row) => Number(row.paystatus) === 3)
    .reduce((sum, row) => sum + num(row.outprice), 0);
  return { budget, spend, income, clicks: todayOrders.value.length };
});

const days = computed(() => {
  const list: string[] = [];
  let cursor = dayjs(rangeStart.value);
  const end = dayjs(rangeEnd.value);
  if (!cursor.isValid() || !end.isValid() || cursor.isAfter(end)) return list;
  while (!cursor.isAfter(end) && list.length < 31) {
    list.push(cursor.format('YYYY-MM-DD'));
    cursor = cursor.add(1, 'day');
  }
  return list;
});

const createdToday = computed(() =>
  budgets.value
    .filter((row) => String(row.createTime || '').startsWith(today.value))
    .slice(0, 6)
    .map((row) => {
      const related = todayOrders.value.filter((order) => String(order.budgetid || '') === String(row.id));
      return {
        id: String(row.id),
        name: String(row.taskname || row.appname || row.id),
        clicks: related.length,
        spend: related.reduce((sum, order) => sum + orderSpend(order), 0),
      };
    }),
);

const consumeTop = computed(() => {
  const grouped = new Map<string, { id: string; name: string; spend: number; budget: number }>();
  for (const row of budgets.value) {
    grouped.set(String(row.id), {
      id: String(row.id),
      name: String(row.taskname || row.id),
      spend: 0,
      budget: num(row.upprice),
    });
  }
  for (const order of orders.value) {
    const id = String(order.budgetid || '');
    const item = grouped.get(id);
    if (item) item.spend += orderSpend(order);
  }
  return [...grouped.values()]
    .filter((item) => item.spend > 0 || item.budget > 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      percent: item.budget > 0 ? Math.min(100, Math.round((item.spend / item.budget) * 100)) : 0,
    }));
});

function renderChart() {
  if (!chartEl.value) return;
  if (!chart) chart = echarts.init(chartEl.value);
  const labels = days.value.map((day) => day.slice(5));
  const budgetSeries = days.value.map((day) =>
    budgets.value
      .filter((row) => String(row.createTime || '').startsWith(day) || Number(row.onlinestatus) === 1)
      .reduce((sum, row) => sum + (String(row.createTime || '').startsWith(day) ? num(row.upprice) : 0), 0),
  );
  const spendSeries = days.value.map((day) =>
    orders.value.filter((row) => String(row.createTime || '').startsWith(day)).reduce((sum, row) => sum + orderSpend(row), 0),
  );
  const incomeSeries = days.value.map((day) =>
    orders.value
      .filter((row) => String(row.createTime || '').startsWith(day) && Number(row.paystatus) === 3)
      .reduce((sum, row) => sum + num(row.outprice), 0),
  );
  const clickSeries = days.value.map(
    (day) => orders.value.filter((row) => String(row.createTime || '').startsWith(day)).length,
  );
  chart.setOption({
    color: ['#c4a484', '#e58b98', '#c51432', '#8a5a32'],
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      data: ['当前预算总额', '今日广告消耗', '今日收益', '今日有效点击量'],
      icon: 'circle',
      itemWidth: 8,
      textStyle: { color: '#7d7175' },
    },
    grid: { left: 48, right: 16, top: 48, bottom: 28 },
    xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#efe6e6' } }, axisLabel: { color: '#9a8c90' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f4ecec' } }, axisLabel: { color: '#9a8c90' } },
    series: [
      { name: '当前预算总额', type: 'line', smooth: true, showSymbol: false, data: budgetSeries },
      { name: '今日广告消耗', type: 'line', smooth: true, showSymbol: false, data: spendSeries },
      { name: '今日收益', type: 'line', smooth: true, showSymbol: false, data: incomeSeries },
      { name: '今日有效点击量', type: 'line', smooth: true, showSymbol: false, data: clickSeries },
    ],
  });
}

async function load() {
  error.value = '';
  try {
    const [budgetRows, orderRows] = await Promise.all([
      fetchAll('/preinstall/cTBudget/list'),
      fetchAll('/preinstall/cTOrder/list'),
    ]);
    budgets.value = budgetRows;
    orders.value = orderRows;
    updatedAt.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
    renderChart();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '概览数据加载失败';
  }
}

function onResize() {
  chart?.resize();
}

watch([rangeStart, rangeEnd, budgets, orders], renderChart);

onMounted(() => {
  load();
  window.addEventListener('resize', onResize);
  timer = window.setInterval(load, 5 * 60 * 1000);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  window.clearInterval(timer);
  chart?.dispose();
});
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
h1 { margin: 0; font-size: 22px; }
.head span { color: #9a8c90; font-size: 13px; }
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 8px 0;
  margin-bottom: 14px;
}
.metrics article { padding: 18px 22px; }
.metrics article + article { box-shadow: inset 1px 0 0 #f3e8e8; }
.metrics span { color: #8d8084; font-size: 13px; }
.metrics strong { display: block; margin-top: 10px; font-size: 28px; font-weight: 700; letter-spacing: 0.2px; }
.metrics small { font-size: 14px; font-weight: 500; margin-left: 4px; }
.chart-card { padding: 16px 16px 8px; margin-bottom: 14px; }
.chart-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.chart-head b { font-size: 15px; }
.chart-head em { font-style: normal; color: #9a8c90; font-weight: 400; margin-left: 6px; font-size: 13px; }
.chart-head label { display: flex; align-items: center; gap: 8px; color: #8d8084; font-size: 13px; }
.chart-head input { border: 1px solid #f0e4e4; border-radius: 8px; height: 32px; padding: 0 8px; color: #5c5256; }
.chart { height: 320px; }
.split { display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; }
.block { padding: 8px 8px 12px; min-height: 240px; }
.block-title { padding: 10px 8px 4px; font-weight: 650; }
.block-title em { font-style: normal; color: #b0a4a7; font-weight: 400; font-size: 12px; margin-left: 6px; }
.consume { list-style: none; margin: 8px 0 0; padding: 0 10px; }
.consume li { margin-bottom: 16px; }
.row { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; font-size: 13px; }
.row b { font-weight: 550; }
.row span, .row em { color: #8d8084; font-style: normal; }
.bar { margin-top: 8px; height: 6px; border-radius: 6px; background: #f6e4e6; overflow: hidden; }
.bar i { display: block; height: 100%; background: linear-gradient(90deg, #c4a484, #d7b79a); }
.warn-card { padding: 12px 16px; margin-bottom: 12px; color: #a12638; }
@media (max-width: 1100px) {
  .metrics, .split { grid-template-columns: 1fr 1fr; }
  .metrics article:nth-child(3) { box-shadow: none; }
}
@media (max-width: 720px) {
  .metrics, .split { grid-template-columns: 1fr; }
  .chart-head { flex-direction: column; align-items: flex-start; }
}
</style>
