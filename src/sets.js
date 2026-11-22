import list from '../options.yaml';

// The files of the sets, as the data conventions name them: `<ID>.yaml` is a
// set's sidecar, `<ID>_errata.yaml` its corrections and `<ID>_derived.yaml` the
// results calculated from it. Measured sets are kept in sets/, without their
// audio. Those in sample-sets/ have invented values, to develop the applet
// with.
const measured = import.meta.glob('../sets/*.yaml', {
  eager: true,
  import: 'default'
});
const samples = import.meta.glob('../sample-sets/*.yaml', {
  eager: true,
  import: 'default'
});

const file = name =>
  measured[`../sets/${name}.yaml`] ?? samples[`../sample-sets/${name}.yaml`];

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

// The options on offer: for each, its title, the room state of its set, the
// result to plot and whether the set is a sample.
export const options = list.options.map(({ title, result: reference }) => {
  const [, set, id] = reference.match(/^(.+)_(d\d+)$/);
  const sidecar = file(set);
  const result = file(`${set}_derived`)?.results.find(r => r.id === id);
  if (!sidecar || !result) {
    throw new Error(`options.yaml: no set or no result for ${reference}`);
  }
  return {
    title,
    state: corrected(sidecar, file(`${set}_errata`)),
    result,
    sample: !measured[`../sets/${set}.yaml`]
  };
});
