<script setup lang="ts">
import { downloadCSV, downloadJSON, exportFilename } from 'optica-core'
import { AppMenu } from 'optica-core/ui/app-menu'
import { useImagesStore, useSettingsStore } from '@/lib/stores'
import { Credits } from '@/components/credits'
import { HelpGuide } from '@/components/help'

const settingsStore = useSettingsStore()
const imagesStore = useImagesStore()

// the annotations of every acquisition, by acquisition id
function exportAnnotations(format: "csv" | "json") {
  const project = imagesStore.project
  if (!project) {
    return
  }
  if (format == "csv") {
    downloadCSV(project.annotationsToCSVRows(), exportFilename("spectral", imagesStore.objectPath, "csv"))
  } else {
    downloadJSON(project.annotationsToJSON(), exportFilename("spectral", imagesStore.objectPath, "json"))
  }
}

// also reads the files with the annotations of a single acquisition,
// the landmarks without a position (old exports) get it from the backend
function importAnnotations(content: string) {
  if (!imagesStore.project) {
    return
  }
  imagesStore.project.importAnnotations(JSON.parse(content))
  imagesStore.recomputePositions()
}
</script>

<template>
  <AppMenu :reverse="settingsStore.isLeft" @update:reverse="settingsStore.useToggleLeft" app-name="Spectraloptica"
    @export="exportAnnotations" @import="importAnnotations">
    <template #help-guide>
      <HelpGuide />
    </template>
    <template #credits>
      <Credits />
    </template>
  </AppMenu>
</template>
