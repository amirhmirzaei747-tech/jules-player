import Vue from 'vue'
import type { RouteConfig } from "vue-router";
import VueRouter from "vue-router";
import Watch from "@/views/watch/watch.vue";

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
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

const router = new VueRouter({
  mode: 'history',
  base: '/watch',
  routes
})

router.afterEach((to, from) => {
  Vue.nextTick(() => {
    document.title = to?.meta?.title || 'پلیر پرده آبی'
  })
})

export default router
