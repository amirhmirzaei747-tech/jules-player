<template src="./no-internet.html"></template>
<style lang="scss" src="./no-internet.scss" scoped></style>

<script lang="ts">
import Vue from "vue";
import IconNoInternet from "@/components/no-internet/IconNoInternet.vue";

export default Vue.extend({
  name: "no-internet",
  components: {IconNoInternet},
  data() {
    return {
      isOnline: true as boolean
    }
  },
  mounted() {
    window.addEventListener('offline', () => {
      this.isOnline = false
    });
    window.addEventListener('online', () => {
      this.isOnline = true
    });
  },
  watch: {
    // isOnline: {
    //   immediate: true,
    //   handler(to, from) {
    //     this.isOnline
    //   }
    // },
  },
  props: {},
})
</script>
