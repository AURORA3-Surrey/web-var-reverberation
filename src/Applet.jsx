import { useId, useMemo, useState } from 'react';
import { RoomModel } from 'lib-var-viewer-js';
import Chart from './Chart.jsx';
import { between, configuration } from './configuration.js';
import { options, SAMPLE } from './sets.js';
import useGlide from './useGlide.js';

// One scale for every option, so that choosing another moves the curve and not
// the axes: the bands they cover between them, and the longest time any of them
// reaches, rounded up to a round number.
const results = options.map(o => o.result);
const frequencies = results.flatMap(r => r.frequency_hz);
const longest = Math.max(
  ...results.flatMap(r => r.value.map((v, i) => v + (r.spread?.[i] ?? 0)))
);
const step = longest > 2 ? 1 : longest > 1 ? 0.5 : 0.2;
const scale = {
  lowest: Math.min(...frequencies),
  highest: Math.max(...frequencies),
  top: Math.ceil(longest / step) * step,
  step
};

// The room state in words, for those who cannot make out the model.
function described(state) {
  const { absorptive, reflective, fault } = state.panels;
  const { installed, drawn_pct } = state.curtains;
  const hanging = Object.keys(installed).filter(id => installed[id]);
  return [
    `Moving wall ${state.wall.position_m} m from the entrance wall.`,
    `${absorptive.length} of ${absorptive.length + reflective.length + fault.length} panels absorptive.`,
    hanging.length
      ? `Curtains drawn: ${hanging.map(id => `${id} ${drawn_pct[id]}%`).join(', ')}.`
      : 'Curtains taken down.'
  ].join(' ');
}

// The applet: a list of configurations of the room, and for the one chosen the
// room as it was, beside the reverberation time measured in it. Choosing
// another moves the wall and the curtains there, and the curve with them.
export default function Applet() {
  const [chosen, setChosen] = useState(0);
  const name = useId();
  const { title, state, result } = options[chosen];
  const drawn = useGlide(
    useMemo(() => configuration(state), [state]),
    between
  );

  return (
    <>
      {SAMPLE && (
        <p className="var-reverberation__notice">
          Sample data: these values are invented, not measured.
        </p>
      )}
      <div
        className="var-reverberation__options"
        role="radiogroup"
        aria-label="Configuration"
      >
        {options.map((option, i) => (
          <label key={option.title} className="var-reverberation__option">
            <input
              type="radio"
              name={name}
              checked={i === chosen}
              onChange={() => setChosen(i)}
            />
            <span>{option.title}</span>
          </label>
        ))}
      </div>
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
            scale={scale}
            label={`Reverberation time against frequency, ${title}`}
          />
          <figcaption>
            {result.quantity} in {result.bands} bands, {result.standard}
            {result.accuracy && `, ${result.accuracy} accuracy`}.
            {result.spread && ` Shaded: ${result.spread_type}.`}
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
