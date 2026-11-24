<template>
  <div class="shell">
    <aside class="sider" :class="{ open: menuOpen }">
      <div class="brand">
        <img :src="logoUrl" alt="学习强国 强国运动" />
        <span>广告投放管理后台</span>
      </div>
      <nav>
        <section v-for="group in groups" :key="group.label">
          <button class="group" type="button" @click="group.open = !group.open">
            <span class="g-icon" v-html="group.icon"></span>
            {{ group.label }}
            <i :class="{ fold: !group.open }"></i>
          </button>
          <div v-show="group.open" class="items">
            <router-link
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              :class="{ active: route.path === item.to }"
              @click="menuOpen = false"
            >
              {{ item.label }}
            </router-link>
          </div>
        </section>
      </nav>
      <footer class="service">
        <span class="dot"></span>
        <div>
          <b>数据服务正常</b>
          <small>最近同步 {{ syncedAt }}</small>
          <small>v1.0.0</small>
        </div>
      </footer>
    </aside>
    <div v-if="menuOpen" class="backdrop" @click="menuOpen = false"></div>

    <div class="main">
      <header class="top">
        <button class="burger" type="button" @click="menuOpen = !menuOpen" aria-label="打开菜单">☰</button>
        <div class="crumb">{{ groupName }} / {{ title }}</div>
        <div class="search">
          <svg viewBox="0 0 24 24" width="16" height="16"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.7"/></svg>
          <input
            v-model.trim="keyword"
            placeholder="搜索页面、计划 ID、广告主"
            @focus="searchOpen = true"
            @keydown.enter="searchNow"
          />
          <kbd>Ctrl K</kbd>
          <div v-if="searchOpen && keyword" class="suggest">
            <button v-for="item in hits" :key="item.to" type="button" @click="go(item.to)">{{ item.group }} / {{ item.label }}</button>
            <button type="button" @click="searchNow">在投放数据中搜索「{{ keyword }}」</button>
          </div>
        </div>
        <router-link class="bell" to="/callback" title="回调日志">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2H4.5L6 16z"/><path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
          <em v-if="badge">{{ badge }}</em>
        </router-link>
        <div class="user" @click="userOpen = !userOpen">
          <img v-if="user.profile.avatar" :src="avatarUrl" alt="" />
          <span v-else class="avatar">{{ user.initial }}</span>
          <div>
            <b>{{ user.displayName }}</b>
            <small>{{ user.profile.role || '投放管理员' }}</small>
          </div>
          <div v-if="userOpen" class="menu">
            <button type="button" @click.stop="exit">退出登录</button>
          </div>
        </div>
      </header>
      <main>
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { fetchPage } from '@/api/http';
import { resources } from '@/modules/resources';
import { useUserStore } from '@/stores/user';
import logoUrl from '@/assets/logo.png';

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const menuOpen = ref(false);
const userOpen = ref(false);
const searchOpen = ref(false);
const keyword = ref('');
const badge = ref('');
const syncedAt = ref(dayjs().format('HH:mm'));

const homeIcon = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.7" d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z"/></svg>';
const promoIcon = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="1.7" d="M4 10v4h3l6 4V6L7 10H4z"/><path fill="none" stroke="currentColor" stroke-width="1.7" d="M16 9.5a3 3 0 0 1 0 5"/></svg>';

const groups = reactive([
  {
    label: '首页',
    icon: homeIcon,
    open: true,
    items: [
      { label: '概览', to: '/' },
      { label: '投放数据', to: '/delivery' },
    ],
  },
  {
    label: '推广',
    icon: promoIcon,
    open: true,
    items: resources.map((item) => ({ label: item.title, to: `/${item.key}` })),
  },
]);

const pages = computed(() => [
  { label: '概览', to: '/', group: '首页' },
  { label: '投放数据', to: '/delivery', group: '首页' },
  ...resources.map((item) => ({ label: item.title, to: `/${item.key}`, group: item.group })),
]);

const title = computed(() => String(route.meta.title || '概览'));
const groupName = computed(() => String(route.meta.group || '首页'));
const hits = computed(() => pages.value.filter((item) => item.label.includes(keyword.value)).slice(0, 6));
const avatarUrl = computed(() => {
  const avatar = user.profile.avatar;
  if (!avatar) return '';
  if (avatar.startsWith('http') || avatar.startsWith('data:')) return avatar;
  return `${import.meta.env.VITE_API_BASE || ''}/${avatar.replace(/^\//, '')}`;
});

function go(path: string) {
  searchOpen.value = false;
  keyword.value = '';
  router.push(path);
}

function searchNow() {
  const q = keyword.value;
  searchOpen.value = false;
  keyword.value = '';
  if (!q) return;
  const exact = pages.value.find((item) => item.label === q);
  if (exact) {
    router.push(exact.to);
    return;
  }
  router.push({ path: '/delivery', query: { q } });
}

async function exit() {
  userOpen.value = false;
  await user.logout();
  router.replace('/login');
}

