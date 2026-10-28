<script setup lang="ts">
import { useImagesStore } from './lib/stores'
import ViewerView from './views/ViewerView.vue'

const imageStore = useImagesStore()

function changePicture(event: KeyboardEvent) {
  const key = event.key
  if (key == "ArrowUp" || key == "ArrowRight") {
    imageStore.increment()
  }
  if (key == "ArrowDown" || key == "ArrowLeft") {
    imageStore.decrement()
  }
}
</script>

<template>
  <div class="overflow-hidden"><ViewerView @keydown="changePicture" /></div>
</template>
