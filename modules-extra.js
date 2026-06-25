// ═══════════════════════════════════════════════
// EXTRA 6 MODULES + GRAPH UTILITIES
// EconLab BD — Upgrade Pack
// ═══════════════════════════════════════════════

// ── CHART EXPORT (PNG) ──
function exportChart(canvasId, filename) {
  const canvas = document.getElementById(canvasId);
  const link = document.createElement('a');
  link.download = filename + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ── TYPED INPUT HELPER ──
function setupTypedInput(rangeId, textId, min, max, callback) {
  const range = document.getElementById(rangeId);
  const text = document.getElementById(textId);
  if (!range || !text) return;
  text.addEventListener('input', () => {
    let val = parseFloat(text.value);
    if (isNaN(val)) return;
    val = Math.min(max, Math.max(min, val));
    range.value = val;
    callback();
  });
  range.addEventListener('input', () => {
    text.value = range.value;
    callback();
  });
}

// ── SCENARIO COMPARE STORE ──
const scenarioStore = {};
function saveScenario(moduleId, label, data) {
  if (!scenarioStore[moduleId]) scenarioStore[moduleId] = {};
  scenarioStore[moduleId][label] = data;
}

// ═══════════════════════
// MODULE 11: BUSINESS CYCLE
// ═══════════════════════
let bcC, bcTime = 0, bcTimer = null;
function bcInit() {
  bcC = new Chart(document.getElementById('bcChart'), {
    type: 'line',
    data: { labels: [], datasets: [
      { label: 'Real GDP', data: [], borderColor: '#4F8EF7', backgroundColor: 'rgba(79,142,247,0.08)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Trend GDP', data: [], borderColor: '#34D399', backgroundColor: 'transparent', borderDash: [6,3], tension: 0.4, pointRadius: 0, borderWidth: 1.5 },
      { label: 'Unemployment', data: [], borderColor: '#F59E0B', backgroundColor: 'transparent', tension: 0.4, pointRadius: 0, borderWidth: 2, yAxisID: 'y2' },
      { label: 'Inflation', data: [], borderColor: '#F472B6', backgroundColor: 'transparent', tension: 0.4, pointRadius: 0, borderWidth: 2, yAxisID: 'y2' }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: true, labels: { color: '#8A94B2', font: { size: 10 }, boxWidth: 10 } }, zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }, pan: { enabled: true, mode: 'x' } } },
      scales: {
        x: { grid: { color: 'rgba(42,48,80,.8)' }, ticks: { color: '#8A94B2', font: { size: 9 }, maxTicksLimit: 12 } },
        y: { title: { display: true, text: 'GDP Index', color: '#8A94B2', font: { size: 10 } }, grid: { color: 'rgba(42,48,80,.8)' }, ticks: { color: '#8A94B2', font: { size: 10 } } },
        y2: { position: 'right', title: { display: true, text: '% Rate', color: '#8A94B2', font: { size: 10 } }, grid: { display: false }, ticks: { color: '#8A94B2', font: { size: 10 } } }
      }
    }
  });
  bcUpdate();
}
function bcUpdate() {
  if (!bcC) return;
  const shock = +document.getElementById('bc-shock').value;
  const policy = +document.getElementById('bc-policy').value;
  const duration = +document.getElementById('bc-dur').value;
  document.getElementById('bc-shock-val').textContent = shock;
  document.getElementById('bc-policy-val').textContent = policy;
  document.getElementById('bc-dur-val').textContent = duration;

  const labels = [], gdp = [], trend = [], unemp = [], infl = [];
  let gdpLevel = 100, trend_g = 2.5;
  for (let t = 0; t <= 40; t++) {
    labels.push('Q' + t);
    trend.push(+(100 * Math.pow(1 + trend_g / 400, t)).toFixed(2));
    const cycle = Math.sin(t * Math.PI / (duration / 2)) * shock;
    const policyEffect = t > 4 ? policy * 0.3 : 0;
    gdpLevel = trend[t] + cycle + policyEffect * Math.max(0, t - 4);
    gdp.push(+gdpLevel.toFixed(2));
    const gap = ((gdpLevel - trend[t]) / trend[t]) * 100;
    unemp.push(+(5 - gap * 0.4).toFixed(1));
    infl.push(+(2 + gap * 0.3).toFixed(1));
  }
  bcC.data.labels = labels;
  bcC.data.datasets[0].data = gdp;
  bcC.data.datasets[1].data = trend;
  bcC.data.datasets[2].data = unemp;
  bcC.data.datasets[3].data = infl;
  bcC.update('none');

  const phase = gdp[20] > trend[20] ? '📈 Expansion' : '📉 Recession';
  const gap = ((gdp[20] - trend[20]) / trend[20] * 100).toFixed(1);
  document.getElementById('bc-phase').textContent = phase;
  document.getElementById('bc-gap').textContent = gap + '%';
  document.getElementById('bc-peak').textContent = Math.max(...gdp).toFixed(1);
  document.getElementById('bc-trough').textContent = Math.min(...gdp.slice(1)).toFixed(1);

  let exp = `<strong>${phase}</strong> — Output gap: ${gap}%. `;
  if (shock < -5) exp += 'নেতিবাচক শক অর্থনীতিকে Recession-এ ঠেলে দিচ্ছে।';
  else if (policy > 5) exp += 'Expansionary policy recession-এর গভীরতা কমাচ্ছে।';
  document.getElementById('bc-explain').innerHTML = exp;
}

