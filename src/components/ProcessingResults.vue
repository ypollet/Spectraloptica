<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { PhSpinnerGap, PhX } from '@phosphor-icons/vue'
import { Button } from 'optica-core/ui/button'
import { Label } from 'optica-core/ui/label'
import { useImagesStore } from '@/lib/stores'

const imagesStore = useImagesStore()
const { acquisition } = storeToRefs(imagesStore)

// images computed by ImageProcessing in the shown view
const results = computed(() => acquisition.value?.computedImages ?? [])
</script>

<template>
  <div v-if="acquisition && results.length > 0" class="space-y-1 px-3 py-2">
    <Label>Processed Images</Label>
    <ul class="space-y-1">
      <li v-for="image in results" :key="image.name"
        class="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-sm cursor-pointer hover:bg-accent"
        :class="{ 'bg-accent font-medium': acquisition.standalone == image.name }"
        @click="acquisition.selectStandalone(image.name)">
        <span class="truncate" :title="image.label">{{ image.label }}</span>
        <PhSpinnerGap v-if="acquisition.processing.pendingFull.includes(image.name)" class="ml-auto h-4 w-4 flex-none animate-spin opacity-60" />
        <Button variant="ghost" size="icon" class="h-6 w-6 flex-none" title="Remove"
          @click.stop="imagesStore.removeComputedImage(image.name)">
          <PhX class="h-4 w-4" />
        </Button>
      </li>
    </ul>
  </div>
</template>
