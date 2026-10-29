<script setup lang="ts">
import { Credits } from 'optica-core/ui/credits'
import { credits } from '@/config/credits'
import { MainLogo } from '../logo'
</script>

<template>
  <Credits v-bind="credits">
    <template #header>
      <div class="flex flex-col items-center">
        <MainLogo :height="72" :width="72" class="shrink-0" />
        <div class="flex flex-col items-center">
          <h1 class="font-dejavu font-bold text-brand text-4xl leading-none">Spectraloptica</h1>
          <p class="mt-1 text-sm text-muted-foreground">Multispectral image viewer</p>
        </div>
      </div>
    </template>
  </Credits>
</template>
