import { defineStore } from 'pinia';
import { getToken, http, setToken, type Row } from '@/api/http';

export interface UserProfile {
  username: string;
  realname: string;
  avatar: string;
  role: string;
}

function readProfile(): UserProfile {
  try {
    const raw = localStorage.getItem('XXQG_USER');
    if (raw) return JSON.parse(raw) as UserProfile;
  } catch {
    /* ignore broken cache */
  }
  return { username: '', realname: '', avatar: '', role: '投放管理员' };
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    profile: readProfile(),
  }),
  getters: {
    displayName: (state) => state.profile.realname || state.profile.username || '投放管理员',
    initial: (state) => {
      const name = state.profile.realname || state.profile.username || '强';
      return name.slice(0, 1);
    },
  },
  actions: {
    async login(payload: { username: string; password: string; captcha: string; checkKey: string }) {
      const result = (await http.post('/sys/login', payload)).data as Row;
      const token = String(result?.token || '');
      if (!token) throw new Error('登录成功但未返回令牌');
      const info = (result.userInfo || {}) as Row;
      const profile: UserProfile = {
        username: String(info.username || payload.username),
        realname: String(info.realname || info.username || payload.username),
        avatar: String(info.avatar || ''),
        role: String(info.orgCodeTxt || info.post || '投放管理员'),
      };
      this.token = token;
      this.profile = profile;
      setToken(token);
      localStorage.setItem('XXQG_USER', JSON.stringify(profile));
    },
    async logout() {
      try {
        if (this.token) await http.get('/sys/logout');
      } catch {
        /* token may already be expired */
      }
      this.token = '';
      this.profile = { username: '', realname: '', avatar: '', role: '投放管理员' };
      setToken('');
      localStorage.removeItem('XXQG_USER');
    },
  },
});

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: [] as { id: number; type: 'ok' | 'err'; text: string }[],
  }),
  actions: {
    push(type: 'ok' | 'err', text: string) {
      const id = Date.now() + Math.random();
      this.items.push({ id, type, text });
      window.setTimeout(() => {
        this.items = this.items.filter((item) => item.id !== id);
      }, 3200);
    },
    ok(text: string) {
      this.push('ok', text);
    },
    err(text: string) {
      this.push('err', text);
    },
  },
});
