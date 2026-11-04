<script setup lang="ts">
import type Color from 'color'
import { storeToRefs } from 'pinia'
import { type Landmark, type Distance, type Polygon, type Coordinates, type Pose } from 'optica-core'
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

// shown at once, its position comes later from the backend
function createLandmark(pose: Pose, color?: Color): Landmark {
  return annotations.value!.createLandmark(pose, computePosition, color)
}

function place(pos: Coordinates) {
  const current = annotations.value
  // nothing is placed from the processing tab
  if (!selectedImage.value || !current || current.tab == "processing") {
    return
  }
  const pose = { marker: pos, image: selectedImage.value }
  if (current.tab == "landmarks") {
    current.landmarks.push(createLandmark(pose))
    return
  }
  // the distance, polygon or box being drawn, kept on one image (see Annotations.accepts)
  const measure = current.target()
  if (measure && current.accepts(measure, selectedImage.value)) {
    current.add(measure, createLandmark(pose, measure.color))
  }
}

// landmark dragged from the middle of a segment of the distance or a side of the polygon being drawn
function insert(annotation: Distance | Polygon, index: number, pos: Coordinates) {
  if (!selectedImage.value || !annotations.value?.accepts(annotation, selectedImage.value)) {
    return
  }
  annotation.landmarks.splice(index, 0, createLandmark({ marker: pos, image: selectedImage.value }, annotation.color))
}

async function move(landmark: Landmark, pos: Coordinates) {
  if (!selectedImage.value || !annotations.value?.canMoveTo(landmark, selectedImage.value)) {
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
        :landmarks="annotations.landmarks" :distances="annotations.distances" :polygons="annotations.polygons"
        :boxes="annotations.boxes" :opened="annotations.opened"
        :can-drag="(landmark) => annotations!.canMoveTo(landmark, selectedImage!)" @place="place" @move="move" @remove="(landmark) => annotations!.removeLandmark(landmark.id)"
        @select="(landmark) => annotations!.showInSidebar(landmark)" @activate="(landmark) => acquisition!.select(landmark.pose.image.name)"
        @finish="annotations!.finishPolygon()"
        @insert="insert" />
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
