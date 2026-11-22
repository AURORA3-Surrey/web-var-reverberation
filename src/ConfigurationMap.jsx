import { useState } from 'react';
import useSize from './useSize.js';

const MARGIN = { top: 12, right: 16, bottom: 40, left: 64 };

// An option in words: the room's volume, the share of its panels open and
// whether the curtains hang.
export const named = option =>
  `${option.volume.toFixed(1)} m³, ${Math.round(option.open * 100)}% of panels open${
    option.curtains ? ', curtains hung' : ''
  }`;

// The shade of a mark, darker the larger the share of panels open (0 to 100).
export const shade = percent =>
  `color-mix(in srgb, var(--var-reverberation-open) ${percent}%, var(--var-reverberation-shut))`;

const row = option => option.volume.toFixed(1);

// The measured configurations as a map: the room's volume up the side and the
// reverberation time at mid frequencies, the mean of the 500 Hz and 1 kHz
// bands, along the bottom. Each configuration is
// a mark, shaded by the share of its panels open and a diamond where the
// curtains hang. A click or a tap chooses the nearest mark, and so do the arrow
// keys once the map has the focus; `onChoose` is given its place in `options`.
export default function ConfigurationMap({ options, chosen, onChoose }) {
  const [ref, size] = useSize();
  const [active, setActive] = useState(null);

  const width = size?.width ?? 0;
  const height = size?.height ?? 0;
  const volumes = [...new Set(options.map(row))].map(Number);
  const least = Math.min(...volumes);
  const most = Math.max(...volumes);
  const margin = (most - least) * 0.08 || 1;
  const step = width < 480 ? 0.5 : 0.25;
  const longest = Math.ceil(Math.max(...options.map(o => o.mid)) / 0.25) * 0.25;
  const x = t =>
    MARGIN.left + (t / longest) * (width - MARGIN.left - MARGIN.right);
  const y = v =>
    MARGIN.top +
    ((most + margin - v) / (most - least + 2 * margin)) *
      (height - MARGIN.top - MARGIN.bottom);
  const times = [];
  for (let t = 0; t <= longest + 1e-9; t += step) times.push(t);
  const marks = options.map((option, i) => ({
    ...option,
    i,
    x: x(option.mid),
    y: y(option.volume)
  }));
  // Marks that are close lie over one another, each where it belongs, and the
  // one chosen is drawn last, so that it is the one in front.
  const drawn = [...marks].sort((a, b) => (a.i === chosen) - (b.i === chosen));

  const nearest = event => {
    const box = ref.current.getBoundingClientRect();
    const away = marks.map(m =>
      Math.hypot(
        m.x - (event.clientX - box.left),
        m.y - (event.clientY - box.top)
      )
    );
    return away.indexOf(Math.min(...away));
  };
  // Left and right go along the row of one volume; up and down go to the mark
  // of the next volume that is nearest in reverberation time.
  const move = event => {
    const here = marks[chosen];
    const closest = candidates =>
      candidates.sort(
        (a, b) => Math.abs(a.x - here.x) - Math.abs(b.x - here.x)
      )[0];
    const along = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    const across = { ArrowUp: 1, ArrowDown: -1 }[event.key];
    let next;
    if (along) {
      next = closest(
        marks.filter(m => row(m) === row(here) && (m.x - here.x) * along > 0)
      );
    } else if (across) {
      const rows = [...volumes].sort((a, b) => a - b);
      const beside = rows[rows.indexOf(Number(row(here))) + across];
      next = closest(marks.filter(m => Number(row(m)) === beside));
    } else {
      return;
    }
    event.preventDefault();
    if (next) onChoose(next.i);
  };
  const hovered = marks[active];

  return (
    <>
      <div
        ref={ref}
        className="var-reverberation__map var-reverberation__plot"
        role="group"
        aria-label="The configurations by room volume and reverberation time. The arrow keys move between them."
        tabIndex={0}
        onPointerMove={event => setActive(nearest(event))}
        onPointerLeave={() => setActive(null)}
        onClick={event => onChoose(nearest(event))}
        onKeyDown={move}
      >
        {size && (
          <svg width={width} height={height} aria-hidden="true">
            {times.map(t => (
              <g key={t}>
                <line
                  x1={x(t)}
                  x2={x(t)}
                  y1={MARGIN.top}
                  y2={height - MARGIN.bottom}
                />
                <text
                  x={x(t)}
                  y={height - MARGIN.bottom + 16}
                  textAnchor="middle"
                >
                  {t.toFixed(2)}
                </text>
              </g>
            ))}
            <text
              x={(MARGIN.left + width - MARGIN.right) / 2}
              y={height - 6}
              textAnchor="middle"
            >
              {width < 480
                ? 'Mean RT, 500 Hz and 1 kHz (s)'
                : 'Mean reverberation time, 500 Hz and 1 kHz (s)'}
            </text>
            {volumes.map(v => (
              <g key={v}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={y(v)}
                  y2={y(v)}
                />
                <text x={MARGIN.left - 8} y={y(v)} dy="0.32em" textAnchor="end">
                  {v.toFixed(1)} m³
                </text>
              </g>
            ))}
            {drawn.map(m =>
              m.curtains ? (
                <rect
                  key={m.i}
                  className="var-reverberation__mark"
                  x={-5}
                  y={-5}
                  width={10}
                  height={10}
                  transform={`translate(${m.x} ${m.y}) rotate(45)`}
                  style={{ fill: shade(m.open * 100) }}
                />
              ) : (
                <circle
                  key={m.i}
                  className="var-reverberation__mark"
                  cx={m.x}
                  cy={m.y}
                  r={m.i === active ? 7 : 5.5}
                  style={{ fill: shade(m.open * 100) }}
                />
              )
            )}
            <circle
              className="var-reverberation__ring"
              cx={marks[chosen].x}
              cy={marks[chosen].y}
              r={11}
            />
          </svg>
        )}
        <div role="status">
          {hovered && (
            <div
              className="var-reverberation__readout"
              style={{
                left: hovered.x,
                top: hovered.y,
                transform: `translate(${
                  hovered.x < 130
                    ? '0%'
                    : hovered.x > width - 130
                      ? '-100%'
                      : '-50%'
                }, ${hovered.y < 64 ? '16px' : 'calc(-100% - 16px)'})`
              }}
            >
              <strong>{hovered.mid.toFixed(2)} s</strong>
              {named(hovered)}
            </div>
          )}
        </div>
      </div>
      <p className="var-reverberation__legend">
        Panels open
        {[0, 25, 50, 75, 100].map(percent => (
          <span key={percent}>
            <i style={{ background: shade(percent) }} />
            {percent}%
          </span>
        ))}
        <span>
          <i className="var-reverberation__diamond" />
          curtains hung
        </span>
      </p>
    </>
  );
}
