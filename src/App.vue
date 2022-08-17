<template>
  <div id="app">
    <v-app dark>
      <router-view></router-view>
    </v-app>
  </div>
</template>

<script>
import LogsTroubleShooting from './components/LogsTroubleShooting'
import GraphCompare from './components/LogsTroubleShooting'
import Home from './components/Home'

export default {
  name: 'App',
  components: {
    LogsTroubleShooting,
    GraphCompare,
    Home
  }
}
</script>

