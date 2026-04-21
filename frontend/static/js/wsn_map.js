/* wsn_map.js — Canvas-based WSN network topology renderer */

const WSNMap = {
  canvas: null,
  ctx: null,
  nodes: [],
  animFrame: null,
  tick: 0,

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width  = rect.width || 460;
    this.canvas.height = 260;
    this.draw();
  },

  load(nodes) {
    this.nodes = nodes;
    cancelAnimationFrame(this.animFrame);
    this.animate();
  },

  animate() {
    this.tick++;
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.animate());
  },

  draw() {
    const { canvas, ctx, nodes, tick } = this;
    if (!ctx || nodes.length === 0) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = 'rgba(56,189,248,0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    const gw = nodes.find(n => n.zone === 'GW');
    const sensors = nodes.filter(n => n.zone !== 'GW');

    // Draw edges (sensor → gateway)
    sensors.forEach(n => {
      const nx = n.x * W, ny = n.y * H;
      const gx = gw ? gw.x * W : W/2, gy = gw ? gw.y * H : H/2;
      const color = n.state === 'compromised' ? '#f87171' : n.color;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(gx, gy);
      ctx.strokeStyle = color + '22';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw sensor nodes
    sensors.forEach(n => {
      const nx = n.x * W, ny = n.y * H;
      const color = n.state === 'compromised' ? '#f87171' :
                    n.state === 'sleep'       ? '#475569' : n.color;
      const r = n.state === 'compromised' ? 5.5 : 4;

      if (n.state === 'compromised') {
        // Pulsing ring
        const pulse = 0.5 + 0.5 * Math.sin(tick * 0.08);
        ctx.beginPath();
        ctx.arc(nx, ny, 9 + pulse * 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#f87171' + '44';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fillStyle = color + 'cc';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // Draw zone labels
    const zones = { A: null, B: null, C: null, D: null };
    sensors.forEach(n => { if (!zones[n.zone]) zones[n.zone] = n; });
    const ZONE_COLORS = { A:'#38bdf8', B:'#f472b6', C:'#34d399', D:'#818cf8' };
    const ZONE_CENTERS = {};
    sensors.forEach(n => {
      if (!ZONE_CENTERS[n.zone]) ZONE_CENTERS[n.zone] = { sx:0, sy:0, cnt:0 };
      ZONE_CENTERS[n.zone].sx += n.x; ZONE_CENTERS[n.zone].sy += n.y; ZONE_CENTERS[n.zone].cnt++;
    });
    Object.entries(ZONE_CENTERS).forEach(([zone, v]) => {
      const cx = (v.sx / v.cnt) * W, cy = (v.sy / v.cnt) * H;
      const color = ZONE_COLORS[zone] || '#94a3b8';
      ctx.font = '9px Space Mono, monospace';
      ctx.fillStyle = color + 'aa';
      ctx.textAlign = 'center';
      ctx.fillText(`Zone ${zone}`, cx, cy - 16);
    });

    // Draw gateway
    if (gw) {
      const gx = gw.x * W, gy = gw.y * H;
      const pulse = 0.5 + 0.5 * Math.sin(tick * 0.04);
      ctx.beginPath();
      ctx.arc(gx, gy, 18 + pulse * 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56,189,248,0.06)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gx, gy, 13, 0, Math.PI * 2);
      ctx.fillStyle = '#0d1220';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = 'bold 9px Space Mono, monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GW', gx, gy);
      ctx.textBaseline = 'alphabetic';
    }
  },
};