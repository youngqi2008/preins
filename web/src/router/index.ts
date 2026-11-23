import { createRouter, createWebHistory } from 'vue-router';
import { getToken } from '@/api/http';
import { resources } from '@/modules/resources';

const resourceRoutes = resources.map((item) => ({
  path: `/${item.key}`,
  name: item.key,
  component: () => import('@/views/ResourceView.vue'),
  meta: { title: item.title, group: item.group, resource: item.key },
}));

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true, title: '登录' },
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        {
          path: '',
          name: 'overview',
          component: () => import('@/views/OverviewView.vue'),
          meta: { title: '概览', group: '首页' },
        },
        {
          path: 'delivery',
          name: 'delivery',
          component: () => import('@/views/DeliveryView.vue'),
          meta: { title: '投放数据', group: '首页' },
        },
        ...resourceRoutes,
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  const token = getToken();
  if (to.meta.public) {
    if (token && to.path === '/login') return { path: '/' };
    return true;
  }
  if (!token) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  return true;
});

export default router;
