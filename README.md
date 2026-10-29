# Spectraloptica (core)

Spectraloptica rebuilt on [`core/`](../core): the viewers, landmark and distance lists, menu, models and data layer come from `optica-core` and `optica_core`; this folder only keeps what is specific to multispectral images (from `../spectral-old`).

- `app.py`: the `spectral.json` adapter of the common API, and the image processing routes.
  - One acquisition per view of the object (`images.<view>`: Dorsal, Ventral...): the wavelength series (`images`, from `spectral`, sorted by wavelength) and the images on their own (`standaloneImages`, from `individualImages`, labelled by their key). The old manifests without views are read as one acquisition `spectral`.
  - `/<id>/operation/<add|sub|div|nd>?left=&right=&thumb=` and `/<id>/false_color?r=&g=&b=&thumb=` return a PNG computed from the images of the object (noise-reduced, cached in memory). `thumb=true` gives a downscaled preview.
- `src/data/models/spectral.ts`: `SpectralAcquisition`, with the images computed in the session (blob urls, not saved).
- `src/data/repositories/spectral_repository.ts`: reads the standard payload and the old ones (old Flask backend, Orthanc plugin), calls the processing routes (WEB backend only).
- `src/components/`: the sidebar (views, wavelength slider and filters, image processing, annotations), the viewer and the menu wiring.

Landmarks can be placed on the images from disk, not on the computed ones.

## Run

```bash
# backend, objects in ./data/<id>/spectral.json ($OPTICA_DATA_FOLDER to use another folder)
python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/flask --app app run --port 5000

# frontend (http://localhost:5173/?series=<id>)
npm install
npm run dev
```

`.env` selects the backend (`VITE_BACKEND_TYPE=WEB|ORTHANC`, `VITE_BACKEND_URL`). The processing settings can be changed from the environment, e.g. `FLASK_IMAGE_CACHE_MAX_IMAGES=20`, `FLASK_DENOISE_TARGET_NOISE=0` (no noise reduction).
