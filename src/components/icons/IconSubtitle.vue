<template>
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" :fill="fill">
    <path
        d="M27.6 18.824v-2.979H12.775v2.979h14.823zm0 5.888v-2.979h-5.958v2.979H27.6zm-8.867 0v-2.979H3.909v2.979h14.824zM3.909 15.845v2.979h5.957v-2.979H3.91zM27.6 4c.786 0 1.467.3 2.044.9.577.6.866 1.294.866 2.079v17.733c0 .785-.289 1.477-.866 2.078-.577.6-1.258.9-2.044.9H3.91c-.785 0-1.466-.3-2.043-.9-.577-.6-.866-1.293-.866-2.078V6.979c0-.785.289-1.478.866-2.078C2.443 4.3 3.124 4 3.909 4H27.6z"
        :fill="fill" fill-rule="evenodd"></path>
  </svg>
</template>

<script>
export default {
  name: "IconSubtitle",
  props: {
    fill: {
      default: '#FFF',
      type: String
    }
  }
}
</script>

<style scoped>

</style>
