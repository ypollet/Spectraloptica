import { OrthancProvider, ProviderFactory, RepositoryFactory } from "optica-core"
import { SpectralRepository } from "./repositories/spectral_repository"

// Imported first by main.ts: the stores and components get the repository from the factories
ProviderFactory.register("ORTHANC", (url) => new OrthancProvider(url, "spectraloptica"))
RepositoryFactory.register("DATA", (provider) => new SpectralRepository(provider))

export function getRepository(): SpectralRepository {
    return RepositoryFactory.get<SpectralRepository>()
}
