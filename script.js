const STORAGE_KEY = 'marcador-basket-v2';
const OLD_KEY = 'marcador-basket-v1';
const teams = ['san', 'otros'];
const initialState = () => ({ period: 1, periods: Array.from({length: 6}, () => ({ san: [], otros: [] })) });

function valid(data) {
  return data && Number.isInteger(data.period) && data.period >= 1 && data.period <= 6 &&
    Array.isArray(data.periods) && data.periods.length === 6 &&
    data.periods.every(p => teams.every(t => Array.isArray(p?.[t]) && p[t].every(n => [1,2,3].includes(n))));
}
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (valid(saved)) return saved;
    // Migración: la versión 1 no registraba en qué periodo se anotó cada punto.
    // Conservamos todos los puntos y los atribuimos al periodo activo.
    const old = JSON.parse(localStorage.getItem(OLD_KEY));
    if (old && Number.isInteger(old.period) && old.period >= 1 && old.period <= 6 && old.history &&
      teams.every(t => Array.isArray(old.history[t]) && old.history[t].every(n => [1,2,3].includes(n)))) {
      const migrated = initialState();
      migrated.period = old.period;
      for (const t of teams) migrated.periods[old.period - 1][t] = [...old.history[t]];
      return migrated;
    }
  } catch { /* Se inicia un marcador nuevo si los datos guardados son inválidos. */ }
  return initialState();
}
let state = loadState();
const points = (period, team) => state.periods[period][team].reduce((sum,n) => sum+n, 0);
const total = team => state.periods.reduce((sum,_,i) => sum+points(i,team), 0);

function render() {
  document.getElementById('period-number').textContent = state.period;
  for (const team of teams) {
    document.getElementById('score-' + team).textContent = total(team);
    document.getElementById('total-' + team).textContent = total(team);
    document.querySelector(`[data-undo="${team}"]`).disabled = state.periods[state.period-1][team].length === 0;
  }
  document.getElementById('previous-period').disabled = state.period === 1;
  document.getElementById('next-period').disabled = state.period === 6;
  const tbody = document.getElementById('period-rows');
  tbody.replaceChildren();
  for (let i = 0; i < 6; i++) {
    const tr = document.createElement('tr');
    if (i === state.period-1) tr.className = 'selected';
    const th = document.createElement('th'); th.scope = 'row'; th.textContent = i+1;
    const san = document.createElement('td'); san.textContent = points(i,'san');
    const otros = document.createElement('td'); otros.textContent = points(i,'otros');
    tr.append(th,san,otros);
    tr.title = `Seleccionar periodo ${i+1}`;
    tr.addEventListener('click', () => { state.period = i+1; render(); });
    tbody.append(tr);
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* La app funciona incluso sin almacenamiento. */ }
}
document.querySelectorAll('[data-points]').forEach(button => {
  button.addEventListener('click', () => {
    state.periods[state.period-1][button.dataset.team].push(Number(button.dataset.points));
    render();
  });
});
document.querySelectorAll('[data-undo]').forEach(button => {
  button.addEventListener('click', () => {
    state.periods[state.period-1][button.dataset.undo].pop();
    render();
  });
});
document.getElementById('previous-period').addEventListener('click', () => { state.period = Math.max(1,state.period-1); render(); });
document.getElementById('next-period').addEventListener('click', () => { state.period = Math.min(6,state.period+1); render(); });
document.getElementById('reset').addEventListener('click', () => {
  if (confirm('¿Reiniciar el partido? Se borrarán los puntos de los seis periodos.')) { state = initialState(); render(); }
});
render();
