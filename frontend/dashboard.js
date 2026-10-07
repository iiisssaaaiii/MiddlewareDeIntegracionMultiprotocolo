// Prototipo: todos los datos son simulados.
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const pad = (n, l = 2) => String(n).padStart(l, "0");

  /* ---------- Navegación por menú superior ---------- */
  const VIEWS = ["latencia", "logs", "nodos"];

  function route() {
    const key = location.hash.slice(1);
    const current = VIEWS.includes(key) ? key : "latencia";

    VIEWS.forEach((v) => {
      $(`#view-${v}`).hidden = v !== current;
    });
    $$(".tabs a").forEach((a) => {
      if (a.dataset.view === current) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    if (current === "latencia") drawChart();
  }

  /* ---------- Utilidades de curvas suaves ---------- */
  function smoothPath(pts, minY, maxY) {
    const clamp = (v) => Math.min(maxY, Math.max(minY, v));
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = clamp(p1[1] + (p2[1] - p0[1]) / 6);
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = clamp(p2[1] - (p3[1] - p1[1]) / 6);
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }

  /* ---------- Tarjetas con sparkline ---------- */
  function drawSparklines() {
    $$(".card").forEach((card) => {
      const svg = $(".spark", card);
      const id = `grad-${card.dataset.proto}`;
      const N = 30;
      const pts = Array.from({ length: N }, (_, i) => {
        const v = 1 + Math.sin(i / 5) * 0.025 + (Math.random() - 0.5) * 0.03;
        return [(i / (N - 1)) * 400, 40 - (v - 0.9) * 150];
      });
      const line = smoothPath(pts, 2, 42);
      svg.innerHTML = `
        <defs>
          <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style="stop-color:var(--c);stop-opacity:.35"/>
            <stop offset="1" style="stop-color:var(--c);stop-opacity:0"/>
          </linearGradient>
        </defs>
        <path d="${line} L400,44 L0,44 Z" fill="url(#${id})"/>
        <path d="${line}" fill="none" style="stroke:var(--c)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
    });
  }

  // Los contadores varían ligeramente para dar sensación de "en vivo"
  function tickCounters() {
    $$(".card [data-value]").forEach((el) => {
      const base = Number(el.dataset.value);
      const next = Math.round(base * (1 + (Math.random() - 0.5) * 0.04));
      el.textContent = next;
    });
  }

  /* ---------- Gráfica de latencia de normalización ---------- */
  const N_POINTS = 60;
  const SERIES = [
    { name: "mqtt", color: "#00d1ff", base: 13, amp: 8 },
    { name: "http", color: "#19f58a", base: 19, amp: 15 },
    { name: "coap", color: "#ffa116", base: 12, amp: 9 },
  ].map((s) => ({
    ...s,
    values: Array.from({ length: N_POINTS }, () =>
      Math.min(35, Math.max(1, s.base + (Math.random() - 0.5) * 2 * s.amp))
    ),
  }));

  function drawChart() {
    const host = $("#chart");
    const W = host.clientWidth;
    if (!W) return;

    const H = 270;
    const m = { l: 46, r: 12, t: 12, b: 28 };
    const iw = W - m.l - m.r;
    const ih = H - m.t - m.b;
    const MAX = 36;
    const x = (i) => m.l + (i * iw) / (N_POINTS - 1);
    const y = (v) => m.t + ih - (v / MAX) * ih;

    let out = "";

    // Líneas horizontales y etiquetas del eje Y
    [0, 9, 18, 27, 36].forEach((v) => {
      out += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/>`;
      out += `<text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}ms</text>`;
    });

    // Líneas verticales y etiquetas de hora
    const now = Date.now();
    [0, 12, 24, 36, 48, 59].forEach((i) => {
      const t = new Date(now - (N_POINTS - 1 - i) * 60000);
      out += `<line class="grid" x1="${x(i)}" x2="${x(i)}" y1="${m.t}" y2="${m.t + ih}"/>`;
      out += `<text x="${x(i)}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === 59 ? "end" : "middle"}">${pad(t.getHours())}:${pad(t.getMinutes())}</text>`;
    });

    // Series
    SERIES.forEach((s) => {
      const pts = s.values.map((v, i) => [x(i), y(v)]);
      out += `<path class="line" stroke="${s.color}" d="${smoothPath(pts, m.t, m.t + ih)}"/>`;
    });

    host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" height="${H}" role="img" aria-label="Latencia de normalización de MQTT, HTTP y CoAP en los últimos 60 minutos">${out}</svg>`;
  }

  /* ---------- System logs ---------- */
  const NODES = ["042", "091", "017", "203", "158", "076", "412"];
  const fmtTime = (d) =>
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;

  function makeLog(date) {
    const r = Math.random();
    const id = pick(NODES);
    let level = "INFO", msg, payload;

    if (r < 0.62) {
      msg = "MQTT message received";
      payload = { topic: `/bus/${id}/telemetry`, qos: 1, retain: false, payload_bytes: rand(120, 260) };
    } else if (r < 0.78) {
      msg = "HTTP request received";
      payload = { method: "POST", path: "/api/v1/telemetry", status: 202, node: `BUS-${id}`, payload_bytes: rand(200, 420) };
    } else if (r < 0.9) {
      msg = "CoAP message received";
      payload = { code: "2.05", uri: `/bus/${id}/telemetry`, type: "CON", mid: rand(1000, 9999), payload_bytes: rand(80, 200) };
    } else if (r < 0.96) {
      level = "WARN";
      msg = "CoAP response latency above threshold";
      payload = { node: "BUS-017", latency_ms: rand(120, 210), threshold_ms: 100 };
    } else {
      level = "ERROR";
      msg = "Node unreachable, retrying connection";
      payload = { node: "BUS-334", protocol: "CoAP", retries: 3 };
    }

    return `
      <div class="log">
        <span class="log-time">${fmtTime(date)}</span>
        <span class="log-level ${level.toLowerCase()}">[${level}]</span>
        <span class="log-msg">${msg}</span>
        <span class="log-payload">${JSON.stringify(payload)}</span>
      </div>`;
  }

  function initLogs() {
    const body = $("#log-body");
    let t = Date.now();
    let html = "";
    for (let i = 0; i < 20; i++) {
      html += makeLog(new Date(t));
      t -= rand(2500, 6500);
    }
    body.innerHTML = html;

    setInterval(() => {
      body.insertAdjacentHTML("afterbegin", makeLog(new Date()));
      while (body.children.length > 60) body.lastElementChild.remove();
    }, 3000);
  }

  /* ---------- Estado de nodos ---------- */
  const NODE_ROWS = [
    { id: "BUS-042", route: "L12 — Centrale",   proto: "MQTT", status: "online",   ping: "7ms",   seen: "0s ago" },
    { id: "BUS-091", route: "L3 — Termini",     proto: "HTTP", status: "online",   ping: "14ms",  seen: "0s ago" },
    { id: "BUS-017", route: "L7 — Tiburtina",   proto: "CoAP", status: "degraded", ping: "148ms", seen: "4s ago" },
    { id: "BUS-203", route: "L22 — Ostiense",   proto: "MQTT", status: "online",   ping: "9ms",   seen: "1s ago" },
    { id: "BUS-158", route: "L5 — Prati",       proto: "HTTP", status: "online",   ping: "11ms",  seen: "0s ago" },
    { id: "BUS-334", route: "L18 — EUR",        proto: "CoAP", status: "offline",  ping: "—",     seen: "47s ago" },
    { id: "BUS-076", route: "L9 — Trastevere",  proto: "MQTT", status: "online",   ping: "6ms",   seen: "0s ago" },
    { id: "BUS-412", route: "L31 — Nomentana",  proto: "HTTP", status: "degraded", ping: "203ms", seen: "12s ago" },
  ];

  function renderNodes() {
    $("#nodes-body").innerHTML = NODE_ROWS.map((n) => `
      <tr>
        <td class="node-id">${n.id}</td>
        <td>${n.route}</td>
        <td><span class="proto ${n.proto.toLowerCase()}">${n.proto}</span></td>
        <td><span class="status ${n.status}">${n.status.toUpperCase()}</span></td>
        <td class="ping ${n.status === "online" ? "" : n.status}">${n.ping}</td>
        <td class="last-seen">${n.seen}</td>
      </tr>`).join("");

    const online = NODE_ROWS.filter((n) => n.status === "online").length;
    $("#online-count").textContent = `${online}/${NODE_ROWS.length} ONLINE`;
  }

  /* ---------- Inicio ---------- */
  drawSparklines();
  renderNodes();
  initLogs();
  setInterval(tickCounters, 2500);

  window.addEventListener("hashchange", route);
  window.addEventListener("resize", () => {
    if (!$("#view-latencia").hidden) drawChart();
  });
  route();
})();
