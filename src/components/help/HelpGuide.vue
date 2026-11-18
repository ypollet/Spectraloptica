<script setup lang="ts">
import { PhMouseLeftClick, PhX } from '@phosphor-icons/vue'
import {
  DrawingHelp, HelpGuide, HelpSection, ManagingHelp, MeasuresHelp, MenusHelp, NavigationHelp,
} from 'optica-core/ui/help-guide'
</script>

<template>
  <HelpGuide app-name="Spectraloptica">
    <template #about>
      <p>Spectraloptica shows a specimen photographed at several wavelengths of light, from ultraviolet to infrared,
        with the filters used for each image.</p>
      <p>The images can be compared, combined into new ones (operations, false colors) and annotated.</p>
    </template>

    <NavigationHelp>
      <li>
        <strong>Wavelength slider</strong> (in the sidebar): drag it to go through the wavelength series, the counter
        under the thumbnail shows the wavelength and its position in the series
      </li>
      <li>
        <kbd class="rounded border px-1 text-xs">←</kbd> <kbd class="rounded border px-1 text-xs">↓</kbd> /
        <kbd class="rounded border px-1 text-xs">→</kbd> <kbd class="rounded border px-1 text-xs">↑</kbd>: previous /
        next wavelength of the series
      </li>
      <li>The buttons above the slider switch between the wavelength series and the individual images</li>
      <li>
        <PhMouseLeftClick class="inline h-5 w-5 align-text-bottom" weight="fill" /><span
          class="text-xs font-bold">x2</span> on a landmark in the image, or on the image name of an annotation in the
        sidebar: goes to the image it was placed on
      </li>
    </NavigationHelp>

    <HelpSection title="How it works">
      <li>
        A view is one framing of the specimen with its images and its own annotations. If there are several, they are
        chosen at the top of the sidebar
      </li>
      <li>
        A view has a <strong>wavelength series</strong> (sorted from the shortest wavelength) and sometimes
        <strong>individual images</strong> outside of it
      </li>
      <li>
        Under the slider: the <strong>wavelength</strong> of the shown image, and the <strong>camera filter</strong>
        and <strong>light filter</strong> used to take it
      </li>
      <li>
        Annotations are placed on the shown image and stay on it: a landmark can only be moved on its own image, and
        a distance, polygon or box is measured on the image of its first landmark. The sidebar shows that image
      </li>
    </HelpSection>

    <DrawingHelp />

    <ManagingHelp />

    <MeasuresHelp>
      <template #intro>
        <li>All values are in 2D: positions on the image, scaled by its pixel size if given</li>
      </template>
    </MeasuresHelp>

    <HelpSection title="Image Processing">
      <li>The <strong>Image Processing</strong> tab of the sidebar computes new images from the images of the view</li>
      <li>
        <strong>Operation</strong>: combines Image A and Image B
        <ul class="mt-1 list-[circle] pl-5 space-y-1">
          <li><strong>Addition</strong>: A + B</li>
          <li><strong>Difference</strong>: |A − B|</li>
          <li><strong>Ratio</strong>: A ÷ B</li>
          <li><strong>Normalized difference</strong>: (A − B) ÷ (A + B)</li>
        </ul>
      </li>
      <li><strong>False color</strong>: puts one image in each of the Red, Green and Blue channels</li>
      <li>
        <strong>Compute</strong>: a preview is shown at once, the full resolution follows (the spinner in the list)
      </li>
      <li>
        The results are listed under <strong>Processed Images</strong>, click one to show it. They are computed again
        when the specimen is reopened
      </li>
      <li>
        <PhX class="inline h-5 w-5 align-text-bottom" /> removes a processed image,
        <strong>with the annotations placed on it</strong>
      </li>
      <li>Annotations can be placed on processed images like on the others, except from the Image Processing tab</li>
    </HelpSection>

    <MenusHelp />
  </HelpGuide>
</template>
