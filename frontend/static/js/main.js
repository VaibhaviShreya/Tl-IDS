/* main.js — Bootstrap, page routing, SSE live feed */

// ── Page Router ───────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const pg = document.getElementById('page-' + btn.dataset.page);
    if (pg) {
      pg.classList.add('active');
      PageInit[btn.dataset.page]?.();
    }
  });
});

// ── SSE Live stream ───────────────────────────────────────────────────────────
let _sseSource = null;
let _sessionAttackCount = 0;
let _latestCritical = null;

function startSSE() {
  if (_sseSource) return;
  try {
    _sseSource = new EventSource('/api/detection/stream');
    _sseSource.onmessage = (ev) => {
      const event = JSON.parse(ev.data);
      UI.appendLog(event);
      if (event.is_attack) {
        _sessionAttackCount++;
        const mt = document.getElementById('mThreats');
        if (mt) mt.textContent = _sessionAttackCount;
        if (['critical', 'high'].includes(event.severity)) {
          _latestCritical = event;
          UI.showAlert(event);
        }
      }
    };
    _sseSource.onerror = () => {
      // SSE not available (static mode) — fall back to polling
      _sseSource?.close(); _sseSource = null;
      startPolling();
    };
  } catch (_) {
    startPolling();
  }
}

// Fallback polling when SSE unavailable
let _pollInterval = null;
function startPolling() {
  if (_pollInterval) return;
  _pollInterval = setInterval(async () => {
    const data = await API.getAttacks(5, false);
    if (!data?.events) return;
    data.events.slice(0, 3).forEach(e => UI.appendLog(e));
  }, 2000);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
const PageInit = {
  _dashLoaded: false,

  async dashboard() {
    if (this._dashLoaded) return;
    this._dashLoaded = true;

    // Load data in parallel
    const [timelineData, nodeData, statsData, attackData] = await Promise.all([
      API.getTimeline(),
      API.getNodes(),
      API.getDetectionStats(),
      API.getAttacks(80, false),
    ]);

    // Timeline chart
    if (timelineData?.timeline) Charts.timeline(timelineData.timeline);

    // Attack donut
    if (statsData?.by_type) Charts.donut(statsData.by_type);

    // WSN map
    if (nodeData?.nodes) {
      WSNMap.init('wsnCanvas');
      WSNMap.load(nodeData.nodes);
    }

    // Metrics
    const netStats = await API.getNetworkStats();
    UI.updateMetrics(statsData, netStats);

    // Pre-fill log from historical attacks
    if (attackData?.events) {
      attackData.events.slice(0, 20).forEach(e => UI.appendLog(e));
      const critical = attackData.events.find(e => e.is_attack && e.severity === 'critical');
      if (critical) UI.showAlert(critical);
    }

    startSSE();
  },

  _archLoaded: false,
  async architecture() {
    if (this._archLoaded) return;
    this._archLoaded = true;

    UI.renderPipeline();
    UI.renderDomainCards();

    const [modelInfo, baselines] = await Promise.all([
      API.getModelInfo(),
      API.getBaselines(),
    ]);

    if (modelInfo?.model) {
      UI.renderLayerBars(modelInfo.model.layers);
      UI.renderParams(modelInfo.model.hyperparams);
    }
    if (baselines?.baselines) UI.renderBaselines(baselines.baselines);
  },

  _detLoaded: false,
  async detection() {
    if (this._detLoaded) return;
    this._detLoaded = true;

    const [attackData, cmData, featData, metricsData] = await Promise.all([
      API.getAttacks(80, false),
      API.getConfusionMatrix(),
      API.getFeatureImportances(),
      API.getMetrics(),
    ]);

    if (attackData?.events) UI.renderAttackTable(attackData.events);
    if (cmData) UI.renderConfusion(cmData.labels, cmData.matrix);
    if (featData?.features) UI.renderFeatureBars(featData.features);
    if (metricsData?.metrics?.per_class) UI.renderPerClass(metricsData.metrics.per_class);

    // Refresh button
    const btn = document.getElementById('refreshAttacks');
    if (btn) {
      btn.onclick = async () => {
        this._detLoaded = false;
        await this.detection();
      };
    }
  },

  _analLoaded: false,
  async analytics() {
    if (this._analLoaded) return;
    this._analLoaded = true;

    const [history, timeline] = await Promise.all([
      API.getTrainingHistory(),
      API.getTimeline(),
    ]);

    if (history?.history) {
      Charts.accuracy(history.history);
      Charts.loss(history.history);
    }
    if (timeline?.timeline) Charts.hourly(timeline.timeline);
  },

  _aboutLoaded: false,
  about() {
    if (this._aboutLoaded) return;
    this._aboutLoaded = true;
    UI.renderContribs();
    UI.renderTechStack();
    UI.renderRefs();
  },
};

// ── Boot ──────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  PageInit.dashboard();
});