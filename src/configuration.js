// The configuration the model draws, from the room state of a set's sidecar
// (`var-state/1`). An absorptive panel is an open one. The model has no third
// state, so a panel listed under `fault` is left out, which it draws closed.
// Its configuration also keeps the curtains as all or none: they are left out
// only when none is installed, and one taken down while others hang is drawn
// parked. The wall's position is the same distance in both, in metres there
// and in millimetres here.
export function configuration(state) {
  const panels = {};
  for (const number of state.panels.absorptive) panels[number] = 'open';
  for (const number of state.panels.reflective) panels[number] = 'closed';

  const { installed, drawn_pct } = state.curtains;
  const hanging = Object.keys(installed).filter(id => installed[id]);

  return {
    panels,
    curtains: hanging.length
      ? Object.fromEntries(hanging.map(id => [id, drawn_pct[id]]))
      : null,
    wallPosition: Math.round(state.wall.position_m * 1000)
  };
}

// The configuration part of the way from one to another, t running from 0 to
// 1: the wall and the curtains are where they would be on the way. The panels
// are those of the one it is going to, since the model fades them itself. So
// are the curtains when one of the two has none, as there is nothing between
// hanging and taken down.
export function between(from, to, t) {
  const part = (a, b) => a + (b - a) * t;
  return {
    panels: to.panels,
    curtains:
      from.curtains && to.curtains
        ? Object.fromEntries(
            Object.keys(to.curtains).map(id => [
              id,
              part(from.curtains[id] ?? 0, to.curtains[id])
            ])
          )
        : to.curtains,
    wallPosition: part(from.wallPosition, to.wallPosition)
  };
}