// ═══════════════════════
// MODULE 12: STOCK MARKET & ASSET BUBBLE
// ═══════════════════════
let smC;
function smInit() {
  smC = new Chart(document.getElementById('smChart'), {
    type: 'line',
    data: { labels: [], datasets: [
      { label: 'Asset Price', data: [], borderColor: '#4F8EF7', backgroundColor: 'rgba(79,142,247,0.06)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Fundamental Value', data: [], borderColor: '#34D399', borderDash: [5,3], tension: 0.3, pointRadius: 0, borderWidth: 1.5, backgroundColor: 'transparent' },
      { label: 'Bubble Premium', data: [], borderColor: '#F472B6', tension: 0.3, pointRadius: 0, borderWidth: 1.5, backgroundColor: 'transparent' }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: true, labels: { color: '#8A94B2', font: { size: 10 }, boxWidth: 10 } } },
      scales: {
        x: { grid: { color: 'rgba(42,48,80,.8)' }, ticks: { color: '#8A94B2', font: { size: 9 }, maxTicksLimit: 12 } },
        y: { title: { display: true, text: 'Price Index', color: '#8A94B2', font: { size: 10 } }, grid: { color: 'rgba(42,48,80,.8)' }, ticks: { color: '#8A94B2', font: { size: 10 } } }
      }
    }
  });
  smUpdate();
}
function smUpdate() {
  if (!smC) return;
  const exub = +document.getElementById('sm-exub').value;
  const ir = +document.getElementById('sm-ir').value;
  const earn = +document.getElementById('sm-earn').value;
  const sentiment = +document.getElementById('sm-sent').value;
  document.getElementById('sm-exub-val').textContent = exub;
  document.getElementById('sm-ir-val').textContent = ir;
  document.getElementById('sm-earn-val').textContent = earn;
  document.getElementById('sm-sent-val').textContent = sentiment;

  const labels = [], prices = [], fundamentals = [], bubblePrem = [];
  let price = 100;
  const fundamental_base = earn * 15 * (1 - ir / 100);
  for (let t = 0; t <= 36; t++) {
    labels.push('M' + t);
    const fund = fundamental_base * (1 + earn / 1000 * t);
    const bubble = exub * sentiment / 100 * Math.sin(t * Math.PI / 18) * (t < 24 ? t / 24 : Math.max(0, 2 - t / 12));
    price = fund + Math.max(0, bubble);
    prices.push(+price.toFixed(1));
    fundamentals.push(+fund.toFixed(1));
    bubblePrem.push(+Math.max(0, bubble).toFixed(1));
  }
  smC.data.labels = labels;
  smC.data.datasets[0].data = prices;
  smC.data.datasets[1].data = fundamentals;
  smC.data.datasets[2].data = bubblePrem;
  smC.update('none');

  const maxPrice = Math.max(...prices);
  const peakPremium = +((maxPrice - fundamentals[prices.indexOf(maxPrice)]) / fundamentals[prices.indexOf(maxPrice)] * 100).toFixed(1);
  const crashRisk = exub > 70 && ir < 3 ? '🔴 High' : exub > 40 ? '🟡 Moderate' : '🟢 Low';

  document.getElementById('sm-maxprice').textContent = maxPrice.toFixed(0);
  document.getElementById('sm-premium').textContent = peakPremium + '%';
  document.getElementById('sm-crash').textContent = crashRisk;
  document.getElementById('sm-pe').textContent = (maxPrice / earn).toFixed(1) + 'x';

  let exp = `Peak price: ${maxPrice.toFixed(0)}, Bubble premium: ${peakPremium}%. `;
  if (exub > 70 && ir < 3) exp += '<strong>বুদবুদ সংকটপূর্ণ পর্যায়ে!</strong> Low interest + irrational exuberance = ক্লাসিক asset bubble।';
  else if (peakPremium > 30) exp += '<strong>Overvaluation সতর্কতা</strong> — দাম মৌলিক মূল্যের অনেক উপরে।';
  document.getElementById('sm-explain').innerHTML = exp;
}

