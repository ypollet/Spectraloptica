import { coreProviders, createProvider } from "optica-core"
import { SpectralRepository } from "./repositories/spectral_repository"

// Imported first by main.ts. The backend is the one of the environment (.env: VITE_BACKEND_TYPE, VITE_BACKEND_URL)
const repository = new SpectralRepository(createProvider(coreProviders("spectraloptica")))

export function getRepository(): SpectralRepository {
    return repository
}
