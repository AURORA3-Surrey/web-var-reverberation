# web-var-reverberation

An applet for a web page: the measured configurations of the AURORA³ variable acoustics room at the University of Surrey on a map of room volume against reverberation time and, for the one chosen there, the reverberation time measured in it against frequency, beside a 3D view of the room in that configuration. It is made for the articles of the AURORA³ wiki and works on any page.

## Hardware it shows

It talks to no hardware. It shows measurements taken in the variable acoustics room, and draws the room with [lib-var-viewer-js](https://github.com/AURORA3-Surrey/lib-var-viewer-js): the 63 Flex Acoustics evoke1 panels, the four curtains and the IAC motor-operated moving wall.

## Put it on a page

`npm run build` writes the applet to `dist/var-reverberation.js`: one file with its scripts, its styles and the data it shows. A page needs that file and two lines:

```html
<div class="var-reverberation"></div>
<script type="module" src="var-reverberation.js"></script>
```

The applet draws itself in every element with that class. It takes the page's typeface and the width of its element: the model and the chart sit side by side where that is at least 38rem, and one above the other where it is not. `dist/index.html` is the demo page, built beside it.

A configuration is chosen on the map, by a click or tap near its mark or with the arrow keys once the map has the focus, or by one of the buttons above the map, which a few named configurations have. Choosing another moves the wall, the curtains and the curve to it in half a second, while the panels fade. Readers whose system asks for reduced motion see the wall, the curtains and the curve change at once.

## The data

The applet reads sets of measurements in the formats of the facility's impulse response data conventions:

- `<ID>.yaml`, a set's sidecar, for the room state: the wall's position, the panels that are absorptive, and the curtains installed and how far each is drawn.
- `<ID>_errata.yaml`, the corrections to the sidecar, which it applies before reading it.
- `<ID>_derived.yaml`, the results calculated from the set, for the curve: the bands, the value and the spread in each, and the standard and accuracy shown under the chart.

[options.yaml](options.yaml) lists what the applet offers: for each configuration the result to plot, named as the conventions name one (`VAR_20261119T000001Z_d01`), and a title for those that get a button of their own above the map. It can also name bands to leave out of the chart and its table (`leave_out_hz`), which stay in the sets' files, and give a `notice` to show above the list. The files are read while building, so a change to them or to the list shows after a new build.

The sets are kept in [sets](sets), in this repository for now: for each, its sidecar, its corrections if it has any and its derived results, without the audio. The first of them are records reconstructed after the event, from plots and e-mails; each file says at its head what was worked out and what is not known.

The map places a configuration by three things worked out from its set: the room's volume, from the wall's position and the room's clear section as the control software has it (4.911 m by 3.184 m); the share of the panels in front of the wall that are open; and the reverberation time at mid frequencies, the mean of the 500 Hz and 1 kHz bands.

Two things in a set are not drawn as recorded:

- The model keeps the curtains as all or none, so a curtain taken down while others hang is drawn parked.
- The model has no state for a panel listed under `fault`, at fault or of unknown state, and draws it closed. In the first sets these are the panels behind the moving wall.

Panels are found by the controller's numbers, which the model follows; which end of the two end walls they start from is an assumption (see the model's plan).

## Curves to compare with

The menu under the chart draws the curves of one source from the literature, in grey behind the room's own. Each source is a file in [references](references), and [options.yaml](options.yaml) names the ones on offer, in the order of the menu; the first is shown to begin with. A file holds:

- `name` and `source`, which make its entry in the menu, and `citation` and `doi`, for the link under the chart.
- `summary`, a sentence saying what the curves are and how they were obtained, shown under the chart.
- `frequency_hz` and, under `curves`, a `label` and the `value` in each band for each curve.

The curves are cut off at the bands the room's results cover, and the chart's scale takes them into account, so choosing one moves nothing. They keep their own bands, and are left out of the readout and of the table of values. Values read off a published figure are someone else's work: the file says where they come from, and the page cites the source.

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