// ═══════════════════════
// MODULE 13: KEYNESIAN CROSS
// ═══════════════════════
let kcC;
function kcInit() {
  kcC = new Chart(document.getElementById('kcChart'), {
    type: 'scatter',
    data: { datasets: [
      { label: 'AE Curve', data: [], showLine: true, borderColor: '#4F8EF7', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, tension: 0 },
      { label: '45° Line', data: [], showLine: true, borderColor: '#34D399', borderDash: [5,3], backgroundColor: 'transparent', pointRadius: 0, borderWidth: 1.5 },
      { label: 'Equilibrium', data: [], pointRadius: 9, pointBackgroundColor: '#F472B6', borderColor: '#F472B6', pointBorderColor: '#fff', pointBorderWidth: 2 }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 200 },
      plugins: { legend: { display: true, labels: { color: '#8A94B2', font: { size: 10 }, boxWidth: 10 } } },
      scales: {
        x: { title: { display: true, text: 'Income (Y)', color: '#8A94B2', font: { size: 11 } }, min: 0, max: 600, grid: { color: 'rgba(42,48,80,.8)' }, ticks: { color: '#8A94B2' } },
        y: { title: { display: true, text: 'Aggregate Expenditure (AE)', color: '#8A94B2', font: { size: 11 } }, min: 0, max: 600, grid: { color: 'rgba(42,48,80,.8)' }, ticks: { color: '#8A94B2' } }
      }
    }
  });
  kcUpdate();
}
function kcUpdate() {
  if (!kcC) return;
  const C0 = +document.getElementById('kc-c0').value;
  const mpc = +document.getElementById('kc-mpc').value / 100;
  const I = +document.getElementById('kc-inv').value;
  const G = +document.getElementById('kc-g').value;
  const X = +document.getElementById('kc-x').value;
  const T = +document.getElementById('kc-t').value;
  document.getElementById('kc-c0-val').textContent = C0;
  document.getElementById('kc-mpc-val').textContent = mpc.toFixed(2);
  document.getElementById('kc-inv-val').textContent = I;
  document.getElementById('kc-g-val').textContent = G;
  document.getElementById('kc-x-val').textContent = X;
  document.getElementById('kc-t-val').textContent = T;

  const aeData = [], line45 = [];
  const mult = 1 / (1 - mpc);
  const autonomousSpending = C0 + I + G + X - mpc * T;
  const eqY = mult * autonomousSpending;

  for (let y = 0; y <= 550; y += 10) {
    const ae = autonomousSpending + mpc * y;
    aeData.push({ x: y, y: +Math.min(600, ae).toFixed(1) });
    line45.push({ x: y, y: y });
  }

  kcC.data.datasets[0].data = aeData;
  kcC.data.datasets[1].data = line45;
  kcC.data.datasets[2].data = [{ x: +eqY.toFixed(1), y: +eqY.toFixed(1) }];
  kcC.update('none');

  const mult_display = mult.toFixed(2);
  document.getElementById('kc-eqy').textContent = eqY.toFixed(0);
  document.getElementById('kc-mult').textContent = mult_display + 'x';
  document.getElementById('kc-cons').textContent = (C0 + mpc * (eqY - T)).toFixed(0);
  document.getElementById('kc-gap').textContent = ((eqY - 400) / 400 * 100).toFixed(1) + '%';

  let exp = `Equilibrium Y* = ${eqY.toFixed(0)}, Multiplier = ${mult_display}x. `;
  if (eqY < 300) exp += '<strong>Recessionary Gap</strong> — Y* পূর্ণ কর্মসংস্থান আউটপুটের নিচে।';
  else if (eqY > 500) exp += '<strong>Inflationary Gap</strong> — অতিরিক্ত ব্যয় মুদ্রাস্ফীতি সৃষ্টি করবে।';
  else exp += 'অর্থনীতি প্রায় পূর্ণ কর্মসংস্থানে।';
  document.getElementById('kc-explain').innerHTML = exp;
}

