import { useEffect, useId, useRef, useState } from 'react';
import useGlide from './useGlide.js';

// The centre frequencies of the octave bands, which label the axis whatever
// bands a result is in.
const OCTAVES = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const MARGIN = { top: 32, right: 14, bottom: 44, left: 34 };

// The room kept at the right for the labels of a reference's curves, and the
// least distance between two of those labels.
const LABELS = 52;
const APART = 13;

const tick = f => (f < 1000 ? `${f}` : `${f / 1000}k`);
const hertz = f => (f < 1000 ? `${f} Hz` : `${f / 1000} kHz`);
const seconds = v => v.toFixed(2);

// The size of an element in pixels, kept up as it changes, so that the chart is
// drawn at the size it is shown and its text is never scaled.
function useSize() {
  const ref = useRef(null);
  const [size, setSize] = useState(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      })
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}

// The result part of the way from one to another, t running from 0 to 1, for
// the curve to glide. There is nothing between results in different bands, so
// then it is the one it is going to.
function between(from, to, t) {
  if (from.frequency_hz.join() !== to.frequency_hz.join()) return to;
  const part = key =>
    to[key]?.map((v, i) => {
      const u = from[key]?.[i] ?? v;
      return u + (v - u) * t;
    });
  return { ...to, value: part('value'), spread: part('spread') };
}

