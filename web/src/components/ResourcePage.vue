<template>
  <section class="page">
    <header class="page-head">
      <div>
        <h1>{{ config.title }}</h1>
        <p>{{ config.subtitle }}</p>
      </div>
      <button v-if="canCreate" class="btn primary" type="button" @click="openCreate">新建</button>
    </header>

    <div class="card filters">
      <div class="filter-grid">
        <label v-for="field in config.search" :key="field.key">
          <span>{{ field.label }}</span>
          <select v-if="field.type === 'select'" v-model="query[field.key]" class="control">
            <option value="">{{ field.placeholder || '全部' }}</option>
            <option v-for="opt in optionsOf(field)" :key="String(opt.value)" :value="String(opt.value)">{{ opt.label }}</option>
          </select>
          <input v-else v-model.trim="query[field.key]" class="control" :placeholder="field.placeholder || field.label" @keyup.enter="search" />
        </label>
      </div>
      <div class="filter-actions">
        <button class="btn ghost" type="button" @click="reset">重置</button>
        <button class="btn primary" type="button" @click="search">查询</button>
      </div>
    </div>

    <div class="card table-card">
      <div v-if="loading" class="loading-line"></div>
      <div class="table-scroll">
        <table class="sheet">
          <thead>
            <tr>
              <th v-for="col in config.columns" :key="col.key" :style="col.width ? { width: col.width } : undefined">{{ col.label }}</th>
              <th style="width: 168px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="String(row.id)">
              <td v-for="col in config.columns" :key="col.key" :class="{ clip: true }">
                <span v-if="isStatus(col.key)" :class="['pill', statusTone(row[col.key])]">{{ show(row, col) }}</span>
                <template v-else>{{ show(row, col) }}</template>
              </td>
              <td class="ops">
                <button class="btn link" type="button" @click="openView(row)">查看</button>
                <button v-if="canEdit" class="btn link" type="button" @click="openEdit(row)">编辑</button>
                <button v-if="config.copyable" class="btn link" type="button" @click="copyRow(row)">复制</button>
                <button v-if="canDelete" class="btn link danger-link" type="button" @click="askDelete(row)">删除</button>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td :colspan="config.columns.length + 1" class="empty">没有符合条件的数据</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pager">
        <span>共 {{ total }} 条</span>
        <label>
          每页
          <select :value="pageSize" @change="changeSize">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </label>
        <button type="button" :disabled="pageNo <= 1" @click="toPage(pageNo - 1)">‹</button>
        <button type="button" class="on">{{ pageNo }}</button>
        <button type="button" :disabled="pageNo >= pages" @click="toPage(pageNo + 1)">›</button>
      </div>
    </div>

    <div v-if="editing" class="mask" @click.self="editing = false">
      <div class="dialog" role="dialog">
        <h3>{{ form.id ? '编辑' : '新建' }}{{ config.title }}</h3>
        <p class="sub">带星号的字段为必填</p>
        <div class="form-grid">
          <template v-for="field in config.fields" :key="field.key">
            <div v-if="field.section" class="section-title">{{ field.section }}</div>
            <label class="field" :class="{ full: field.type === 'textarea' }">
              <span>{{ field.label }}<i v-if="field.required" class="req">*</i></span>
              <textarea v-if="field.type === 'textarea'" v-model="form[field.key]" class="control" :placeholder="field.placeholder"></textarea>
              <select v-else-if="field.type === 'select'" v-model="form[field.key]" class="control" @change="onSelect(field)">
                <option value="">请选择</option>
                <option v-for="opt in optionsOf(field)" :key="String(opt.value)" :value="String(opt.value)">{{ opt.label }}</option>
              </select>
              <input
                v-else
                v-model="form[field.key]"
                class="control"
                :type="inputType(field)"
                :placeholder="field.placeholder || `请输入${field.label}`"
              />
            </label>
          </template>
        </div>
        <div class="dialog-actions">
          <button class="btn ghost" type="button" @click="editing = false">取消</button>
          <button class="btn primary" type="button" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存' }}</button>
        </div>
      </div>
    </div>

    <div v-if="viewing" class="mask" @click.self="viewing = null">
      <div class="dialog" role="dialog">
        <h3>{{ config.title }}详情</h3>
        <div class="detail">
          <div v-for="col in detailFields" :key="col.key">
            <span>{{ col.label }}</span>
            <b>{{ show(viewing, col) }}</b>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn ghost" type="button" @click="viewing = null">关闭</button>
        </div>
      </div>
    </div>

    <div v-if="pendingDelete" class="mask" @click.self="pendingDelete = null">
      <div class="confirm">
        <h3>确认删除</h3>
        <p>删除后不可恢复，确定删除这条记录吗？</p>
        <div class="dialog-actions">
          <button class="btn ghost" type="button" @click="pendingDelete = null">取消</button>
          <button class="btn danger" type="button" @click="remove">删除</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { fetchPage, http, type Row } from '@/api/http';