// ═══════════════════════
// MODULE 14: MUNDELL-FLEMING
// ═══════════════════════
let mfC;
function mfInit() {
  mfC = new Chart(document.getElementById('mfChart'), {
    type: 'scatter',
    data: { datasets: [
      { label: 'IS* Curve', data: [], showLine: true, borderColor: '#4F8EF7', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, tension: 0.3 },
      { label: 'LM* Curve', data: [], showLine: true, borderColor: '#F59E0B', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, tension: 0.3 },
      { label: 'BP Curve', data: [], showLine: true, borderColor: '#F472B6', borderDash: [5,3], backgroundColor: 'transparent', pointRadius: 0, borderWidth: 1.5 },
      { label: 'Equilibrium', data: [], pointRadius: 9, pointBackgroundColor: '#34D399', borderColor: '#34D399', pointBorderColor: '#fff', pointBorderWidth: 2 }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 200 },
      plugins: { legend: { display: true, labels: { color: '#8A94B2', font: { size: 10 }, boxWidth: 10 } } },
      scales: {
        x: { title: { display: true, text: 'Output (Y)', color: '#8A94B2', font: { size: 11 } }, min: 0, max: 200, grid: { color: 'rgba(42,48,80,.8)' }, ticks: { color: '#8A94B2' } },
        y: { title: { display: true, text: 'Exchange Rate (e)', color: '#8A94B2', font: { size: 11 } }, min: 0, max: 15, grid: { color: 'rgba(42,48,80,.8)' }, ticks: { color: '#8A94B2' } }
      }
    }
  });
  mfUpdate();
}
function mfUpdate() {
  if (!mfC) return;
  const G = +document.getElementById('mf-g').value;
  const M = +document.getElementById('mf-m').value;
  const r_world = +document.getElementById('mf-rw').value;
  const capital = +document.getElementById('mf-cap').value;
  const regime = document.getElementById('mf-regime').value;
  document.getElementById('mf-g-val').textContent = G;
  document.getElementById('mf-m-val').textContent = M;
  document.getElementById('mf-rw-val').textContent = r_world;
  document.getElementById('mf-cap-val').textContent = capital;

  const isData = [], lmData = [], bpData = [];
  for (let e = 0.3; e <= 14; e += 0.3) {
    const y_is = G * 1.5 + e * 4 + 40;
    if (y_is >= 0 && y_is <= 200) isData.push({ x: +y_is.toFixed(1), y: +e.toFixed(1) });
    const y_lm = M * 1.2 - r_world * 3 + 20;
    if (y_lm >= 0 && y_lm <= 200) lmData.push({ x: +y_lm.toFixed(1), y: +e.toFixed(1) });
    const y_bp = (r_world + capital * 0.1) * 10 + e * 3;
    if (y_bp >= 0 && y_bp <= 200) bpData.push({ x: +y_bp.toFixed(1), y: +e.toFixed(1) });
  }

  const eqY = M * 1.2 - r_world * 3 + 20;
  const eqE = Math.max(0.5, (eqY - G * 1.5 - 40) / 4);

  mfC.data.datasets[0].data = isData;
  mfC.data.datasets[1].data = lmData;
  mfC.data.datasets[2].data = bpData;
  mfC.data.datasets[3].data = [{ x: +eqY.toFixed(1), y: +eqE.toFixed(1) }];
  mfC.update('none');

  document.getElementById('mf-eqy').textContent = eqY.toFixed(0);
  document.getElementById('mf-eqe').textContent = eqE.toFixed(1);
  document.getElementById('mf-regime-display').textContent = regime === 'fixed' ? 'Fixed ER' : 'Floating ER';
  const fiscalEff = regime === 'fixed' ? 'কার্যকর' : 'অকার্যকর (Crowding out via e)';
  const moneyEff = regime === 'fixed' ? 'অকার্যকর' : 'কার্যকর';
  document.getElementById('mf-fiscal-eff').textContent = 'Fiscal: ' + fiscalEff;
  document.getElementById('mf-money-eff').textContent = 'Monetary: ' + moneyEff;

  let exp = `<strong>${regime === 'fixed' ? 'Fixed Exchange Rate' : 'Floating Exchange Rate'}</strong> regime. Y* = ${eqY.toFixed(0)}, e* = ${eqE.toFixed(1)}. `;
  if (regime === 'fixed') exp += 'Fixed rate-এ fiscal policy কার্যকর কিন্তু monetary policy অকার্যকর।';
  else exp += 'Floating rate-এ monetary policy কার্যকর, fiscal policy currency appreciation-এ নষ্ট হয়।';
  document.getElementById('mf-explain').innerHTML = exp;
}

