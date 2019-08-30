import Vue from 'vue'
import App from './App'
import store from './store/'
import router from './router'
import vuetify from './plugins/vuetify'

Vue.config.productionTip = false

router.beforeEach((to, from, next) => {
  if ((to.name !== 'login' && to.name !== 'error') && !store.state.accountStore.accounts) {
    next({
      name: 'login'
    })
  } else {
    next()
  }
})

new Vue({
  store,
  el: '#app',
  vuetify,
  router,
  render: h => h(App)
}).$mount('#app')
