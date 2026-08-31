(() => {
  const canvas = document.querySelector('[data-line-canvas]'); const ctx = canvas.getContext('2d');
  const state = { m: 1, b: 1, dragging: false, initialM: 1 };
  const mInput = document.querySelector('[data-m]'); const bInput = document.querySelector('[data-b]');
  const format = (value) => Number(value).toFixed(1).replace('.', ',');
  const resize = () => { const rect = canvas.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(); };
  const metrics = () => { const w = canvas.clientWidth; const h = canvas.clientHeight; const pad = 36; return { w, h, pad, sx: (w - pad * 2) / 12, sy: (h - pad * 2) / 12, ox: w / 2, oy: h / 2 }; };
  const pt = (x, y) => { const m = metrics(); return { x: m.ox + x * m.sx, y: m.oy - y * m.sy }; };
  const draw = () => {
    const a = metrics(); ctx.clearRect(0, 0, a.w, a.h); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, a.w, a.h); ctx.strokeStyle = '#e1e7f2'; ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i += 1) { const x = pt(i, 0).x; const y = pt(0, i).y; ctx.beginPath(); ctx.moveTo(x, a.pad); ctx.lineTo(x, a.h - a.pad); ctx.stroke(); ctx.beginPath(); ctx.moveTo(a.pad, y); ctx.lineTo(a.w - a.pad, y); ctx.stroke(); }
    ctx.strokeStyle = '#17213d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.pad, a.oy); ctx.lineTo(a.w - a.pad, a.oy); ctx.moveTo(a.ox, a.pad); ctx.lineTo(a.ox, a.h - a.pad); ctx.stroke();
    ctx.fillStyle = '#646c82'; ctx.font = '10px Inter'; ctx.textAlign = 'center'; for (let i = -6; i <= 6; i += 1) { if (i) { ctx.fillText(i, pt(i, 0).x, a.oy + 16); ctx.textAlign = 'right'; ctx.fillText(i, a.ox - 7, pt(0, i).y + 3); ctx.textAlign = 'center'; } }
    const p1 = pt(-6, state.m * -6 + state.b); const p2 = pt(6, state.m * 6 + state.b); ctx.save(); ctx.beginPath(); ctx.rect(a.pad, a.pad, a.w - a.pad * 2, a.h - a.pad * 2); ctx.clip(); ctx.strokeStyle = '#0b5fe8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.restore();
    const intercept = pt(0, state.b); ctx.fillStyle = '#0f9b8e'; ctx.beginPath(); ctx.arc(intercept.x, intercept.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#0f776e'; ctx.font = '700 11px Inter'; ctx.textAlign = 'left'; ctx.fillText(`b = ${format(state.b)}`, intercept.x + 12, intercept.y - 10);
    const x1 = 1; const x2 = 4; const y1 = state.m * x1 + state.b; const y2 = state.m * x2 + state.b; const q1 = pt(x1, y1); const q2 = pt(x2, y2); ctx.setLineDash([5, 4]); ctx.strokeStyle = '#f29c13'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#f29c13'; ctx.font = '700 11px Inter'; ctx.textAlign = 'center'; ctx.fillText('3', (q1.x + q2.x) / 2, q1.y + 16); ctx.fillText(format(state.m * 3), q2.x + 16, (q1.y + q2.y) / 2);
    ctx.fillStyle = '#0b5fe8'; ctx.beginPath(); ctx.arc(q2.x, q2.y, 10, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#0b5fe8'; ctx.font = '700 12px Inter'; ctx.textAlign = 'left'; ctx.fillText(`y = ${format(state.m)}x ${state.b < 0 ? '−' : '+'} ${format(Math.abs(state.b))}`, a.pad + 8, a.pad + 17);
  };
  const sync = () => {
    state.m = Number(mInput.value); state.b = Number(bInput.value); document.querySelector('[data-m-output]').textContent = format(state.m); document.querySelector('[data-b-output]').textContent = format(state.b);
    document.querySelector('[data-m-meaning]').textContent = state.m > 0 ? 'reta crescente' : state.m < 0 ? 'reta decrescente' : 'reta horizontal';
    document.querySelector('[data-initial-value]').textContent = `R$ ${format(state.b)}`; document.querySelector('[data-km-value]').textContent = `R$ ${format(state.m)}/km`; draw();
  };
  mInput.addEventListener('input', sync); bInput.addEventListener('input', sync);
  document.querySelectorAll('[data-change]').forEach((button) => button.addEventListener('click', () => { const input = button.dataset.change === 'm' ? mInput : bInput; input.value = String(Math.max(Number(input.min), Math.min(Number(input.max), Number(input.value) + Number(button.dataset.delta)))); sync(); }));
  canvas.addEventListener('pointerdown', (event) => { const rect = canvas.getBoundingClientRect(); const a = metrics(); const q = pt(4, state.m * 4 + state.b); if (Math.hypot(event.clientX - rect.left - q.x, event.clientY - rect.top - q.y) < 28) { state.dragging = true; canvas.setPointerCapture(event.pointerId); } });
  canvas.addEventListener('pointermove', (event) => { if (!state.dragging) return; const rect = canvas.getBoundingClientRect(); const a = metrics(); const y = (a.oy - (event.clientY - rect.top)) / a.sy; mInput.value = String(Math.max(-3, Math.min(3, Math.round(((y - state.b) / 4) * 2) / 2))); sync(); });
  const release = () => { state.dragging = false; }; canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  document.querySelector('[data-test-hypothesis]').addEventListener('click', () => { const selected = document.querySelector('input[name="prediction"]:checked'); const feedback = document.querySelector('[data-feedback]'); if (!selected) { feedback.className = 'feedback error'; feedback.textContent = 'Escolha uma previsão antes de testar.'; return; } if (selected.value !== 'steeper') { feedback.className = 'feedback error'; feedback.textContent = 'Compare a variação vertical com a horizontal: aumentar m deixa a reta mais inclinada.'; return; } state.initialM = state.m; mInput.value = String(Math.min(3, state.m + 1)); sync(); feedback.className = 'feedback success'; feedback.textContent = 'Hipótese confirmada: ao aumentar m, a variação vertical cresce e a reta fica mais inclinada.'; window.OminiMath.complete('reta-em-movimento', 'Reta em Movimento concluída.'); });
  new ResizeObserver(resize).observe(canvas); sync();
})();