// ═══════════════════════
// MODULE 15: COST & PRODUCTION
// ═══════════════════════
let cpC;
function cpInit() {
  cpC = new Chart(document.getElementById('cpChart'), {
    type: 'scatter',
    data: { datasets: [
      { label: 'Total Cost (TC)', data: [], showLine: true, borderColor: '#4F8EF7', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, tension: 0.3 },
      { label: 'Variable Cost (VC)', data: [], showLine: true, borderColor: '#F59E0B', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, tension: 0.3 },
      { label: 'Marginal Cost (MC)', data: [], showLine: true, borderColor: '#34D399', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, tension: 0.3, yAxisID: 'y2' },
      { label: 'Average Total Cost (ATC)', data: [], showLine: true, borderColor: '#F472B6', borderDash: [4,3], backgroundColor: 'transparent', pointRadius: 0, borderWidth: 1.5, yAxisID: 'y2' }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 200 },
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: true, labels: { color: '#8A94B2', font: { size: 10 }, boxWidth: 10 } } },
      scales: {
        x: { title: { display: true, text: 'Quantity (Q)', color: '#8A94B2', font: { size: 11 } }, min: 0, max: 100, grid: { color: 'rgba(42,48,80,.8)' }, ticks: { color: '#8A94B2' } },
        y: { title: { display: true, text: 'Total Cost', color: '#8A94B2', font: { size: 10 } }, min: 0, max: 2000, grid: { color: 'rgba(42,48,80,.8)' }, ticks: { color: '#8A94B2' } },
        y2: { position: 'right', title: { display: true, text: 'Per Unit Cost', color: '#8A94B2', font: { size: 10 } }, min: 0, max: 80, grid: { display: false }, ticks: { color: '#8A94B2' } }
      }
    }
  });
  cpUpdate();
}
function cpUpdate() {
  if (!cpC) return;
  const FC = +document.getElementById('cp-fc').value;
  const vc_rate = +document.getElementById('cp-vc').value;
  const returns = +document.getElementById('cp-ret').value / 100;
  const price = +document.getElementById('cp-price').value;
  document.getElementById('cp-fc-val').textContent = FC;
  document.getElementById('cp-vc-val').textContent = vc_rate;
  document.getElementById('cp-ret-val').textContent = returns.toFixed(2);
  document.getElementById('cp-price-val').textContent = price;

  const tcData = [], vcData = [], mcData = [], atcData = [];
  let prevTC = FC;
  for (let q = 1; q <= 100; q++) {
    const vc = vc_rate * Math.pow(q, 1 + returns);
    const tc = FC + vc;
    const mc = vc_rate * (1 + returns) * Math.pow(q, returns);
    const atc = tc / q;
    tcData.push({ x: q, y: +tc.toFixed(1) });
    vcData.push({ x: q, y: +vc.toFixed(1) });
    if (mc <= 80) mcData.push({ x: q, y: +mc.toFixed(1) });
    if (atc <= 80) atcData.push({ x: q, y: +atc.toFixed(1) });
    prevTC = tc;
  }

  // Profit max where MC = Price
  let profitMaxQ = 0;
  for (let q = 1; q <= 100; q++) {
    const mc = vc_rate * (1 + returns) * Math.pow(q, returns);
    if (mc <= price) profitMaxQ = q;
  }
  const profitMaxTC = FC + vc_rate * Math.pow(profitMaxQ, 1 + returns);
  const maxProfit = price * profitMaxQ - profitMaxTC;

  cpC.data.datasets[0].data = tcData;
  cpC.data.datasets[1].data = vcData;
  cpC.data.datasets[2].data = mcData;
  cpC.data.datasets[3].data = atcData;
  cpC.update('none');

  document.getElementById('cp-profitq').textContent = profitMaxQ;
  document.getElementById('cp-profit').textContent = maxProfit.toFixed(0);
  document.getElementById('cp-breakeven').textContent = Math.ceil(FC / (price - vc_rate * Math.pow(1, returns)));
  document.getElementById('cp-atc-min').textContent = (profitMaxTC / profitMaxQ).toFixed(1);

  let exp = `Profit maximizing Q = ${profitMaxQ} (যেখানে MC ≈ Price). Max Profit = ${maxProfit.toFixed(0)}. `;
  if (maxProfit < 0) exp += '<strong>লোকসান!</strong> Price, ATC-এর নিচে। Fixed cost কমান বা price বাড়ান।';
  else if (returns > 0.1) exp += '<strong>Diminishing Returns</strong> — প্রতি unit উৎপাদনে MC ক্রমশ বাড়ছে।';
  document.getElementById('cp-explain').innerHTML = exp;
}

