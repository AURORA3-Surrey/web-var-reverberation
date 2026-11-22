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

// The options on offer: for each, its title, the room state of its set and the
// result to plot.
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
    result: shown(result)
  };
});
