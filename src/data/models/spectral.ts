import { Acquisition, Annotations, Distance, Landmark, type ProjectImage } from "optica-core"
import { nmToRGB, rgbToHex } from "@/lib/wavelength"

// Light band of an image: its type (UV, VIS, IR) and/or its value in nm
export type Wavelength = {
    type?: string
    value?: number | null
    bandwidth?: number | null
}

// Filter on the camera or on the light: its type and/or its pass band in nm (min - max, or value ± bandwidth / 2)
export type Filter = Wavelength & {
    min?: number | null
    max?: number | null
    description?: string
}

// Image of a spectral acquisition: one wavelength of the series, or a white light, UV... image on its own
export type SpectralImage = ProjectImage & {
    wavelength?: Wavelength
    cameraFilter?: Filter
    lightFilter?: Filter
    // result of an operation or a false color: blob urls, only kept for the session
    computed?: boolean
    // how the computed image was made
    recipe?: ProcessingRecipe
}

export const CHANNELS = [
    { key: "red", label: "Red", color: "#ef4444" },
    { key: "green", label: "Green", color: "#22c55e" },
    { key: "blue", label: "Blue", color: "#3b82f6" },
] as const

export type Channel = typeof CHANNELS[number]["key"]

// How a computed image was made, from the file names of images of its view: kept by the store
// to compute the image again after a reload (the blob urls of the results don't survive it)
export type ProcessingRecipe =
    | { type: "operation", operation: string, left: string, right: string }
    | { type: "falseColor", red: string, green: string, blue: string }

// Inputs and progress of the computations of a view (operation or false color), only kept for the session.
// Its results are the computed images of the acquisition.
export class ImageProcessing {
    mode = "operation"
    operation = "add"
    // file names of the inputs, images of the view
    left?: string
    right?: string
    channels: Record<Channel, string | undefined> = { red: undefined, green: undefined, blue: undefined }
    loading = false
    // labels whose thumbnail is shown while the full resolution is still being computed
    pendingFull: string[] = []
    error = ""

    get canCompute(): boolean {
        return !this.loading && (this.mode == "operation"
            ? this.left != null && this.right != null
            : CHANNELS.every((channel) => this.channels[channel.key] != null))
    }
}

// The images of one view of the object (Dorsal, Ventral...): the wavelength series (`images`, sorted by
// wavelength), the images on their own (`standaloneImages`) and the ones computed from them
export class SpectralAcquisition extends Acquisition<SpectralImage> {
    declare annotations: SpectralAnnotations
    computedImages: SpectralImage[] = []
    processing = new ImageProcessing()

    protected createAnnotations(): SpectralAnnotations {
        return new SpectralAnnotations()
    }

    // the computed images are shown like the standalone ones
    getStandalone(name: string): SpectralImage | undefined {
        return super.getStandalone(name) ?? this.computedImages.find((image) => image.name == name)
    }

    // images on disk, the inputs of the computations
    get sources(): SpectralImage[] {
        return [...this.standaloneImages, ...this.images]
    }

    // background of the wavelength slider: the colour of each wavelength at its step
    get gradient(): string {
        const n = this.images.length
        const stops = this.images.flatMap((image, i) => {
            const value = image.wavelength?.value
            if (value == null) {
                return []
            }
            const [r, g, b] = nmToRGB(value)
            const pos = n > 1 ? i * 94 / (n - 1) + 3 : 50
            return [`${rgbToHex(r, g, b)} ${pos}%`]
        })
        return stops.length > 0 ? `linear-gradient(to right, #000000, ${stops.join(", ")})` : "none"
    }

    // adds a computed image, with its thumbnail as image until setComputedFullImage gives the full resolution.
    // select: shows it
    addComputedImage(label: string, thumbnail: string, recipe: ProcessingRecipe, select = true) {
        this.computedImages.push({ name: label, label, image: thumbnail, thumbnail, computed: true, recipe })
        if (select) {
            this.standalone = label
        }
    }

    // Name of the image the backend computes the landmark positions of `name` on: a computed image
    // is unknown to it, but has the size and the pixel ratio of its inputs, images of this view
    positionImage(name: string): string {
        const recipe = this.getStandalone(name)?.recipe
        if (!recipe) {
            return name
        }
        return recipe.type == "operation" ? recipe.left : recipe.red
    }

    // returns false if the image was removed in the meantime
    setComputedFullImage(label: string, image: string): boolean {
        const index = this.computedImages.findIndex((computed) => computed.name == label)
        const computed = this.computedImages[index]
        if (!computed) {
            return false
        }
        if (computed.image != computed.thumbnail) {
            URL.revokeObjectURL(computed.image)
        }
        // replace the entry rather than mutating it, so the viewer sees a new selected image and reloads
        this.computedImages.splice(index, 1, { ...computed, image })
        return true
    }

    removeComputedImage(label: string) {
        const index = this.computedImages.findIndex((computed) => computed.name == label)
        const computed = this.computedImages[index]
        if (!computed) {
            return
        }
        this.computedImages.splice(index, 1)
        this.annotations.removeImage(label)
        if (this.standalone == label) {
            this.standalone = this.hasGroup ? null : (this.standaloneImages[0]?.name ?? null)
        }
        URL.revokeObjectURL(computed.thumbnail!)
        if (computed.image != computed.thumbnail) {
            URL.revokeObjectURL(computed.image)
        }
    }
}

// Annotations of a view: a landmark stays on the image it was placed on, and a distance is
// measured on one image, the one of its first landmark
export class SpectralAnnotations extends Annotations {
    // name of the image of the distance, null while it has no landmark
    imageOf(distance: Distance): string | null {
        return distance.landmarks[0]?.pose.image.name ?? null
    }

    // true if a landmark of the distance can be placed on this image
    acceptsImage(distance: Distance, name: string): boolean {
        const own = this.imageOf(distance)
        return own == null || own == name
    }

    // a landmark can only be moved on its own image
    canMoveTo(landmark: Landmark, name: string): boolean {
        return landmark.pose.image.name == name
    }

    // removes the landmarks and the distances placed on an image (a computed image removed)
    removeImage(name: string) {
        const selected = this.selectedDistance
        this.landmarks = this.landmarks.filter((landmark) => landmark.pose.image.name != name)
        this.distances = this.distances.filter((distance) => this.imageOf(distance) != name)
        this.selectedDistanceIndex = selected ? this.distances.indexOf(selected) : -1
    }
}
