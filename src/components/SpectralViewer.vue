<script setup lang="ts">
import type Color from 'color'
import { storeToRefs } from 'pinia'
import { Landmark, type Coordinates, type Pose } from 'optica-core'
import { ImageViewer } from 'optica-core/ui/image-viewer'
import { ProjectLoader } from 'optica-core/ui/project-loader'
import { getRepository } from '@/data/setup'
import { useImagesStore } from '@/lib/stores'

const imagesStore = useImagesStore()
const { acquisition, annotations, selectedImage } = storeToRefs(imagesStore)

const repository = getRepository()

async function loadProject() {
  const project = await repository.getImages(imagesStore.objectPath)
  imagesStore.setProject(project)
  return project
}

// position of a marker by the backend, a computed image's one by one of its inputs
function computePosition(pose: Pose) {
  const name = acquisition.value!.positionImage(pose.image.name)
  return repository.computeLandmarkPosition(imagesStore.objectPath, { ...pose, image: { ...pose.image, name } })
}

async function createLandmark(pose: Pose, color?: Color): Promise<Landmark> {
  const id = annotations.value!.generateID()
  const position = await computePosition(pose)
  return new Landmark(id, id, pose, position, color)
}

async function place(pos: Coordinates) {
  const current = annotations.value
  // nothing is placed from the processing tab
  if (!selectedImage.value || !current || current.tab == "processing") {
    return
  }
  const pose = { marker: pos, image: selectedImage.value }
  if (current.tab == "landmarks") {
    current.landmarks.push(await createLandmark(pose))
    return
  }
  // a distance is measured on a single image
  const distance = current.selectedDistance ?? current.newDistance()
  if (current.acceptsImage(distance, selectedImage.value.name)) {
    distance.landmarks.push(await createLandmark(pose, distance.color))
  }
}

async function move(landmark: Landmark, pos: Coordinates) {
  if (!selectedImage.value || !annotations.value?.canMoveTo(landmark, selectedImage.value.name)) {
    return
  }
  landmark.setPose(selectedImage.value, pos)
  landmark.position = await computePosition(landmark.pose)
}
</script>

<template>
  <ProjectLoader :load="loadProject">
    <div v-if="acquisition && annotations && selectedImage" class="w-full h-full flex flex-col items-center">
      <ImageViewer class="object-fit" :image="selectedImage" :size="acquisition.sizeOf()" :camera="acquisition.camera"
        :landmarks="annotations.landmarks" :distances="annotations.distances"
        :can-drag="(landmark) => annotations!.canMoveTo(landmark, selectedImage!.name)" @place="place" @move="move" @remove="(landmark) => annotations!.removeLandmark(landmark.id)"
        @select="(landmark) => annotations!.showInSidebar(landmark)" />
    </div>
  </ProjectLoader>
</template>

<style scoped>
.object-fit {
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
