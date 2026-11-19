import axios from "axios"
import { OrthancProvider, parseAcquisitions, ProjectRepository, WebProvider, type AcquisitionObject, type DataProvider } from "optica-core"
import { SpectralAcquisition, type SpectralImage } from "../models/spectral"

// Operations between two images, computed by the backend (/<id>/operation/<value>)
export const OPERATIONS = [
    { value: "add", label: "Addition", format: (left: string, right: string) => `${left} + ${right}` },
    { value: "sub", label: "Difference", format: (left: string, right: string) => `|${left} − ${right}|` },
    { value: "div", label: "Ratio", format: (left: string, right: string) => `${left} ÷ ${right}` },
    { value: "nd", label: "Normalized difference", format: (left: string, right: string) => `${left} ND ${right}` },
] as const

function parseImage(name: string, label: string, image: any): SpectralImage {
    return {
        name,
        label,
        image: "",
        wavelength: image.wavelength,
        cameraFilter: image.cameraFilter,
        lightFilter: image.lightFilter,
        hasThumbnail: image.hasThumbnail,
    }
}

// one group of the Orthanc plugin payload: { spectralImages, individualImages: { label: image }, size }
function parseGroup(id: string, group: any): AcquisitionObject<SpectralImage> {
    return {
        id,
        images: (group.spectralImages ?? []).map((image: any) => parseImage(image.name, image.label ?? image.name, image)),
        standaloneImages: Object.entries(group.individualImages ?? {}).map(([label, image]: [string, any]) => parseImage(image.name, label, image)),
        size: group.size,
    }
}

// Reads the standard payload, or the one of the Orthanc plugin, not migrated yet: { group: { spectralImages, ... } }
export function parseSpectral(data: any): AcquisitionObject<SpectralImage>[] {
    if (data.acquisitions) {
        return parseAcquisitions<SpectralImage>(data)
    }
    return Object.entries(data).map(([id, group]) => parseGroup(id, group))
}

export class SpectralRepository extends ProjectRepository<SpectralImage, SpectralAcquisition> {
    constructor(provider: DataProvider) {
        super(provider, parseSpectral, (object) => new SpectralAcquisition(object))
    }

    // the Flask backend and the Orthanc plugin both have the operation and false color routes
    get supportsProcessing(): boolean {
        return this.provider instanceof WebProvider || this.provider instanceof OrthancProvider
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
        const res = await axios.get((this.provider as WebProvider | OrthancProvider).url(route), { params, responseType: "blob" })
        return URL.createObjectURL(res.data as Blob)
    }
}