import type { ColumnDef, FieldDef, Option, ResourceDef } from '@/modules/resources';
import { useToastStore } from '@/stores/user';
import { textOf, toInputDate, toServerDate } from '@/utils/format';

const props = defineProps<{ config: ResourceDef }>();
const toast = useToastStore();

const rows = ref<Row[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const saving = ref(false);
const editing = ref(false);
const viewing = ref<Row | null>(null);
const pendingDelete = ref<Row | null>(null);
const query = reactive<Record<string, string>>({});
const form = reactive<Record<string, string>>({});
const remoteOptions = ref<Record<string, Option[]>>({});
const remoteRows = ref<Record<string, Row[]>>({});

const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));
const canCreate = computed(() => props.config.creatable !== false);
const canEdit = computed(() => props.config.editable !== false);
const canDelete = computed(() => props.config.deletable !== false);
const detailFields = computed(() => {
  const keys = new Set<string>();
  const list: ColumnDef[] = [];
  for (const col of props.config.columns) {
    keys.add(col.key);
    list.push(col);
  }
  for (const field of props.config.fields) {
    if (!keys.has(field.key)) {
      keys.add(field.key);
      list.push({ key: field.key, label: field.label, options: field.options });
    }
  }
  return list;
});

function optionsOf(field: FieldDef) {
  return remoteOptions.value[field.key] || field.options || [];
}

function inputType(field: FieldDef) {
  if (field.type === 'number') return 'number';
  if (field.type === 'date') return 'datetime-local';
  if (field.type === 'password') return 'password';
  return 'text';
}

function show(row: Row, col: ColumnDef) {
  const value = row[col.key];
  const opt = col.options?.find((item) => String(item.value) === String(value));
  if (opt) return opt.label;
  return textOf(value);
}

function isStatus(key: string) {
  return key === 'onlinestatus' || key === 'paystatus';
}

function statusTone(value: unknown) {
  const n = Number(value);
  if (n === 1 || n === 3) return 'ok';
  if (n === 2 || n === 4 || n === 5) return 'bad';
  if (n === 0) return '';
  return 'warn';
}

function blankQuery() {
  for (const key of Object.keys(query)) delete query[key];
  for (const field of props.config.search) query[field.key] = '';
}

async function loadRemote() {
  const fields = [...props.config.fields, ...props.config.search].filter((field) => field.optionsFrom);
  const seen = new Set<string>();
  await Promise.all(
    fields.map(async (field) => {
      const from = field.optionsFrom;
      if (!from || seen.has(field.key)) return;
      seen.add(field.key);
      try {
        const page = await fetchPage(`${from.endpoint}/list`, { pageNo: 1, pageSize: 500 });
        remoteRows.value[field.key] = page.records;
        remoteOptions.value[field.key] = page.records.map((row) => ({
          label: String(row[from.label] ?? row.id ?? ''),
          value: String(row[from.value] ?? ''),
        }));
      } catch {
        remoteOptions.value[field.key] = [];
      }
    }),
  );
}

async function load() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = { pageNo: pageNo.value, pageSize: pageSize.value };
    for (const field of props.config.search) {
      const value = query[field.key];
      if (value !== '' && value != null) params[field.key] = value;
    }
    const page = await fetchPage(`${props.config.endpoint}/list`, params);
    rows.value = page.records;
    total.value = page.total;
  } catch (err) {
    rows.value = [];
    total.value = 0;
    toast.err(err instanceof Error ? err.message : '加载失败');
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNo.value = 1;
  load();
}

function reset() {
  blankQuery();
  search();
}

function toPage(next: number) {
  pageNo.value = next;
  load();
}

function changeSize(event: Event) {
  pageSize.value = Number((event.target as HTMLSelectElement).value);
  pageNo.value = 1;
  load();
}

