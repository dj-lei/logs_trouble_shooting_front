<template lang="pug">
    div(id="screen")
</template>

<script>
import {KnowledgeNetworkEditView} from '../js/KnowledgeNetworkEditView.js'

export default {
  data () {
    return {
    }
  },
  mounted () {
    const test = new KnowledgeNetworkEditView()
    test.init(test)
  }
}
</script>