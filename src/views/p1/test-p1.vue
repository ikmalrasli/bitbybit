<template>
  <div class="p-4 border">
    <p class="p-4 text-black flex-nowrap">this is a test page 1</p>

    <VerticalProgressbar
    :percent="78"
    color="bg-violet-400" />
  </div>
</template>

<script>
import VerticalProgressbar from '../../components/VerticalProgressbar.vue';
export default {
  components: {
    VerticalProgressbar
  }
}
</script>

<style>

</style>