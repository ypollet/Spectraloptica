# Spectraloptica manifest: `spectral.json`

The fields spectraloptica adds to the common manifest ([core/MANIFEST.md](../core/MANIFEST.md)). The JSON Schema is [`manifest.schema.json`](manifest.schema.json).

An acquisition is a view of the object. `images` is its wavelength series (the viewer sorts it by `wavelength.value`). `standaloneImages` are images on their own, and each needs a `label`.

```jsonc
{
  "file": "UV_365.jpg", "label": "UV",
  "wavelength":   { "type": "UV", "value": 365, "bandwidth": 10 },
  "cameraFilter": { "type": "UV", "description": "ZWB2" },
  "lightFilter":  { "type": "IR", "min": 720, "max": null }
}
```

A band has `type` (UV, VIS, IR…) and optional `value`, `bandwidth`, `min`, `max` (nm, `null`: no limit) and `description`.

Check a manifest (the tests in `tests/test_manifest.py` check every manifest of `data/`):

```bash
python -m optica_core.schema manifest.schema.json data/<object>/spectral.json
```
