/* ui.js — DOM rendering helpers */

const BADGE_CLASS = {
  'Normal':    'green',
  'DoS/DDoS':  'red',
  'Sinkhole':  'orange',
  'Replay':    'purple',
  'Blackhole': 'blue',
  'Wormhole':  'gray',
  'none':      'green',
  'medium':    'orange',
  'high':      'red',
  'critical':  'red',
};

const UI = {

  badge(text, cls) {
    cls = cls || BADGE_CLASS[text] || 'gray';
    return `<span class="badge ${cls}">${text}</span>`;
  },

  monoGreen(v, decimals = 3) {
    return `<span class="mono green">${(+v).toFixed(decimals)}</span>`;
  },

  // ── Attack log table ─────────────────────────────────────────
  renderAttackTable(events) {
    const tbody = document.querySelector('#attackTableBody');
    if (!tbody) return;
    const attacks = events.filter(e => e.is_attack).slice(0, 30);
    const badge   = document.getElementById('attackCountBadge');
    if (badge) badge.textContent = `${attacks.length} Attacks`;

    tbody.innerHTML = attacks.map(e => {
      const t = new Date(e.timestamp).toLocaleTimeString('en-GB', { hour12: false });
      return `<tr>
        <td class="mono" style="font-size:11px;color:var(--dim)">${t}</td>
        <td class="mono blue">${e.node}</td>
        <td>${this.badge('Zone ' + e.zone, 'gray')}</td>
        <td>${this.badge(e.attack_type)}</td>
        <td class="mono green">${(e.confidence * 100).toFixed(1)}%</td>
        <td style="font-size:11px;color:var(--muted)">${e.action}</td>
      </tr>`;
    }).join('');
  },

  // ── Live log stream ──────────────────────────────────────────
  appendLog(event) {
    const log = document.getElementById('liveLog');
    if (!log) return;
    const t   = new Date(event.timestamp).toLocaleTimeString('en-GB', { hour12: false });
    const cls = event.attack_type === 'Normal' ? 'ok' :
                ['DoS/DDoS', 'Wormhole', 'Blackhole'].includes(event.attack_type) ? 'alert' : 'warn';
    const typeColor = {
      Normal: 'var(--accent3)', 'DoS/DDoS': 'var(--danger)',
      Sinkhole: 'var(--warn)', Replay: 'var(--accent2)',
      Blackhole: 'var(--accent)', Wormhole: 'var(--accent4)',
    }[event.attack_type] || 'var(--muted)';

    const row = document.createElement('div');
    row.className = `log-row ${cls}`;
    row.innerHTML = `<span class="log-time">${t}</span><span class="log-node">${event.node}</span><span class="log-type" style="color:${typeColor}">${event.attack_type.padEnd(10)}</span><span class="log-msg">${event.action} | conf=${(event.confidence*100).toFixed(1)}%</span>`;
    log.insertBefore(row, log.firstChild);
    while (log.children.length > 60) log.removeChild(log.lastChild);
  },

  // ── Metric cards ─────────────────────────────────────────────
  updateMetrics(stats, netStats) {
    if (netStats) {
      const el = document.getElementById('mNodes');
      if (el) el.textContent = netStats.stats.active_nodes;
      const sub = document.getElementById('mNodesSub');
      if (sub) sub.textContent = `of ${netStats.stats.total_nodes} total`;
      const hNodes = document.getElementById('hNodes');
      if (hNodes) hNodes.textContent = netStats.stats.active_nodes;
      const badge = document.getElementById('nodesBadge');
      if (badge) badge.textContent = `${netStats.stats.active_nodes} Active`;
    }
    if (stats) {
      const mT = document.getElementById('mThreats');
      if (mT) mT.textContent = stats.total_attacks;
      const mC = document.getElementById('mClean');
      if (mC) mC.textContent = ((1 - stats.attack_rate) * 100).toFixed(1) + '%';
    }
  },

  // ── Alert banner ─────────────────────────────────────────────
  showAlert(event) {
    const banner = document.getElementById('alertBanner');
    if (!banner) return;
    const t = new Date(event.timestamp).toLocaleTimeString('en-GB', { hour12: false });
    banner.classList.remove('hidden');
    banner.innerHTML = `<div class="alert-dot"></div>
      <strong style="color:var(--danger)">ALERT</strong>
      <span style="color:var(--muted)">${event.attack_type} detected on ${event.node} (Zone ${event.zone}) — confidence ${(event.confidence*100).toFixed(1)}% — ${event.action}</span>
      <span style="margin-left:auto;font-size:10px;color:var(--dim);font-family:var(--mono)">${t}</span>`;
  },

  // ── Confusion Matrix ─────────────────────────────────────────
  renderConfusion(labels, matrix) {
    const container = document.getElementById('cmContainer');
    if (!container) return;
    const N = labels.length;
    const shortLabels = labels.map(l => l.split('/')[0].substring(0, 5));
    const maxVal = Math.max(...matrix.flat());
    const cols = N + 1;

    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    container.style.gap = '2px';

    let html = '<div class="cm-cell cm-header"></div>';
    shortLabels.forEach(l => html += `<div class="cm-cell cm-header">${l}</div>`);
    matrix.forEach((row, ri) => {
      html += `<div class="cm-cell cm-header">${shortLabels[ri]}</div>`;
      row.forEach((val, ci) => {
        const isCorrect = ri === ci;
        const intensity = Math.max(0.06, val / maxVal);
        const bg = isCorrect ? `rgba(52,211,153,${intensity})` :
                   val > 5   ? `rgba(248,113,113,${Math.min(intensity * 3, 0.5)})` :
                               'rgba(255,255,255,0.04)';
        const color = isCorrect ? '#34d399' : val > 0 ? '#f87171' : '#475569';
        html += `<div class="cm-cell" style="background:${bg};color:${color}">${val}</div>`;
      });
    });
    container.innerHTML = html;

    // Legend
    const legend = document.getElementById('cmLegend');
    if (legend) {
      const cls = ['green','red','orange','purple','blue','gray'];
      legend.innerHTML = labels.map((l, i) => this.badge(l, cls[i] || 'gray')).join(' ');
    }
  },

  // ── SHAP Feature bars ────────────────────────────────────────
  renderFeatureBars(features) {
    const container = document.getElementById('featureBars');
    if (!container) return;
    const top = features.slice(0, 12);
    container.innerHTML = top.map(f => {
      const w = Math.round(f.importance * 100);
      const grad = f.importance > 0.7 ? 'linear-gradient(90deg,#f87171,#fb923c)' :
                   f.importance > 0.5 ? 'linear-gradient(90deg,#38bdf8,#818cf8)' :
                                        'linear-gradient(90deg,#818cf8,#34d399)';
      return `<div class="prog-row">
        <div class="prog-lbl">${f.name}</div>
        <div class="prog-bar"><div class="prog-fill" style="width:${w}%;background:${grad}"></div></div>
        <div class="prog-val">${f.importance.toFixed(3)}</div>
      </div>`;
    }).join('');
  },

  // ── Per-class table ──────────────────────────────────────────
  renderPerClass(perClass) {
    const tbody = document.querySelector('#perClassTable tbody');
    if (!tbody) return;
    const clsOrder = ['Normal', 'DoS/DDoS', 'Sinkhole', 'Replay', 'Blackhole', 'Wormhole'];
    tbody.innerHTML = clsOrder.map(cls => {
      const m = perClass[cls] || {};
      return `<tr>
        <td>${this.badge(cls)}</td>
        <td class="mono green">${(m.precision || 0).toFixed(3)}</td>
        <td class="mono">${(m.recall || 0).toFixed(3)}</td>
        <td class="mono">${(m.f1 || 0).toFixed(3)}</td>
      </tr>`;
    }).join('');
  },

  // ── Baseline table ───────────────────────────────────────────
  renderBaselines(baselines) {
    const tbody = document.querySelector('#baselineTable tbody');
    if (!tbody) return;
    tbody.innerHTML = baselines.map(b => {
      const hl = b.highlight ? 'style="background:rgba(52,211,153,0.04)"' : '';
      const name = b.highlight
        ? `<span class="badge green">${b.model}</span>`
        : b.model;
      const hours = b.train_min >= 60
        ? `${Math.floor(b.train_min/60)}h ${b.train_min%60}m`
        : `${b.train_min} min`;
      return `<tr ${hl}>
        <td>${name}</td>
        <td class="mono ${b.highlight ? 'green' : ''}">${(b.accuracy * 100).toFixed(1)}%</td>
        <td class="mono">${b.accuracy.toFixed(3)}</td>
        <td class="mono">${b.f1.toFixed(3)}</td>
        <td class="mono ${b.highlight ? 'green' : ''}">${b.f1.toFixed(3)}</td>
        <td class="mono">${b.auc.toFixed(3)}</td>
        <td class="mono">${hours}</td>
      </tr>`;
    }).join('');
  },

  // ── Architecture pipeline ────────────────────────────────────
  renderPipeline() {
    const steps = [
      { icon: '🌐', label: 'Source Domains\n(NSL-KDD / UNSW\n/ IoT-23 / SCADA)', cls: '' },
      { icon: '🧠', label: 'Pre-trained\nBase CNN', cls: 'highlight' },
      { icon: '❄️',  label: 'Frozen\nFeature Layers', cls: '' },
      { icon: '🔧', label: 'Fine-tune\non WSN Data', cls: 'fine-tune' },
      { icon: '📊', label: 'Softmax\nClassifier Head', cls: '' },
      { icon: '⚡', label: 'TF-Lite\nQuantized Model', cls: '' },
      { icon: '🛡️', label: 'Real-time\nIDS Engine', cls: 'output' },
    ];
    const el = document.getElementById('pipeline');
    if (!el) return;
    el.innerHTML = steps.map((s, i) => {
      const arrow = i < steps.length - 1 ? '<div class="pipe-arrow"></div>' : '';
      return `<div class="pipe-block ${s.cls}"><div class="pipe-icon">${s.icon}</div><div class="pipe-label">${s.label.replace(/\n/g, '<br>')}</div></div>${arrow}`;
    }).join('');
  },

  // ── Domain cards ─────────────────────────────────────────────
  renderDomainCards() {
    const domains = [
      { name: 'NSL-KDD', badge: 'blue', desc: '125,973 samples · 41 features · DoS, Probe, R2L, U2R attacks' },
      { name: 'UNSW-NB15', badge: 'purple', desc: '2.54M records · 49 features · 9 attack families incl. Exploits' },
      { name: 'IoT-23', badge: 'orange', desc: '1.3M packets · Smart device traffic · Botnet & DDoS signatures' },
      { name: 'SCADA/ICS', badge: 'green', desc: 'Critical infrastructure · Modbus/DNP3 · False Data Injection' },
    ];
    const el = document.getElementById('domainCards');
    if (!el) return;
    el.innerHTML = domains.map(d => `
      <div class="domain-card">
        <div class="domain-header">
          <span class="domain-name">${d.name}</span>
          ${this.badge(d.badge === 'blue' ? 'Network' : d.badge === 'purple' ? 'Hybrid' : d.badge === 'orange' ? 'IoT' : 'ICS', d.badge)}
        </div>
        <div class="domain-desc">${d.desc}</div>
      </div>`).join('');
  },

  // ── Layer bars ───────────────────────────────────────────────
  renderLayerBars(layers) {
    const el = document.getElementById('layerBars');
    if (!el || !layers) return;
    const max = Math.max(...layers.map(l => l.units));
    el.innerHTML = layers.map(l => {
      const w = Math.round((l.units / max) * 100);
      const frozen = l.frozen;
      const grad = frozen
        ? 'linear-gradient(90deg,rgba(56,189,248,0.6),rgba(129,140,248,0.5))'
        : 'linear-gradient(90deg,rgba(52,211,153,0.7),rgba(56,189,248,0.5))';
      const lbl = frozen ? '<span class="badge blue" style="font-size:9px;padding:1px 6px;">Frozen</span>'
                         : '<span class="badge green" style="font-size:9px;padding:1px 6px;">Tuned</span>';
      return `<div class="prog-row">
        <div class="prog-lbl" style="width:90px;font-family:var(--mono);font-size:10px;">${l.name}</div>
        <div class="prog-bar"><div class="prog-fill" style="width:${w}%;background:${grad}"></div></div>
        ${lbl}
      </div>`;
    }).join('');
  },

  // ── Hyperparams table ────────────────────────────────────────
  renderParams(hp) {
    const el = document.getElementById('paramTable');
    if (!el || !hp) return;
    const rows = [
      ['Optimizer',     hp.optimizer],
      ['LR (pretrain)', hp.lr_pretrain],
      ['LR (finetune)', hp.lr_finetune],
      ['Batch Size',    hp.batch_size],
      ['Epochs (pre)',  hp.epochs_pretrain],
      ['Epochs (ft)',   hp.epochs_finetune],
      ['Loss',          hp.loss],
      ['Regularize',    hp.regularization],
      ['Normalize',     hp.normalization],
      ['Dataset Split', hp.split],
      ['SMOTE',         hp.smote ? 'Yes' : 'No'],
    ];
    el.innerHTML = rows.map(([k, v]) =>
      `<tr><td>${k}</td><td>${v}</td></tr>`
    ).join('');
  },

  // ── About page ───────────────────────────────────────────────
  renderContribs() {
    const contribs = [
      { color: 'var(--accent)',  title: '① Cross-Domain Feature Alignment', desc: 'Novel preprocessing pipeline normalising heterogeneous feature spaces across 4 datasets into a unified 41-feature vector compatible with WSN traffic.' },
      { color: 'var(--accent2)', title: '② Gradual Unfreezing Strategy', desc: 'Layer-by-layer unfreezing with discriminative learning rates prevents catastrophic forgetting during WSN-specific fine-tuning.' },
      { color: 'var(--accent3)', title: '③ Lightweight Inference Engine', desc: 'TF-Lite quantized model enables real-time inference at 12 ms average latency on resource-constrained WSN gateway hardware.' },
      { color: 'var(--warn)',    title: '④ WSN-Specific Attack Dataset', desc: 'Collected and labelled 48,000 WSN traffic samples using COOJA/Contiki-NG simulator covering sinkhole, blackhole, wormhole, and replay attacks.' },
    ];
    const el = document.getElementById('contribList');
    if (!el) return;
    el.innerHTML = contribs.map(c => `
      <div class="contrib-item">
        <div class="contrib-title" style="color:${c.color}">${c.title}</div>
        <div class="contrib-desc">${c.desc}</div>
      </div>`).join('');
  },

  renderTechStack() {
    const stack = [
      ['Python 3.10', 'blue'], ['TensorFlow 2.x', 'orange'], ['Scikit-learn', 'green'],
      ['NumPy / Pandas', 'purple'], ['SHAP', 'blue'], ['Matplotlib', 'red'],
      ['COOJA Simulator', 'green'], ['Contiki-NG', 'orange'], ['Flask API', 'purple'],
      ['TF-Lite', 'red'], ['Chart.js', 'green'], ['Docker', 'blue'],
    ];
    const el = document.getElementById('techStack');
    if (!el) return;
    el.innerHTML = stack.map(([name, cls]) => `<span class="badge ${cls}">${name}</span>`).join('');
  },

  renderRefs() {
    const refs = [
      'Pan, S.J., Yang, Q. (2010). A Survey on Transfer Learning. <em>IEEE TKDE</em>',
      'Tavallaee et al. (2009). A Detailed Analysis of NSL-KDD. <em>IEEE CISDA</em>',
      'Moustafa & Slay (2015). UNSW-NB15 Dataset. <em>IEEE MilCIS</em>',
      'Koroniotis et al. (2019). IoT-23. <em>Future Gen. Computer Systems</em>',
      'Abeshu & Chilamkurti (2018). Deep Learning for WSN IDS. <em>Sensors</em>',
      'Goodfellow et al. (2016). <em>Deep Learning</em>. MIT Press',
      'Howard & Ruder (2018). Universal Language Model Fine-tuning. <em>ACL</em>',
    ];
    const el = document.getElementById('refList');
    if (!el) return;
    el.innerHTML = refs.map(r => `<li>${r}</li>`).join('');
  },
};