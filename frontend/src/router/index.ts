import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/forest',
      name: 'forest',
      component: () => import('../views/ForestViewPage.vue'),
    },
  ],
})

export default router
