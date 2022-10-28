// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'

import service from '@/plugins/http'
import urls from '@/plugins/urls'
import common from '@/plugins/common'

import LogicView from './components/LogicView.vue'
import CompareView from './components/CompareView.vue'
import Home from './components/Home.vue'
import KnowledgeNetworkEditView from './components/KnowledgeNetworkEdit.vue'

Vue.config.productionTip = false

Vue.prototype.$http = service
Vue.prototype.$urls = urls
Vue.prototype.$common = common

import VueRouter from 'vue-router'
const router = new VueRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/logicview', component: LogicView },
    { path: '/compareview', component: CompareView },
    { path: '/knowledgenetworkedit', component: KnowledgeNetworkEditView },
  ]
});
Vue.use(VueRouter)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
