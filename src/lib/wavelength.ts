import type { Filter, Wavelength } from "@/data/models/spectral"

function componentToHex(c: number): string {
  const hex = c.toString(16)
  return hex.length == 1 ? "0" + hex : hex
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b)
}

// Colour of a wavelength in nm, black outside of the visible light
// https://academo.org/demos/wavelength-to-colour-relationship/
export function nmToRGB(wavelength: number): [number, number, number] {
  const gamma = 0.80
  const intensityMax = 255
  let red: number, green: number, blue: number
  if (wavelength >= 380 && wavelength < 440) {
    [red, green, blue] = [-(wavelength - 440) / (440 - 380), 0, 1]
  } else if (wavelength >= 440 && wavelength < 490) {
    [red, green, blue] = [0, (wavelength - 440) / (490 - 440), 1]
  } else if (wavelength >= 490 && wavelength < 510) {
    [red, green, blue] = [0, 1, -(wavelength - 510) / (510 - 490)]
  } else if (wavelength >= 510 && wavelength < 580) {
    [red, green, blue] = [(wavelength - 510) / (580 - 510), 1, 0]
  } else if (wavelength >= 580 && wavelength < 645) {
    [red, green, blue] = [1, -(wavelength - 645) / (645 - 580), 0]
  } else if (wavelength >= 645 && wavelength < 781) {
    [red, green, blue] = [1, 0, 0]
  } else {
    [red, green, blue] = [0, 0, 0]
  }
  // the intensity falls off near the vision limits
  let factor: number
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380)
  } else if (wavelength >= 420 && wavelength < 701) {
    factor = 1
  } else if (wavelength >= 701 && wavelength < 781) {
    factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700)
  } else {
    factor = 0
  }
  const scale = (c: number) => c === 0 ? 0 : Math.round(intensityMax * Math.pow(c * factor, gamma))
  return [scale(red), scale(green), scale(blue)]
}

// "[min - max] nm", or the type of the band when it has no value
export function wavelengthToString(wavelength: Wavelength | undefined): string {
  if (wavelength?.value == null) {
    return wavelength?.type || "-"
  }
  const half = (wavelength.bandwidth ?? 0) / 2
  return half > 0 ? `[${wavelength.value - half} - ${wavelength.value + half}] nm` : `${wavelength.value} nm`
}

export function filterToString(filter: Filter | undefined): string {
  if (!filter) {
    return "-"
  }
  if (filter.min != null || filter.max != null) {
    return `[${filter.min ?? ".."} - ${filter.max ?? ".."}] nm`
  }
  return wavelengthToString(filter)
}
