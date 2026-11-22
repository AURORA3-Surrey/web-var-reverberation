# web-var-reverberation

An applet for a web page: a list of configurations of the AURORA³ variable acoustics room at the University of Surrey and, for the one chosen, the reverberation time measured in it against frequency, beside a 3D view of the room in that configuration. It is made for the articles of the AURORA³ wiki and works on any page.

## Hardware it shows

It talks to no hardware. It shows measurements taken in the variable acoustics room, and draws the room with [lib-var-viewer-js](https://github.com/AURORA3-Surrey/lib-var-viewer-js): the 63 Flex Acoustics evoke1 panels, the four curtains and the IAC motor-operated moving wall.

## Put it on a page

`npm run build` writes the applet to `dist/var-reverberation.js`: one file with its scripts, its styles and the data it shows. A page needs that file and two lines:

```html
<div class="var-reverberation"></div>
<script type="module" src="var-reverberation.js"></script>
```

The applet draws itself in every element with that class. It takes the page's typeface and the width of its element: the model and the chart sit side by side where that is at least 38rem, and one above the other where it is not. `dist/index.html` is the demo page, built beside it.

## The data

The applet reads sets of measurements in the formats of the facility's impulse response data conventions:

- `<ID>.yaml`, a set's sidecar, for the room state: the wall's position, the panels that are absorptive, and the curtains installed and how far each is drawn.
- `<ID>_errata.yaml`, the corrections to the sidecar, which it applies before reading it.
- `<ID>_derived.yaml`, the results calculated from the set, for the curve: the bands, the value and the spread in each, and the standard and accuracy shown under the chart.

[options.yaml](options.yaml) lists what the applet offers, in order: a title, and the result to plot, named as the conventions name one (`VAR_20000101T100000Z_d01`). The files are read while building, so a change to them or to the list shows after a new build.

The sets in [sample-sets](sample-sets) are samples with invented values, there to develop the applet with, and the applet says so above its list. Measured sets replace them in [src/sets.js](src/sets.js), which names the folder and holds the `SAMPLE` flag that shows the notice.

Three things in a set are not drawn as recorded:

- The model keeps the curtains as all or none, so a curtain taken down while others hang is drawn parked.
- The model has no state for a panel at fault, and draws it closed.
- Panels are found by the model's numbers, which are provisional until they are checked against the controller's.

## Develop

The model is a git submodule, so clone with it:

```bash
git clone --recurse-submodules git@github.com:AURORA3-Surrey/web-var-reverberation.git
```

```bash
npm install
```

```bash
npm run dev
```

`npm run dev` serves the demo page, [index.html](index.html), which holds the applet in a column as wide as a wiki article. In a clone made without the submodule, `git submodule update --init` fetches it.

## Citation

See [CITATION.cff](CITATION.cff), or GitHub's "Cite this repository".

## Licence

MIT; see [LICENSE](LICENSE).
