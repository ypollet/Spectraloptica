<script setup lang="ts">
import { usePersistedAnnotations } from 'optica-core'
import { Separator } from 'optica-core/ui/separator'
import { MainLogo } from '@/components/logo'
import Sidebar from '@/components/Sidebar.vue'
import SpectralMenu from '@/components/SpectralMenu.vue'
import SpectralViewer from '@/components/SpectralViewer.vue'
import { useImagesStore, useSettingsStore } from '@/lib/stores'

const settingsStore = useSettingsStore()
const imageStore = useImagesStore()

const urlParams = new URLSearchParams(window.location.search)
imageStore.setPath(urlParams.get('series') as string)

// the annotations survive a reload (sessionStorage, by series)
usePersistedAnnotations(() => imageStore.project)
</script>

<template>
  <main class="h-screen">
    <div class="flex menu">
      <SpectralMenu class="sticky top-0 flex flex-row grow z-50" />
      <div class="flex items-center space-x-2 pr-2">
        <MainLogo :height=30 :width=30 />
        <h1 class="font-dejavu font-bold text-brand">Spectraloptica</h1>
      </div>
    </div>
    <Separator />
    <div class="rest_height flex" :class="settingsStore.isLeft ? 'flex-row' : 'flex-row-reverse'">
      <div class="h-full w-[25%] flex-none overflow-auto border p-4">
        <Sidebar />
      </div>
      <div class="h-full w-0 flex-auto items-center justify-center">
        <SpectralViewer />
      </div>
    </div>
  </main>
</template>

<style scoped>
.menu {
  height: 40px;
}

.rest_height {
  height: calc(100% - 41px);
}
</style>
