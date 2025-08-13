<template src="./error.html"></template>
<style lang="scss" src="./error.scss" scoped></style>

<script lang="ts">
import { defineComponent } from "vue";
import IconBack from "@/components/icons/IconBack.vue";

export default defineComponent({
  name: "error",
  components: {IconBack},
  props: {
    errorMessage: {
      type: String,
      default: "مشکلی پیش آمده است، دقایقی دیگر دوباره تلاش کنید.",
    },
    errorStatus: {
      type: Number,
      default: 500,
    },
  },
  methods: {
    backButton(){
      window.history.back()
    }
  }
})
</script>
