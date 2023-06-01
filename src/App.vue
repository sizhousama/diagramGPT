<script setup lang="ts">
import TextToChart from './components/TextToChart.vue'
</script>

<template>
  <TextToChart />
  
  
</template>

<style scoped>
.drawer-handle {
  position: absolute;
  top: 20px;
  right: -40px; /* 拉手/按钮的位置 */
  width: 40px;
  height: 40px;
  background-color: #ccc;
  cursor: pointer;
}
</style>
