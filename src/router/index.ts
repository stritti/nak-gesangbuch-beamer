import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../pages/DashboardPage.vue')
    },
    {
      path: '/library',
      redirect: '/'
    },
    {
      path: '/setlist',
      redirect: '/'
    },
    {
      path: '/control',
      redirect: '/'
    },
    {
      path: '/projector',
      name: 'projector',
      component: () => import('../pages/ProjectorPage.vue')
    }
  ]
});

export default router;
