/* charts.js — All Chart.js chart constructors */

Chart.defaults.color          = '#94a3b8';
Chart.defaults.borderColor    = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family    = "'DM Sans', sans-serif";
Chart.defaults.font.size      = 11;
Chart.defaults.plugins.legend.labels.boxWidth  = 10;
Chart.defaults.plugins.legend.labels.padding   = 12;

const ATTACK_COLORS = {
  'Normal':    '#34d399',
  'DoS/DDoS':  '#f87171',
  'Sinkhole':  '#fb923c',
  'Replay':    '#818cf8',
  'Blackhole': '#38bdf8',
  'Wormhole':  '#f472b6',
};

const Charts = {
  _instances: {},

  _destroy(id) {
    if (this._instances[id]) {
      this._instances[id].destroy();
      delete this._instances[id];
    }
  },

  timeline(data) {
    this._destroy('timeline');
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;
    const labels   = data.map(d => d.hour);
    const normal   = data.map(d => d.normal);
    const attacks  = data.map(d => d.attacks);
    this._instances.timeline = new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Normal', data: normal, borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.07)', fill: true, tension: 0.4, borderWidth: 1.5, pointRadius: 0 },
          { label: 'Attacks', data: attacks, borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.12)', fill: true, tension: 0.2, borderWidth: 1.5, pointRadius: attacks.map(v => v > 0 ? 3 : 0), pointBackgroundColor: '#f87171' },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { position: 'top' } },
        scales: { x: { ticks: { maxTicksLimit: 8 } }, y: {} }
      }
    });
  },

  donut(byType) {
    this._destroy('donut');
    const ctx = document.getElementById('donutChart');
    if (!ctx) return;
    const labels = Object.keys(byType);
    const values = Object.values(byType);
    const colors = labels.map(l => ATTACK_COLORS[l] || '#94a3b8');
    this._instances.donut = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors.map(c => c + '33'), borderColor: colors, borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: { legend: { position: 'right' } },
        animation: { duration: 600 }
      }
    });
  },

  accuracy(history) {
    this._destroy('acc');
    const ctx = document.getElementById('accChart');
    if (!ctx) return;
    this._instances.acc = new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: history.epochs,
        datasets: [
          { label: 'Train Acc',      data: history.train_accuracy, borderColor: '#38bdf8', fill: false, tension: 0.4, borderWidth: 1.5, pointRadius: 0 },
          { label: 'Validation Acc', data: history.val_accuracy,   borderColor: '#818cf8', fill: false, tension: 0.4, borderWidth: 1.5, pointRadius: 0, borderDash: [5, 4] },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { position: 'top' } },
        scales: { x: { ticks: { maxTicksLimit: 10 }, title: { display: true, text: 'Epoch' } },
          y: { min: 0.5, max: 1.0, title: { display: true, text: 'Accuracy' } } }
      }
    });
  },

  loss(history) {
    this._destroy('loss');
    const ctx = document.getElementById('lossChart');
    if (!ctx) return;
    this._instances.loss = new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: history.epochs,
        datasets: [
          { label: 'Train Loss', data: history.train_loss, borderColor: '#f87171', fill: false, tension: 0.4, borderWidth: 1.5, pointRadius: 0 },
          { label: 'Val Loss',   data: history.val_loss,   borderColor: '#fb923c', fill: false, tension: 0.4, borderWidth: 1.5, pointRadius: 0, borderDash: [5, 4] },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { position: 'top' } },
        scales: { x: { ticks: { maxTicksLimit: 10 }, title: { display: true, text: 'Epoch' } },
          y: { title: { display: true, text: 'Loss' } } }
      }
    });
  },

  hourly(data) {
    this._destroy('hourly');
    const ctx = document.getElementById('hourlyChart');
    if (!ctx) return;
    this._instances.hourly = new Chart(ctx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: data.map(d => d.hour),
        datasets: [
          { label: 'Normal',  data: data.map(d => d.normal),  backgroundColor: 'rgba(56,189,248,0.25)', borderColor: '#38bdf8', borderWidth: 1 },
          { label: 'Attacks', data: data.map(d => d.attacks), backgroundColor: 'rgba(248,113,113,0.35)', borderColor: '#f87171', borderWidth: 1 },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { position: 'top' } },
        scales: { x: { stacked: true, ticks: { maxTicksLimit: 12 } }, y: { stacked: true } }
      }
    });
  },
};