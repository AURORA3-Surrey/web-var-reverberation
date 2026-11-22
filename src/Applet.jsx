import { useId, useMemo, useState } from 'react';
import { RoomModel } from 'lib-var-viewer-js';
import list from '../options.yaml';
import Chart from './Chart.jsx';
import ConfigurationMap, { named } from './ConfigurationMap.jsx';
import { between, configuration } from './configuration.js';
import { references } from './references.js';
import { options } from './sets.js';
import useGlide from './useGlide.js';

// One scale for every option, so that choosing another moves the curve and not
// the axes: the bands they cover between them, and the longest time any of them
// reaches, rounded up to a round number. The references count towards that
// time, in the bands the options cover, and the chart keeps room for the
// longest of their labels (`labels`, in characters), so that choosing one
// moves nothing either.
const results = options.map(o => o.result);
const frequencies = results.flatMap(r => r.frequency_hz);
const lowest = Math.min(...frequencies);
const highest = Math.max(...frequencies);
const longest = Math.max(
  ...results.flatMap(r => r.value.map((v, i) => v + (r.spread?.[i] ?? 0))),
  ...references.flatMap(r =>
    r.curves.flatMap(c =>
      c.value.filter(
        (_, i) => r.frequency_hz[i] >= lowest && r.frequency_hz[i] <= highest
      )
    )
  )
);
const step = longest > 2 ? 1 : longest > 1 ? 0.5 : 0.2;
const scale = {
  lowest,
  highest,
  top: Math.ceil(longest / step) * step,
  step,
  labels: Math.max(
    0,
    ...references.flatMap(r => r.curves.map(c => c.label.length))
  )
};

// The room state in words, for those who cannot make out the model.
function described(state) {
  const { absorptive, reflective, fault } = state.panels;
  const set = absorptive.length + reflective.length;
  const { installed, drawn_pct } = state.curtains;
  const hanging = Object.keys(installed).filter(id => installed[id]);
  return [
    `Moving wall ${state.wall.position_m} m from the entrance wall.`,
    `${absorptive.length} of ${set} panels absorptive${
      fault.length ? `, ${fault.length} behind the wall or not known` : ''
    }.`,
    hanging.length
      ? `Curtains drawn: ${hanging.map(id => `${id} ${drawn_pct[id]}%`).join(', ')}.`
      : 'Curtains taken down.'
  ].join(' ');
}

// The applet: the measured configurations of the room on a map, with a button
// for each one that has a title, and for the one chosen the room as it was,
// beside the reverberation time measured in it. Choosing another moves the
// wall and the curtains there, and the curve with them. The
// menu under the chart draws the curves of one reference behind the room's,
// to begin with the first on offer. A notice from options.yaml, if there is
// one, stands above it all.
export default function Applet() {
  const [chosen, setChosen] = useState(0);
  const [compared, setCompared] = useState(references.length ? '0' : '');
  const reference = references[compared];
  const name = useId();
  const option = options[chosen];
  const { state, result } = option;
  const title = option.title ?? named(option);
  const drawn = useGlide(
    useMemo(() => configuration(state), [state]),
    between
  );

  return (
    <>
      {list.notice && (
        <p className="var-reverberation__notice" role="note">
          {list.notice}
        </p>
      )}
      <div
        className="var-reverberation__options"
        role="radiogroup"
        aria-label="Named configurations"
      >
        {options.map(
          (o, i) =>
            o.title && (
              <label key={o.title} className="var-reverberation__option">
                <input
                  type="radio"
                  name={name}
                  checked={i === chosen}
                  onChange={() => setChosen(i)}
                />
                <span>{o.title}</span>
              </label>
            )
        )}
      </div>
      <ConfigurationMap
        options={options}
        chosen={chosen}
        onChoose={setChosen}
      />
      <p className="var-reverberation__chosen" aria-live="polite">
        {named(option)}. Reverberation time at mid frequencies, the mean of the
        500 Hz and 1 kHz octave bands: {option.mid.toFixed(2)} s.
      </p>
      <div className="var-reverberation__panes">
        <figure>
          <div
            className="var-reverberation__view"
            role="img"
            aria-label={`The room in the configuration ${title}`}
          >
            <RoomModel state={drawn} />
          </div>
          <figcaption>{described(state)} Drag to turn the model.</figcaption>
        </figure>
        <figure>
          <Chart
            result={result}
            reference={reference}
            scale={scale}
            label={`Reverberation time against frequency, ${title}`}
          />
          {references.length > 0 && (
            <label className="var-reverberation__compare">
              Compare with{' '}
              <select
                value={compared}
                onChange={event => setCompared(event.target.value)}
              >
                <option value="">Nothing</option>
                {references.map((r, i) => (
                  <option key={r.name} value={i}>
                    {r.name}, {r.source}
                  </option>
                ))}
              </select>
            </label>
          )}
          <figcaption>
            {result.quantity} in {result.bands} bands
            {result.standard && `, ${result.standard}`}
            {result.accuracy && `, ${result.accuracy} accuracy`}.
            {result.spread && ` Shaded: ${result.spread_type}.`}
            {reference && (
              <>
                {' '}
                Grey: {reference.summary}. Source:{' '}
                <a
                  href={`https://doi.org/${reference.doi}`}
                  title={reference.citation}
                >
                  {reference.source}
                </a>
                .
              </>
            )}
          </figcaption>
          <details className="var-reverberation__values">
            <summary>Values</summary>
            <table>
              <thead>
                <tr>
                  <th scope="col">Frequency (Hz)</th>
                  <th scope="col">
                    {result.quantity} ({result.unit})
                  </th>
                  {result.spread && <th scope="col">Spread ({result.unit})</th>}
                </tr>
              </thead>
              <tbody>
                {result.frequency_hz.map((f, i) => (
                  <tr key={f}>
                    <td>{f}</td>
                    <td>{result.value[i].toFixed(2)}</td>
                    {result.spread && <td>{result.spread[i].toFixed(2)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </figure>
      </div>
    </>
  );
}
