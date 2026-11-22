import list from '../options.yaml';

// The files of the sets, as the data conventions name them: `<ID>.yaml` is a
// set's sidecar, `<ID>_errata.yaml` its corrections and `<ID>_derived.yaml` the
// results calculated from it. The sets are kept in sets/, without their audio.
const files = import.meta.glob('../sets/*.yaml', {
  eager: true,
  import: 'default'
});

const file = name => files[`../sets/${name}.yaml`];

// A sidecar with its corrections applied, as the conventions ask of every
// program that reads one. A correction names its field by the path to it.
function corrected(sidecar, errata) {
  const state = structuredClone(sidecar);
  for (const { field, now } of errata?.corrections ?? []) {
    const path = field.split('.');
    const last = path.pop();
    path.reduce((part, key) => part[key], state)[last] = now;
  }
  return state;
}

// The centre frequency of each octave band, with those of the three one-third
// octave bands it is made of.
const OCTAVES = [
  [31.5, [25, 31.5, 40]],
  [63, [50, 63, 80]],
  [125, [100, 125, 160]],
  [250, [200, 250, 315]],
  [500, [400, 500, 630]],
  [1000, [800, 1000, 1250]],
  [2000, [1600, 2000, 2500]],
  [4000, [3150, 4000, 5000]],
  [8000, [6300, 8000, 10000]],
  [16000, [12500, 16000, 20000]]
];

// A result in octave bands, whatever bands it was calculated in, so that every
// curve has the same resolution. An octave of a result in one-third octave
// bands is the mean of its three bands, and is there only if all three are.
// The spread does not carry over, and `averaged_from` says what was done. The
// set's file keeps the result as it was calculated.
function inOctaves(result) {
  if (result.bands === 'octave') return result;
  const at = f => result.value[result.frequency_hz.indexOf(f)];
  const whole = OCTAVES.filter(([, thirds]) =>
    thirds.every(f => result.frequency_hz.includes(f))
  );
  return {
    ...result,
    bands: 'octave',
    averaged_from: result.bands,
    frequency_hz: whole.map(([f]) => f),
    value: whole.map(
      ([, thirds]) => thirds.reduce((sum, f) => sum + at(f), 0) / thirds.length
    ),
    spread: undefined
  };
}

// A result without the bands that options.yaml leaves out. The set's file keeps
// them; they are only not shown.
function shown(result) {
  const keep = result.frequency_hz.map(
    f => !(list.leave_out_hz ?? []).includes(f)
  );
  const kept = values => values?.filter((_, i) => keep[i]);
  return {
    ...result,
    frequency_hz: kept(result.frequency_hz),
    value: kept(result.value),
    spread: kept(result.spread)
  };
}

// The room's clear section in metres, between the faces of its panels, and the
// depth of the entrance wall's panels, as the control software has them. With
// the wall's position they give the room's volume.
const CLEAR = { width: 4.911, height: 3.184 };
const DEPTH = 0.33;

// Where an option stands on the map: the room's volume, the share of the panels
// in front of the wall that are open, whether the curtains hang, and the
// reverberation time at mid frequencies, the mean of the 500 Hz and 1 kHz
// octave bands.
function placed(state, result) {
  const { absorptive, reflective } = state.panels;
  const at = f => result.value[result.frequency_hz.indexOf(f)];
  return {
    volume: (state.wall.position_m - DEPTH) * CLEAR.width * CLEAR.height,
    open: absorptive.length / (absorptive.length + reflective.length),
    curtains: Object.values(state.curtains.installed).some(Boolean),
    mid: (at(500) + at(1000)) / 2
  };
}

// The options on offer: for each, its title if it has one, the room state of
// its set, the result to plot and its place on the map.
export const options = list.options.map(({ title, result: reference }) => {
  const [, set, id] = reference.match(/^(.+)_(d\d+)$/);
  const sidecar = file(set);
  const calculated = file(`${set}_derived`)?.results.find(r => r.id === id);
  if (!sidecar || !calculated) {
    throw new Error(`options.yaml: no set or no result for ${reference}`);
  }
  const state = corrected(sidecar, file(`${set}_errata`));
  const result = inOctaves(calculated);
  return { title, state, result: shown(result), ...placed(state, result) };
});
