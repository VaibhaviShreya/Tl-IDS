/* api.js — All backend API calls */

const API = {
  BASE: window.location.origin,

  async get(path) {
    try {
      const res = await fetch(this.BASE + path);
      return await res.json();
    } catch (e) {
      console.warn('API error:', path, e.message);
      return null;
    }
  },

  async post(path, body) {
    try {
      const res = await fetch(this.BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
      });
      return await res.json();
    } catch (e) {
      console.warn('API error:', path, e.message);
      return null;
    }
  },

  // ── Detection ─────────────────────────────────────────────────
  async getAttacks(limit = 40, onlyAttacks = false) {
    return this.get(`/api/detection/attacks?limit=${limit}&only_attacks=${onlyAttacks}`);
  },

  async getDetectionStats() {
    return this.get('/api/detection/stats');
  },

  async batchPredict(n = 50) {
    return this.post(`/api/detection/batch?n=${n}`);
  },

  // ── Analytics ─────────────────────────────────────────────────
  async getMetrics() {
    return this.get('/api/analytics/metrics');
  },

  async getTrainingHistory() {
    return this.get('/api/analytics/training');
  },

  async getConfusionMatrix() {
    return this.get('/api/analytics/confusion');
  },

  async getBaselines() {
    return this.get('/api/analytics/baselines');
  },

  async getFeatureImportances() {
    return this.get('/api/analytics/features');
  },

  async getTimeline() {
    return this.get('/api/analytics/timeline');
  },

  // ── Network ───────────────────────────────────────────────────
  async getNodes() {
    return this.get('/api/network/nodes');
  },

  async getNetworkStats() {
    return this.get('/api/network/stats');
  },

  // ── Model ─────────────────────────────────────────────────────
  async getModelInfo() {
    return this.get('/api/model/info');
  },
};