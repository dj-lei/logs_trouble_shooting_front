<template>
  <div id="app" class="full-height">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
    name: "App",
}
</script>

<style>
* {
  box-sizing: border-box;
}

html,body {
  font-family: Arial;
  height: 100%;
  background: #555;
  margin: 0px 0px 0px 0px;
}

.full-height {
  height: 100%;
}
</style>
