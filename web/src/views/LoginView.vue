<template>
  <div class="login-page">
    <div class="panel">
      <section class="brand">
        <div class="brand-copy">
          <p class="kicker">学习强国【强国运动】</p>
          <h1>广告投放管理后台</h1>
          <i class="bar"></i>
        </div>
      </section>
      <section class="form-side">
        <form @submit.prevent="submit">
          <h2>登录到您的账户</h2>
          <p class="desc">强国运动 · 广告投放管理后台</p>

          <label class="line">
            <input v-model.trim="form.username" autocomplete="username" placeholder="请输入账号" />
          </label>
          <label class="line">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="请输入密码"
            />
            <button type="button" class="eye" @click="showPassword = !showPassword" :aria-label="showPassword ? '隐藏密码' : '显示密码'">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
                />
                <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6" />
                <path v-if="showPassword" d="M4 20 L20 4" stroke="currentColor" stroke-width="1.6" />
              </svg>
            </button>
          </label>
          <label class="line captcha">
            <input v-model.trim="form.captcha" placeholder="请输入验证码" maxlength="6" />
            <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" @click="loadCaptcha" />
            <button v-else type="button" class="refresh" @click="loadCaptcha">换一张</button>
          </label>

          <p v-if="error" class="error">{{ error }}</p>
          <button class="submit" type="submit" :disabled="loading">{{ loading ? '登录中…' : '登录' }}</button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { http } from '@/api/http';
import { useToastStore, useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const user = useUserStore();
const toast = useToastStore();

const form = reactive({ username: '', password: '', captcha: '' });
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');
const captchaUrl = ref('');
const checkKey = ref('');

async function loadCaptcha() {
  checkKey.value = String(Date.now());
  try {
    const result = (await http.get(`/sys/randomImage/${checkKey.value}`)).data;
    captchaUrl.value = typeof result === 'string' ? result : '';
  } catch (err) {
    captchaUrl.value = '';
    error.value = err instanceof Error ? err.message : '验证码获取失败';
  }
}

async function submit() {
  error.value = '';
  if (!form.username || !form.password || !form.captcha) {
    error.value = '请完整填写账号、密码和验证码';
    return;
  }
  loading.value = true;
  try {
    await user.login({
      username: form.username,
      password: form.password,
      captcha: form.captcha,
      checkKey: checkKey.value,
    });
    toast.ok('登录成功');
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.replace(redirect || '/');
  } catch (err) {
    error.value = err instanceof Error ? err.message : '登录失败';
    form.captcha = '';
    await loadCaptcha();
  } finally {
    loading.value = false;
  }
}

onMounted(loadCaptcha);
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 20px;
  background: #f8dfe4;
  background-image: radial-gradient(circle at 20% 10%, #fff 0, transparent 36%),
    radial-gradient(circle at 80% 90%, #f3c9d1 0, transparent 32%);
}
.panel {
  width: min(1080px, 100%);
  min-height: 640px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  background: #fff;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 30px 70px rgba(173, 16, 43, 0.08);
}
.brand {
  background: #fff7f8;
  display: flex;
  align-items: center;
  padding: 48px 8% 72px;
}
.kicker {
  margin: 0 0 18px;
  color: #ad102b;
  font-size: 21px;
  font-weight: 500;
}
h1 {
  margin: 0;
  color: #32272b;
  font-size: 46px;
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.bar {
  display: block;
  width: 42px;
  height: 4px;
  margin-top: 22px;
  border-radius: 4px;
  background: #df0024;
}
.form-side {
  display: flex;
  align-items: center;
  padding: 48px 11% 48px 9%;
  background: #fff;
}
form { width: 100%; }
h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 650;
  color: #3d3d3d;
}
.desc {
  margin: 8px 0 54px;
  color: #85777c;
  font-size: 14px;
}
.line {
  position: relative;
  display: block;
  margin-bottom: 26px;
}
.line input {
  width: 100%;
  height: 40px;
  border: 0;
  border-bottom: 1px solid #f0f0f0;
  outline: none;
  background: transparent;
  color: #32272b;
  font-size: 14px;
}
.line input::placeholder { color: #a7a5a6; }
.line input:focus { border-bottom-color: #ad102b; }
.eye, .refresh {
  position: absolute;
  right: 0;
  top: 8px;
  border: 0;
  background: transparent;
  color: #b0a4a7;
  padding: 0;
}
.captcha img {
  position: absolute;
  right: 0;
  top: 4px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
}
.submit {
  margin-top: 28px;
  width: 248px;
  height: 44px;
  border: 0;
  border-radius: 8px;
  color: #fff;
  font-size: 15px;
  background: linear-gradient(90deg, #db0225, #c51432);
}
.submit:disabled { opacity: 0.7; }
.error {
  margin: -8px 0 0;
  color: #c51432;
  font-size: 13px;
}
@media (max-width: 860px) {
  .panel { grid-template-columns: 1fr; min-height: auto; }
  .brand { min-height: 240px; padding: 40px 28px; }
  h1 { font-size: 34px; }
  .form-side { padding: 28px; }
  .desc { margin-bottom: 28px; }
  .submit { width: 100%; }
}
</style>
