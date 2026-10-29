import { defineStore } from 'pinia'
import type { Project } from 'optica-core'
import type { SpectralAcquisition, SpectralImage } from '@/data/models/spectral'

export const useSettingsStore = defineStore('settings', {
  state: () => ({ isLeft: false }),
  actions: {
    useToggleLeft(value: boolean) {
      this.isLeft = value
    },
  },
  persist: {
    storage: localStorage,
    key: 'settings',
  }
})

// The project holds everything else: one acquisition per view of the object, each with its
// images, camera and annotations. Its annotations are saved by usePersistedAnnotations (ViewerView).
export const useImagesStore = defineStore('images', {
  state: () => ({
    objectPath: "",
    project: null as Project<SpectralImage, SpectralAcquisition> | null,
  }),
  getters: {
    acquisition: (state) => state.project?.acquisition ?? null,
    // typed from the state: the store unwraps the classes (protected members are dropped)
    annotations: (state) => state.project?.acquisition?.annotations ?? null,
    selectedImage(): SpectralImage | null {
      return this.acquisition?.selectedImage ?? null
    },
    // a wavelength of the series is shown
    onSeries(): boolean {
      return this.acquisition != null && this.acquisition.standalone == null
    },
  },
  actions: {
    setPath(path: string) {
      this.$reset()
      this.objectPath = path
    },
    selectAcquisition(id: string) {
      this.project?.selectAcquisition(id)
    },
    setIndex(index: number) {
      this.acquisition?.setIndex(index)
    },
    // the arrows browse the wavelengths, not from an image on its own
    increment() {
      if (this.onSeries) {
        this.acquisition?.moveIndex(1)
      }
    },
    decrement() {
      if (this.onSeries) {
        this.acquisition?.moveIndex(-1)
      }
    },
    // null goes back to the wavelengths
    selectStandalone(name: string | null) {
      this.acquisition?.selectStandalone(name)
    },
  },
})
