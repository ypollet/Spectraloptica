import axios from "axios"
import { parseAcquisitions, ProjectRepository, WebProvider, type AcquisitionObject, type DataProvider } from "@optica/core"
import { SpectralAcquisition, type SpectralImage } from "../models/spectral"

// Operations between two images, computed by the backend (/<id>/operation/<value>)
export const OPERATIONS = [
    { value: "add", label: "Addition", format: (left: string, right: string) => `${left} + ${right}` },
    { value: "sub", label: "Difference", format: (left: string, right: string) => `|${left} − ${right}|` },
    { value: "div", label: "Ratio", format: (left: string, right: string) => `${left} ÷ ${right}` },
    { value: "nd", label: "Normalized difference", format: (left: string, right: string) => `${left} NDVI ${right}` },
] as const

// image of the old payloads: the filters had other names, `bandwith` was misspelled
function parseBand<T extends { bandwidth?: number | null }>(band: any): T | undefined {
    return band ? { ...band, bandwidth: band.bandwidth ?? band.bandwith } : undefined
}

function parseImage(name: string, label: string, image: any): SpectralImage {
    return {
        name,
        label,
        image: "",
        wavelength: parseBand(image.wavelength),
        cameraFilter: parseBand(image.cameraFilter ?? image.filter ?? image.image_filter),
        lightFilter: parseBand(image.lightFilter ?? image.light_filter),
    }
}

// one group of the old payloads: { spectralImages, individualImages: { label: image }, size, thumbnails }
function parseGroup(id: string, group: any): AcquisitionObject<SpectralImage> {
    return {
        id,
        images: (group.spectralImages ?? []).map((image: any) => parseImage(image.name, image.label ?? image.name, image)),
        standaloneImages: Object.entries(group.individualImages ?? {}).map(([label, image]: [string, any]) => parseImage(image.name, label, image)),
        size: group.size,
        thumbnails: group.thumbnails,
    }
}

// Reads the standard payload, or the ones of the backends not migrated yet:
// the old Flask one ({ group: { spectralImages, ... } }) and the Orthanc plugin (one group, no key)
export function parseSpectral(data: any): AcquisitionObject<SpectralImage>[] {
    if (data.acquisitions) {
        return parseAcquisitions<SpectralImage>(data)
    }
    if (data.spectralImages || data.individualImages) {
        return [parseGroup("spectral", data)]
    }
    return Object.entries(data).map(([id, group]) => parseGroup(id, group))
}

export class SpectralRepository extends ProjectRepository<SpectralImage, SpectralAcquisition> {
    constructor(provider: DataProvider) {
        super(provider, parseSpectral, (object) => new SpectralAcquisition(object))
    }

    // the Orthanc plugin has no operation nor false color routes
    get supportsProcessing(): boolean {
        return this.provider instanceof WebProvider
    }

    // blob url of the result, `thumb`: a downscaled preview, much faster
    async computeOperation(objectPath: string, operation: string, left: string, right: string, thumb: boolean): Promise<string> {
        return this.compute(`${objectPath}/operation/${operation}`, { left, right, thumb })
    }

    // each channel is an image of the object, as gray levels
    async computeFalseColor(objectPath: string, red: string, green: string, blue: string, thumb: boolean): Promise<string> {
        return this.compute(`${objectPath}/false_color`, { r: red, g: green, b: blue, thumb })
    }

    private async compute(route: string, params: Record<string, string | boolean>): Promise<string> {
        const res = await axios.get((this.provider as WebProvider).url(route), { params, responseType: "blob" })
        return URL.createObjectURL(res.data as Blob)
    }
}