function fillForm(row?: Row) {
  for (const key of Object.keys(form)) delete form[key];
  form.id = row?.id ? String(row.id) : '';
  for (const field of props.config.fields) {
    const raw = row?.[field.key];
    if (field.type === 'date') form[field.key] = toInputDate(raw);
    else form[field.key] = raw == null ? '' : String(raw);
  }
}

function openCreate() {
  fillForm();
  editing.value = true;
}

async function openEdit(row: Row) {
  fillForm(row);
  editing.value = true;
  try {
    const full = (await http.get(`${props.config.endpoint}/queryById`, { params: { id: row.id } })).data as Row;
    if (full && typeof full === 'object') fillForm({ ...row, ...full });
  } catch {
    /* keep list row */
  }
}

function openView(row: Row) {
  viewing.value = row;
}

function onSelect(field: FieldDef) {
  const from = field.optionsFrom;
  if (!from?.fill || !from.fillFrom) return;
  const picked = remoteRows.value[field.key]?.find((row) => String(row[from.value]) === String(form[field.key]));
  form[from.fill] = picked ? String(picked[from.fillFrom] ?? '') : '';
}

function payload() {
  const body: Record<string, unknown> = {};
  if (form.id) body.id = form.id;
  for (const field of props.config.fields) {
    const value = form[field.key] ?? '';
    if (field.type === 'number') body[field.key] = value === '' ? null : Number(value);
    else if (field.type === 'select' && field.options?.some((opt) => typeof opt.value === 'number')) {
      body[field.key] = value === '' ? null : Number(value);
    } else if (field.type === 'date') body[field.key] = value ? toServerDate(value) : '';
    else body[field.key] = value;
  }
  for (const field of props.config.fields) {
    if (field.optionsFrom?.fill && form[field.optionsFrom.fill]) {
      body[field.optionsFrom.fill] = form[field.optionsFrom.fill];
    }
  }
  return body;
}

async function save() {
  for (const field of props.config.fields) {
    if (field.required && !String(form[field.key] || '').trim()) {
      toast.err(`请填写${field.label}`);
      return;
    }
  }
  saving.value = true;
  try {
    const action = form.id ? 'edit' : 'add';
    await http.post(`${props.config.endpoint}/${action}`, payload());
    toast.ok(form.id ? '已保存' : '已创建');
    editing.value = false;
    await load();
  } catch (err) {
    toast.err(err instanceof Error ? err.message : '保存失败');
  } finally {
    saving.value = false;
  }
}

function askDelete(row: Row) {
  pendingDelete.value = row;
}

async function remove() {
  const row = pendingDelete.value;
  if (!row) return;
  try {
    await http.delete(`${props.config.endpoint}/delete`, { params: { id: row.id } });
    toast.ok('已删除');
    pendingDelete.value = null;
    await load();
  } catch (err) {
    toast.err(err instanceof Error ? err.message : '删除失败');
  }
}

async function copyRow(row: Row) {
  try {
    await http.get(`${props.config.endpoint}/copy`, { params: { id: row.id } });
    toast.ok('已复制计划');
    await load();
  } catch (err) {
    toast.err(err instanceof Error ? err.message : '复制失败');
  }
}

watch(
  () => props.config.key,
  () => {
    blankQuery();
    pageNo.value = 1;
    load();
    loadRemote();
  },
);

onMounted(() => {
  blankQuery();
  load();
  loadRemote();
});
</script>

<style scoped>
.page-head, .table-card { margin-bottom: 14px; }
.page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; }
h1 { margin: 0; font-size: 22px; font-weight: 650; }
.page-head p { margin: 6px 0 0; color: var(--muted); font-size: 13px; }
.filters { padding: 16px; margin-bottom: 14px; }
.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.filter-grid label span { display: block; margin-bottom: 6px; color: #8a7d81; font-size: 12px; }
.filter-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
.table-card { padding: 8px 8px 12px; overflow: hidden; }
.table-scroll { overflow: auto; }
.ops { white-space: nowrap; }
.ops .btn { margin-right: 10px; }
.danger-link { color: #d23b45; }
.detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 18px;
}
.detail span { display: block; color: #8d8084; font-size: 12px; margin-bottom: 4px; }
.detail b { font-weight: 550; word-break: break-all; }
@media (max-width: 1100px) {
  .filter-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 720px) {
  .filter-grid, .detail { grid-template-columns: 1fr; }
}
</style>