// ═══════════════════════
// MODULE 16: ENVIRONMENTAL ECONOMICS
// ═══════════════════════
let envC;
function envInit() {
  envC = new Chart(document.getElementById('envChart'), {
    type: 'scatter',
    data: { datasets: [
      { label: 'Social Cost (MSC)', data: [], showLine: true, borderColor: '#F87171', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, tension: 0.2 },
      { label: 'Private Cost (MPC)', data: [], showLine: true, borderColor: '#4F8EF7', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, tension: 0.2 },
      { label: 'Demand (MSB)', data: [], showLine: true, borderColor: '#34D399', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, tension: 0.2 },
      { label: 'After Carbon Tax', data: [], showLine: true, borderColor: '#F59E0B', borderDash: [5,3], backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, tension: 0.2 },
      { label: 'Social Optimum', data: [], pointRadius: 9, pointBackgroundColor: '#F472B6', borderColor: '#F472B6', pointBorderColor: '#fff', pointBorderWidth: 2 },
      { label: 'Market Equilibrium', data: [], pointRadius: 7, pointBackgroundColor: '#F59E0B', borderColor: '#F59E0B', pointBorderColor: '#fff', pointBorderWidth: 2 }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 200 },
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: true, labels: { color: '#8A94B2', font: { size: 10 }, boxWidth: 10 } } },
      scales: {
        x: { title: { display: true, text: 'Output (Q)', color: '#8A94B2', font: { size: 11 } }, min: 0, max: 100, grid: { color: 'rgba(42,48,80,.8)' }, ticks: { color: '#8A94B2' } },
        y: { title: { display: true, text: 'Cost / Benefit (P)', color: '#8A94B2', font: { size: 11 } }, min: 0, max: 120, grid: { color: 'rgba(42,48,80,.8)' }, ticks: { color: '#8A94B2' } }
      }
    }
  });
  envUpdate();
}
function envUpdate() {
  if (!envC) return;
  const ext = +document.getElementById('env-ext').value;
  const tax = +document.getElementById('env-tax').value;
  const elasticity = +document.getElementById('env-elas').value / 10;
  const emission = +document.getElementById('env-emit').value;
  document.getElementById('env-ext-val').textContent = ext;
  document.getElementById('env-tax-val').textContent = tax;
  document.getElementById('env-elas-val').textContent = elasticity.toFixed(1);
  document.getElementById('env-emit-val').textContent = emission;

  const mpcData = [], mscData = [], msbData = [], taxData = [];
  for (let q = 1; q <= 99; q++) {
    const mpc = 10 + q * 0.6;
    const msc = mpc + ext * emission / 50;
    const msb = 110 - q * elasticity;
    const mpc_tax = mpc + tax;
    if (mpc <= 120) mpcData.push({ x: q, y: +mpc.toFixed(1) });
    if (msc <= 120) mscData.push({ x: q, y: +msc.toFixed(1) });
    if (msb >= 0 && msb <= 120) msbData.push({ x: q, y: +msb.toFixed(1) });
    if (mpc_tax <= 120) taxData.push({ x: q, y: +mpc_tax.toFixed(1) });
  }

  // Market eq: MSB = MPC
  const mktQ = +((110 - 10) / (elasticity + 0.6)).toFixed(0);
  const mktP = +(10 + mktQ * 0.6).toFixed(1);
  // Social opt: MSB = MSC
  const extCost = ext * emission / 50;
  const socQ = +((110 - 10 - extCost) / (elasticity + 0.6)).toFixed(0);
  const socP = +(10 + socQ * 0.6 + extCost).toFixed(1);
  const dwl = +(0.5 * (mktQ - socQ) * extCost).toFixed(0);
  const taxRevenue = +(tax * Math.max(0, mktQ - tax / elasticity)).toFixed(0);

  envC.data.datasets[0].data = mscData;
  envC.data.datasets[1].data = mpcData;
  envC.data.datasets[2].data = msbData;
  envC.data.datasets[3].data = taxData;
  envC.data.datasets[4].data = [{ x: socQ, y: socP }];
  envC.data.datasets[5].data = [{ x: mktQ, y: mktP }];
  envC.update('none');

  document.getElementById('env-mktq').textContent = mktQ;
  document.getElementById('env-socq').textContent = socQ;
  document.getElementById('env-dwl').textContent = dwl;
  document.getElementById('env-taxrev').textContent = taxRevenue;

  let exp = `Market output: ${mktQ} (অতিরিক্ত), Social optimum: ${socQ}. Deadweight Loss: ${dwl}. `;
  if (tax >= extCost * 0.9) exp += '<strong>Pigouvian Tax কার্যকর!</strong> Carbon tax externality সংশোধন করছে।';
  else if (ext > 30) exp += '<strong>বড় negative externality</strong> — বাজার অতিরিক্ত উৎপাদন করছে, সমাজ ক্ষতিগ্রস্ত।';
  document.getElementById('env-explain').innerHTML = exp;
}