function onKey(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchOpen.value = true;
    const input = document.querySelector<HTMLInputElement>('.search input');
    input?.focus();
  }
  if (event.key === 'Escape') searchOpen.value = false;
}

function onPointer(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.search')) searchOpen.value = false;
  if (!target.closest('.user')) userOpen.value = false;
}

onMounted(async () => {
  window.addEventListener('keydown', onKey);
  window.addEventListener('click', onPointer);
  try {
    const page = await fetchPage('/preinstall/cTCallback/list', {
      pageNo: 1,
      pageSize: 1,
      createTime_begin: dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    });
    if (page.total > 0) badge.value = page.total > 99 ? '99+' : String(page.total);
    syncedAt.value = dayjs().format('HH:mm');
  } catch {
    syncedAt.value = dayjs().format('HH:mm');
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('click', onPointer);
});
</script>

<style scoped>
.shell { min-height: 100vh; display: flex; background: #f6f1f2; }
.sider {
  width: var(--sidebar);
  flex: none;
  background: #fbf7f7;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: sticky;
  top: 0;
  height: 100vh;
}
.brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 22px 18px 16px;
}
.brand img {
  display: block;
  width: 168px;
  height: auto;
}
.brand span {
  display: block;
  color: #8d8084;
  font-size: 13px;
  line-height: 1.4;
}
nav { flex: 1; overflow: auto; padding: 6px 12px 12px; }
.group {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  border: 0;
  background: transparent;
  color: #5e5357;
  font-size: 14px;
  padding: 0 8px;
}
.g-icon { display: grid; place-items: center; color: #8a7c80; }
.group i {
  margin-left: auto;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #b3a6aa;
}
.group i.fold { transform: rotate(-90deg); }
.items a {
  display: block;
  margin: 2px 0 2px 18px;
  padding: 9px 12px;
  border-radius: 8px;
  color: #5c5256;
  font-size: 14px;
}
.items a.active {
  background: #fff;
  color: #c51432;
  font-weight: 600;
  box-shadow: inset 3px 0 0 #df0024;
}
.service {
  display: flex;
  gap: 8px;
  padding: 16px 18px 20px;
  color: #7d7175;
  font-size: 12px;
}
.service b { display: block; color: #3f8f5a; font-weight: 600; }
.service small { display: block; margin-top: 2px; }
.dot {
  width: 8px;
  height: 8px;
  margin-top: 4px;
  border-radius: 50%;
  background: #2f9d57;
  box-shadow: 0 0 0 4px rgba(47, 157, 87, 0.12);
}
.main { flex: 1; min-width: 0; }
.top {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 22px;
  background: rgba(246, 241, 242, 0.92);
  position: sticky;
  top: 0;
  z-index: 5;
}
.crumb { color: #8d8084; font-size: 13px; white-space: nowrap; }
.burger { display: none; border: 0; background: transparent; font-size: 18px; }
.search { position: relative; margin-left: auto; width: min(360px, 42vw); }
.search input {
  width: 100%;
  height: 36px;
  border: 0;
  border-radius: 18px;
  background: #fff;
  padding: 0 64px 0 34px;
  outline: none;
  color: var(--ink);
}
.search svg { position: absolute; left: 12px; top: 10px; color: #b0a4a7; }
.search kbd {
  position: absolute;
  right: 10px;
  top: 8px;
  font-size: 11px;
  color: #b0a4a7;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 1px 4px;
}
.suggest {
  position: absolute;
  top: 42px;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 6px;
  z-index: 8;
}
.suggest button {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  padding: 8px 10px;
  border-radius: 8px;
  color: #4d4346;
}
.suggest button:hover { background: #fff6f7; }
.bell {
  position: relative;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: #6d6165;
}
.bell em {
  position: absolute;
  top: 2px;
  right: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #df0024;
  color: #fff;
  font-style: normal;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
}
.user { position: relative; display: flex; align-items: center; gap: 8px; cursor: pointer; }
.user b { display: block; font-size: 13px; font-weight: 600; }
.user small { color: #9a8c90; font-size: 12px; }
.avatar, .user img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}
.avatar {
  display: grid;
  place-items: center;
  background: #e7d2d6;
  color: #8d3040;
  font-weight: 700;
}
.menu {
  position: absolute;
  right: 0;
  top: 44px;
  background: #fff;
  border-radius: 10px;
  box-shadow: var(--shadow);
  padding: 6px;
  min-width: 120px;
}
.menu button {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 8px 10px;
  border-radius: 8px;
}
.menu button:hover { background: #fff4f5; }
main { padding: 6px 22px 28px; }
.backdrop { display: none; }
@media (max-width: 960px) {
  .sider {
    position: fixed;
    z-index: 20;
    transform: translateX(-105%);
    transition: transform 0.2s ease;
    box-shadow: var(--shadow);
  }
  .sider.open { transform: none; }
  .backdrop { display: block; position: fixed; inset: 0; background: rgba(40, 20, 24, 0.25); z-index: 15; }
  .burger { display: block; }
  .search kbd { display: none; }
  .user small, .user b { display: none; }
  main, .top { padding-left: 14px; padding-right: 14px; }
}
</style>
