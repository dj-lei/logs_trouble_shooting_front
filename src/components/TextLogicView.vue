<template lang="pug">
    div(id="screen")
</template>

<script>
import {TextLogicView} from '../js/TextLogic.js'

export default {
  data () {
    return {
    }
  },
  mounted () {
    const test = new TextLogicView()
    test.init()
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}

html,body {
  font-family: Arial;
  height: 100%;
  background: #000;
  margin: 0px 0px 0px 0px;
  overflow: hidden !important;
}
</style>