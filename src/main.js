// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'

import service from '@/plugins/http'
import urls from '@/plugins/urls'
import common from '@/plugins/common'

import LogsTroubleShooting from './components/LogsTroubleShooting.vue'
import GraphCompare from './components/GraphCompare.vue'
import Home from './components/Home.vue'

Vue.config.productionTip = false

Vue.prototype.$http = service
Vue.prototype.$urls = urls
Vue.prototype.$common = common

import VueRouter from 'vue-router'
const router = new VueRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/logs', component: LogsTroubleShooting },
    { path: '/graphCompare', component: GraphCompare },
  ]
});
Vue.use(VueRouter)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
