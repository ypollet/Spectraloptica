<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { vectorToString } from '@optica/core'
import { AnnotationTabs } from '@optica/core/ui/annotation-tabs'
import { DistanceList } from '@optica/core/ui/distance'
import { Label } from '@optica/core/ui/label'
import { LandmarkList } from '@optica/core/ui/landmark'
import { Separator } from '@optica/core/ui/separator'
import { Slider } from '@optica/core/ui/slider'
import { ImageOverview } from '@optica/core/ui/image-overview'
import { ToggleImage } from '@optica/core/ui/toggle-image'
import ImageProcessing from '@/components/ImageProcessing.vue'
import { useImagesStore } from '@/lib/stores'
import { filterToString, wavelengthToString } from '@/lib/wavelength'

const imagesStore = useImagesStore()
const { project, acquisition, annotations, selectedImage } = storeToRefs(imagesStore)

const SERIES = "wavelength"

const views = computed(() => (project.value?.acquisitions ?? []).map((item) => ({ value: String(item.id), label: item.label })))

// the wavelength series or one of the images on their own (the computed ones are listed by ImageProcessing)
const images = computed(() => [
  ...(acquisition.value?.hasGroup ? [{ value: SERIES, label: "Wavelength" }] : []),
  ...(acquisition.value?.standaloneImages ?? []).map((image) => ({ value: image.name, label: image.label })),
])

const gradient = computed(() => acquisition.value?.gradient ?? "none")

function selectImage(value: string | undefined) {
  if (value != undefined) {
    imagesStore.selectStandalone(value == SERIES ? null : value)
  }
}
</script>

<template>
  <div class="flex flex-col pb-[12px] w-auto h-full">
    <!-- the views of the object, each with its images and annotations -->
    <ToggleImage v-if="views.length > 1" :items="views" :model-value="acquisition ? String(acquisition.id) : undefined"
      @update:model-value="(id) => { if (id != undefined) imagesStore.selectAcquisition(id) }" />
    <!-- shown image, and its wavelength in the series -->
    <ImageOverview v-if="acquisition && selectedImage" class="py-4" :image="selectedImage" :size="acquisition.sizeOf()"
      :camera="acquisition.camera" :counter="imagesStore.onSeries ? `${selectedImage.wavelength?.value + 'nm'} ${acquisition.index + 1}/${acquisition.images.length}` : undefined" />
    <ToggleImage v-if="acquisition" :items="images" :model-value="acquisition.standalone ?? SERIES"
      @update:model-value="selectImage" />
    <div class="flex-none space-y-4">
      <div v-if="acquisition && imagesStore.onSeries" class="wavelengths rounded-md px-3 py-2">
        <!-- transparent: the gradient of the wavelengths shows through -->
        <Slider :model-value="[acquisition.index]" :max="acquisition.images.length - 1" :step="1"
          track-class="bg-transparent" range-class="bg-transparent" thumb-class="border-black"
          @update:model-value="(value) => { if (value) imagesStore.setIndex(value[0]!) }" />
        <div class="mt-1.5 flex flex-row justify-between">
          <span v-for="image in acquisition.images" :key="image.name" class="w-5 text-center text-white">|</span>
        </div>
      </div>
      <div v-if="selectedImage && !selectedImage.computed" class="flex flex-row px-3 py-2 justify-around text-center">
        <div class="flex flex-col">
          <h3 class="font-bold">Wavelength</h3>
          <span>{{ wavelengthToString(selectedImage.wavelength) }}</span>
        </div>
        <div class="flex flex-col">
          <h3 class="font-bold">Camera Filter</h3>
          <span>{{ filterToString(selectedImage.cameraFilter) }}</span>
          <span v-if="selectedImage.cameraFilter?.description" class="text-sm text-muted-foreground">
            {{ selectedImage.cameraFilter.description }}
          </span>
        </div>
        <div class="flex flex-col">
          <h3 class="font-bold">Light Filter</h3>
          <span>{{ filterToString(selectedImage.lightFilter) }}</span>
          <span v-if="selectedImage.lightFilter?.description" class="text-sm text-muted-foreground">
            {{ selectedImage.lightFilter.description }}
          </span>
        </div>
      </div>
      <Separator />
      <ImageProcessing />
      <Separator />
      <!-- the annotations of the shown view -->
      <AnnotationTabs v-if="annotations" v-model="annotations.tab">
        <template #landmarks>
          <LandmarkList v-model="annotations.landmarks"
            @activate="(landmark) => acquisition?.select(landmark.pose.image.name)">
            <template #info="{ landmark }">
              <Label class="whitespace-nowrap">{{ vectorToString(landmark.position) }}</Label>
            </template>
          </LandmarkList>
        </template>
        <template #distances>
          <DistanceList v-model="annotations.distances" v-model:selected="annotations.selectedDistanceIndex"
            v-model:scale="annotations.scale" :adjust-factor="annotations.adjustFactor">
            <template #landmark-info="{ landmark }">
              <Label class="whitespace-nowrap">{{ vectorToString(landmark.position) }}</Label>
            </template>
          </DistanceList>
        </template>
      </AnnotationTabs>
    </div>
  </div>
</template>

<style scoped>
.wavelengths {
  background-image: v-bind(gradient);
}
</style>
