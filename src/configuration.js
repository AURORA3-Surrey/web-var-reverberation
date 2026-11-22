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
