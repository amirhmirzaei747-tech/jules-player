<template src="./no-internet.html"></template>
<style lang="scss" src="./no-internet.scss" scoped></style>

<script lang="ts">
import { defineComponent } from "vue";
import IconNoInternet from "@/components/no-internet/IconNoInternet.vue";

export default defineComponent({
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
