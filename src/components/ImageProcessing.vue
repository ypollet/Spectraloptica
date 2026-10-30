<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { PhSpinnerGap } from '@phosphor-icons/vue'
import { Button } from 'optica-core/ui/button'
import { Label } from 'optica-core/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'optica-core/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'optica-core/ui/tabs'
import { OPERATIONS } from '@/data/repositories/spectral_repository'
import { getRepository } from '@/data/setup'
import { CHANNELS } from '@/data/models/spectral'
import { useImagesStore } from '@/lib/stores'

const MODES = [
  { value: "operation", label: "Operation" },
  { value: "false-color", label: "False color" },
]
const MODE_TRIGGER = "h-auto flex-none -mb-px rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-1.5 "
  + "text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent "
  + "data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-foreground "
  + "dark:data-[state=active]:bg-transparent"

const repository = getRepository()
const imagesStore = useImagesStore()
const { acquisition } = storeToRefs(imagesStore)

// images on disk that can be used as inputs (the computed results are listed by ProcessingResults)
const sources = computed(() => acquisition.value?.sources ?? [])
// inputs and progress of the shown view
const processing = computed(() => acquisition.value?.processing)
</script>

<template>
  <div class="flex flex-col space-y-3 items-center">

    <p v-if="!repository.supportsProcessing" class="text-sm text-muted-foreground text-center">
      Operations and false colors are not available with this backend.
    </p>

    <template v-else-if="processing">
      <Tabs v-model="processing.mode" class="w-9/10">
        <!-- underlined, not the boxes of the sidebar tabs: a choice inside the processing tab -->
        <TabsList class="flex h-auto w-full justify-start gap-4 rounded-none border-b bg-transparent p-0">
          <TabsTrigger v-for="item in MODES" :key="item.value" :value="item.value" :class="MODE_TRIGGER">{{ item.label }}</TabsTrigger>
        </TabsList>

        <TabsContent value="operation" class="space-y-3">
          <div class="space-y-1">
            <Label>Operation</Label>
            <Select v-model="processing.operation">
              <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="op in OPERATIONS" :key="op.value" :value="op.value">{{ op.label }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1 min-w-0">
              <Label>Image A</Label>
              <Select v-model="processing.left">
                <SelectTrigger class="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="image in sources" :key="image.name" :value="image.name">{{ image.label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1 min-w-0">
              <Label>Image B</Label>
              <Select v-model="processing.right">
                <SelectTrigger class="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="image in sources" :key="image.name" :value="image.name">{{ image.label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="false-color" class="space-y-2">
          <div v-for="channel in CHANNELS" :key="channel.key" class="flex items-center gap-2">
            <span class="h-3 w-3 flex-none rounded-full" :style="{ backgroundColor: channel.color }"></span>
            <Label class="w-12 flex-none">{{ channel.label }}</Label>
            <Select v-model="processing.channels[channel.key]">
              <SelectTrigger class="w-full min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="image in sources" :key="image.name" :value="image.name">{{ image.label }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>

      <Button :disabled="!processing.canCompute" @click="imagesStore.compute()">
        <PhSpinnerGap v-if="processing.loading" class="mr-2 h-4 w-4 animate-spin" />
        {{ processing.loading ? "Computing…" : "Compute" }}
      </Button>

      <p v-if="processing.error" class="text-sm text-red-600">{{ processing.error }}</p>
    </template>
  </div>
</template>
