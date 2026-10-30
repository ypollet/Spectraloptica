import { watch, type UnwrapRef } from 'vue'
import { defineStore } from 'pinia'
import type { Project } from 'optica-core'
import { type ProcessingRecipe, type SpectralAcquisition, type SpectralImage } from '@/data/models/spectral'
import { OPERATIONS } from '@/data/repositories/spectral_repository'
import { getRepository } from '@/data/setup'

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

// an acquisition as the store gives it: the classes are unwrapped (protected members are dropped)
type StoreAcquisition = UnwrapRef<SpectralAcquisition>

// The project holds everything else: one acquisition per view of the object, each with its
// images, camera and annotations. Its annotations are saved by usePersistedAnnotations (ViewerView).
// The recipes of the computed images and the shown image are saved here, by object, and restored on a reload.
export const useImagesStore = defineStore('images', {
  state: () => ({
    objectPath: "",
    project: null as Project<SpectralImage, SpectralAcquisition> | null,
    // how the computed images of each view were made, by acquisition id, in the order of the results
    recipes: {} as Record<string, ProcessingRecipe[]>,
    // what the viewer is on, kept up to date by usePersistedView
    shown: { images: {} } as ShownImages,
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
      this.recipes = loadRecipes(path)
      this.shown = loadShown(path)
    },
    // The project of the object, shown where the viewer was. Its saved computed images are computed
    // again, one after the other in each view so they come back in their order; the one the viewer
    // was on is shown when it is back.
    setProject(project: Project<SpectralImage, SpectralAcquisition>) {
      this.project = project
      const shown = this.shown
      if (shown.acquisition != null) {
        this.project.selectAcquisition(shown.acquisition)
      }
      for (const acquisition of this.project.acquisitions) {
        const name = shown.images[acquisition.id]
        if (name != null && acquisition.getImage(name)) {
          acquisition.select(name)
        }
        this.restoreRecipes(acquisition, name)
      }
    },
    // computes again the saved images of a view, in their order, and shows the one named `shown`
    async restoreRecipes(acquisition: StoreAcquisition, shown: string | undefined) {
      for (const recipe of this.recipes[acquisition.id] ?? []) {
        await this.runRecipe(acquisition, recipe, recipeLabel(acquisition, recipe) == shown)
      }
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
    // operation or false color with the inputs chosen on the shown view, added to its computed images
    async compute() {
      const current = this.acquisition
      if (!current) {
        return
      }
      const processing = current.processing
      const recipe: ProcessingRecipe = processing.mode == "operation"
        ? { type: "operation", operation: processing.operation, left: processing.left!, right: processing.right! }
        : { type: "falseColor", red: processing.channels.red!, green: processing.channels.green!, blue: processing.channels.blue! }

      // already computed: just show it again
      const label = recipeLabel(current, recipe)
      if (current.computedImages.some((image) => image.name == label)) {
        current.selectStandalone(label)
        return
      }
      if (await this.runRecipe(current, recipe, true)) {
        (this.recipes[current.id] ??= []).push(recipe)
        saveRecipes(this.objectPath, this.recipes)
      }
    },
    // Computes the image of the recipe in `acquisition`, the thumbnail first for a quick preview, then the
    // full resolution in the background. Its progress goes to the processing of that view, even if another
    // one is shown meanwhile. Returns false if the thumbnail failed: no image was added.
    async runRecipe(acquisition: StoreAcquisition, recipe: ProcessingRecipe, select: boolean): Promise<boolean> {
      const repository = getRepository()
      const processing = acquisition.processing
      const label = recipeLabel(acquisition, recipe)
      const request = (thumb: boolean) => recipe.type == "operation"
        ? repository.computeOperation(this.objectPath, recipe.operation, recipe.left, recipe.right, thumb)
        : repository.computeFalseColor(this.objectPath, recipe.red, recipe.green, recipe.blue, thumb)

      processing.loading = true
      processing.error = ""
      try {
        acquisition.addComputedImage(label, await request(true), recipe, select)
      } catch (e: any) {
        processing.error = errorMessage(e)
        return false
      } finally {
        processing.loading = false
      }

      processing.pendingFull.push(label)
      try {
        const image = await request(false)
        if (!acquisition.setComputedFullImage(label, image)) {
          URL.revokeObjectURL(image)
        }
      } catch (e: any) {
        processing.error = `Full resolution of "${label}": ${errorMessage(e)}`
      } finally {
        processing.pendingFull = processing.pendingFull.filter((pending) => pending != label)
      }
      return true
    },
    // removes the computed image of the shown view, and its recipe
    removeComputedImage(label: string) {
      const current = this.acquisition
      if (!current) {
        return
      }
      current.removeComputedImage(label)
      this.recipes[current.id] = (this.recipes[current.id] ?? []).filter((recipe) => recipeLabel(current, recipe) != label)
      saveRecipes(this.objectPath, this.recipes)
    },
  },
})

// name of the computed image of a recipe, from the labels of its inputs
function recipeLabel(acquisition: StoreAcquisition, recipe: ProcessingRecipe): string {
  const labelOf = (name: string) => acquisition.sources.find((image) => image.name == name)?.label ?? name
  if (recipe.type == "operation") {
    const op = OPERATIONS.find((op) => op.value == recipe.operation)!
    return op.format(labelOf(recipe.left), labelOf(recipe.right))
  }
  return `R: ${labelOf(recipe.red)} · G: ${labelOf(recipe.green)} · B: ${labelOf(recipe.blue)}`
}

// the recipes survive a reload (sessionStorage, by object), like the annotations
const recipesKey = (objectPath: string) => `recipes:${objectPath}`

function loadRecipes(objectPath: string): Record<string, ProcessingRecipe[]> {
  try {
    return JSON.parse(sessionStorage.getItem(recipesKey(objectPath)) ?? "{}")
  } catch (error) {
    console.error("Saved recipes ignored:", error)
    return {}
  }
}

function saveRecipes(objectPath: string, recipes: Record<string, ProcessingRecipe[]>) {
  sessionStorage.setItem(recipesKey(objectPath), JSON.stringify(recipes))
}

// image shown in each view (series, standalone or computed: its name), by acquisition id, and the shown view
type ShownImages = {
  acquisition?: string
  images: Record<string, string>
}

const shownKey = (objectPath: string) => `shown:${objectPath}`

function loadShown(objectPath: string): ShownImages {
  try {
    return { images: {}, ...JSON.parse(sessionStorage.getItem(shownKey(objectPath)) ?? "{}") }
  } catch (error) {
    console.error("Saved shown images ignored:", error)
    return { images: {} }
  }
}

// Keeps `shown` of the store up to date and saved, whatever changes the shown image (store actions,
// the lists, the computed images). Call it in a component setup, after setPath.
export function usePersistedView() {
  const imagesStore = useImagesStore()
  watch(() => {
    const project = imagesStore.project
    if (!project) {
      return undefined
    }
    const shown: ShownImages = {
      acquisition: project.acquisition?.id,
      images: Object.fromEntries(project.acquisitions.flatMap((acquisition) =>
        acquisition.selectedImage ? [[acquisition.id, acquisition.selectedImage.name]] : [])),
    }
    return JSON.stringify(shown)
  }, (json) => {
    if (json) {
      imagesStore.shown = JSON.parse(json)
      sessionStorage.setItem(shownKey(imagesStore.objectPath), json)
    }
  })
}

function errorMessage(e: any): string {
  const status = e?.response?.status
  return status ? `The computation failed (HTTP ${status}). Check that the images have the same size.` : String(e?.message ?? e)
}