// A result's values against frequency, on a logarithmic axis: a line through
// the bands and, around it, a wash as wide as the spread either side. `scale`
// is the same for every result on offer (see Applet), so choosing another moves
// the curve and not the axes. Pointing at the chart reads out the nearest band,
// and so do the arrow keys once the chart has the focus. When the result
// becomes another, the curve glides to it.
//
// `reference`, when given, is a set of curves from the literature, drawn in
// grey behind the result's and cut off at the edges of the plot, each with its
// label where it leaves at the right.
export default function Chart({ result: chosen, reference, scale, label }) {
  const result = useGlide(chosen, between);
  const [ref, size] = useSize();
  const [active, setActive] = useState(null);
  const plot = useId();

  const width = size?.width ?? 0;
  const height = size?.height ?? 0;
  const right = MARGIN.right + (scale.labels ? LABELS : 0);
  const lowest = Math.log2(scale.lowest) - 1 / 3;
  const highest = Math.log2(scale.highest) + 1 / 3;
  const x = f =>
    MARGIN.left +
    ((Math.log2(f) - lowest) / (highest - lowest)) *
      (width - MARGIN.left - right);
  const y = v =>
    height -
    MARGIN.bottom -
    (v / scale.top) * (height - MARGIN.top - MARGIN.bottom);

  const points = result.frequency_hz.map((f, i) => ({
    f,
    value: result.value[i],
    spread: result.spread?.[i] ?? 0,
    x: x(f),
    y: y(result.value[i])
  }));
  const line = points.map(p => `${p.x},${p.y}`).join(' L');
  const wash = [
    ...points.map(p => `${p.x},${y(p.value + p.spread)}`),
    ...points.toReversed().map(p => `${p.x},${y(p.value - p.spread)}`)
  ].join(' L');
  const levels = [];
  for (let v = 0; v <= scale.top + 1e-9; v += scale.step) levels.push(v);
  const point = points[active];

  // A reference's curves, and for each the height of its label: that of the
  // curve where it leaves the plot, found between the two bands either side of
  // the edge, or where the curve ends if that is sooner. Labels that would
  // touch are moved down, the highest staying where it is.
  const bands = reference?.frequency_hz.map(Math.log2) ?? [];
  const beyond = bands.findIndex(band => band >= highest);
  const curves = (reference?.curves ?? []).map(curve => {
    const last = beyond < 0 ? bands.length - 1 : Math.max(beyond, 1);
    const share =
      beyond < 0
        ? 1
        : (highest - bands[last - 1]) / (bands[last] - bands[last - 1]);
    const leaving =
      curve.value[last - 1] +
      (curve.value[last] - curve.value[last - 1]) * share;
    return {
      label: curve.label,
      line: curve.value
        .map((v, i) => `${x(reference.frequency_hz[i])},${y(v)}`)
        .join(' L'),
      at: y(leaving)
    };
  });
  curves
    .toSorted((a, b) => a.at - b.at)
    .forEach((curve, i, sorted) => {
      if (i) curve.at = Math.max(curve.at, sorted[i - 1].at + APART);
    });

  // The readout sits above its point, clear of the curve, and moves aside or
  // below where the edge of the chart leaves it no room.
  const across =
    point?.x < 72 ? '0%' : point?.x > width - 72 ? '-100%' : '-50%';
  const down =
    point && y(point.value + point.spread) < 64 ? '14px' : 'calc(-100% - 14px)';

  const nearest = event => {
    const at = event.clientX - ref.current.getBoundingClientRect().left;
    const distances = points.map(p => Math.abs(p.x - at));
    setActive(distances.indexOf(Math.min(...distances)));
  };
  const step = event => {
    const by = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!by) return;
    event.preventDefault();
    setActive(Math.min(points.length - 1, Math.max(0, (active ?? 0) + by)));
  };

  return (
    <div
      ref={ref}
      className="var-reverberation__view var-reverberation__plot"
      role="group"
      aria-label={`${label}. The arrow keys read out each band.`}
      tabIndex={0}
      onPointerMove={nearest}
      onPointerDown={nearest}
      onPointerLeave={() => setActive(null)}
      onFocus={() => setActive(active ?? 0)}
      onBlur={() => setActive(null)}
      onKeyDown={step}
    >
      {size && (
        <svg width={width} height={height} aria-hidden="true">
          <text x={0} y={14}>
            Reverberation time (s)
          </text>
          {levels.map(v => (
            <g key={v}>
              <line
                className={v === 0 ? 'var-reverberation__base' : undefined}
                x1={MARGIN.left}
                x2={width - right}
                y1={y(v)}
                y2={y(v)}
              />
              <text x={MARGIN.left - 8} y={y(v)} dy="0.32em" textAnchor="end">
                {v.toFixed(1)}
              </text>
            </g>
          ))}
          {OCTAVES.filter(
            f => Math.log2(f) > lowest && Math.log2(f) < highest
          ).map(f => (
            <text
              key={f}
              x={x(f)}
              y={height - MARGIN.bottom + 18}
              textAnchor="middle"
            >
              {tick(f)}
            </text>
          ))}
          <text
            x={(MARGIN.left + width - right) / 2}
            y={height - 6}
            textAnchor="middle"
          >
            Frequency (Hz)
          </text>
          <clipPath id={plot}>
            <rect
              x={MARGIN.left}
              width={Math.max(0, width - MARGIN.left - right)}
              height={Math.max(0, height - MARGIN.bottom)}
            />
          </clipPath>
          {curves.map(curve => (
            <g key={curve.label}>
              <path
                className="var-reverberation__reference"
                clipPath={`url(#${plot})`}
                d={`M${curve.line}`}
              />
              <text x={width - right + 6} y={curve.at} dy="0.32em">
                {curve.label}
              </text>
            </g>
          ))}
          {point && (
            <line
              className="var-reverberation__crosshair"
              x1={point.x}
              x2={point.x}
              y1={MARGIN.top}
              y2={height - MARGIN.bottom}
            />
          )}
          <path className="var-reverberation__wash" d={`M${wash} Z`} />
          <path className="var-reverberation__curve" d={`M${line}`} />
          {points.map((p, i) => (
            <circle
              key={p.f}
              className="var-reverberation__dot"
              cx={p.x}
              cy={p.y}
              r={i === active ? 5.5 : 4}
            />
          ))}
        </svg>
      )}
      <div role="status">
        {point && (
          <div
            className="var-reverberation__readout"
            style={{
              left: point.x,
              top: point.y,
              transform: `translate(${across}, ${down})`
            }}
          >
            <strong>
              {seconds(point.value)} s
              {result.spread && <span> ± {seconds(point.spread)}</span>}
            </strong>
            {hertz(point.f)}
          </div>
        )}
      </div>
    </div>
  );
}
