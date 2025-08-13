import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Watch from '@/views/watch/watch.vue'
import { nextTick } from 'vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'watch',
    component: Watch
  },
  {
    path: '/live',
    name: 'live',
    component: Watch
  },
  {
    path: '/:id',
    name: 'watchParams',
    component: Watch
  },
]

const router = createRouter({
  history: createWebHistory('/watch'),
  routes
})

router.afterEach((to, from) => {
  nextTick(() => {
    document.title = (to?.meta?.title as string) || 'پلیر پرده آبی'
  })
})

export default router
