const STORAGE_KEY = 'marcador-basket-v1';
const initialState = () => ({ period: 1, scores: { san: 0, otros: 0 }, history: { san: [], otros: [] } });

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Number.isInteger(saved.period) || saved.period < 1 || saved.period > 6) return initialState();
    for (const team of ['san', 'otros']) {
      if (!Number.isSafeInteger(saved.scores?.[team]) || saved.scores[team] < 0 ||
          !Array.isArray(saved.history?.[team]) ||
          !saved.history[team].every(n => [1, 2, 3].includes(n)) ||
          saved.history[team].reduce((a, b) => a + b, 0) !== saved.scores[team]) return initialState();
    }
    return saved;
  } catch { return initialState(); }
}

let state = loadState();

function render() {
  document.getElementById('period-number').textContent = state.period;
  document.getElementById('score-san').textContent = state.scores.san;
  document.getElementById('score-otros').textContent = state.scores.otros;
  document.getElementById('previous-period').disabled = state.period === 1;
  document.getElementById('next-period').disabled = state.period === 6;
  for (const team of ['san', 'otros']) {
    document.querySelector(`[data-undo="${team}"]`).disabled = state.history[team].length === 0;
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* El marcador sigue funcionando aunque el navegador no permita guardar. */ }
}

document.querySelectorAll('[data-points]').forEach(button => {
  button.addEventListener('click', () => {
    const team = button.dataset.team;
    const points = Number(button.dataset.points);
    state.scores[team] += points;
    state.history[team].push(points);
    render();
  });
});

document.querySelectorAll('[data-undo]').forEach(button => {
  button.addEventListener('click', () => {
    const team = button.dataset.undo;
    const points = state.history[team].pop();
    if (points !== undefined) state.scores[team] -= points;
    render();
  });
});

document.getElementById('previous-period').addEventListener('click', () => {
  state.period = Math.max(1, state.period - 1);
  render();
});
document.getElementById('next-period').addEventListener('click', () => {
  state.period = Math.min(6, state.period + 1);
  render();
});
document.getElementById('reset').addEventListener('click', () => {
  if (confirm('¿Reiniciar el partido? Se borrarán todos los puntos.')) {
    state = initialState();
    render();
  }
});
render();
