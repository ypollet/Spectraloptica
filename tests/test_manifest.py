"""The manifest schema of spectraloptica (spectral.json), on top of the common one of optica_core."""

import copy
import glob
import json
import os

import pytest

pytest.importorskip("jsonschema")
from optica_core.schema import errors, validator  # noqa: E402

HERE = os.path.dirname(__file__)
SCHEMA = os.path.join(HERE, "..", "manifest.schema.json")
DATA = os.path.join(HERE, "..", "data")

EXAMPLE = {
    "format": "optica-manifest",
    "version": 1,
    "viewer": "spectraloptica",
    "unit": "mm",
    "acquisitions": [
        {
            "id": "Dorsal",
            "size": {
                "width": 60,
                "height": 40
            },
            "pixelSize": None,
            "images": [
                {
                    "file": "365.jpg",
                    "wavelength": {
                        "type": "UV",
                        "value": 365,
                        "bandwidth": 10
                    }
                }
            ],
            "standaloneImages": [
                {
                    "file": "white.jpg",
                    "label": "White",
                    "cameraFilter": {
                        "type": "IR",
                        "min": 720,
                        "max": None
                    }
                }
            ]
        }
    ]
}


@pytest.fixture(scope="module")
def check():
    return validator(SCHEMA)


def test_example(check):
    assert errors(check, EXAMPLE) == []


def a_standalone_image_without_label(manifest):
    del manifest["acquisitions"][0]["standaloneImages"][0]["label"]


def the_old_bandwith(manifest):
    manifest["acquisitions"][0]["images"][0]["wavelength"]["bandwith"] = 10


@pytest.mark.parametrize("mistake", [
    a_standalone_image_without_label,
    the_old_bandwith,
])
def test_mistakes_are_refused(check, mistake):
    manifest = copy.deepcopy(EXAMPLE)
    mistake(manifest)
    assert errors(check, manifest) != []


# the manifests of the data folder, when there is one (it isn't in git)
@pytest.mark.parametrize("path", sorted(glob.glob(os.path.join(DATA, "**", "spectral.json"), recursive=True)) or [None])
def test_data(check, path):
    if path is None:
        pytest.skip("no spectral.json in data/")
    with open(path) as f:
        assert errors(check, json.load(f)) == []
