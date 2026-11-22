import list from '../options.yaml';

// The curves from the literature that the chart can be compared with: one file
// per source in references/, offered in the order options.yaml names them. A
// file gives the source's name and citation, a sentence saying what its curves
// are, the frequencies and, for each curve, its label and its values.
const files = import.meta.glob('../references/*.yaml', {
  eager: true,
  import: 'default'
});

export const references = (list.references ?? []).map(name => {
  const reference = files[`../references/${name}.yaml`];
  if (!reference) throw new Error(`options.yaml: no reference named ${name}`);
  return reference;
});
