import { Acquisition, type ProjectImage } from "@optica/core"
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
}

// The images of one view of the object (Dorsal, Ventral...): the wavelength series (`images`, sorted by
// wavelength), the images on their own (`standaloneImages`) and the ones computed from them
export class SpectralAcquisition extends Acquisition<SpectralImage> {
    computedImages: SpectralImage[] = []

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

    // shows a computed image, with its thumbnail as image until setComputedFullImage gives the full resolution
    addComputedImage(label: string, thumbnail: string) {
        this.computedImages.push({ name: label, label, image: thumbnail, thumbnail, computed: true })
        this.standalone = label
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
        if (this.standalone == label) {
            this.standalone = this.hasGroup ? null : (this.standaloneImages[0]?.name ?? null)
        }
        URL.revokeObjectURL(computed.thumbnail!)
        if (computed.image != computed.thumbnail) {
            URL.revokeObjectURL(computed.image)
        }
    }
}
