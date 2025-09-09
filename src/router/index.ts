import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../pages/HomePage.vue')
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('../pages/LibraryPage.vue')
    },
    {
      path: '/setlist',
      name: 'setlist',
      component: () => import('../pages/SetlistPage.vue')
    },
    {
      path: '/control',
      name: 'control',
      component: () => import('../pages/ControlPage.vue')
    },
    {
      path: '/projector',
      name: 'projector',
      component: () => import('../pages/ProjectorPage.vue')
    }
  ]
});

export default router;
