// DataRev — frontend

const { invoke } = window.__TAURI__.core;
const { listen }  = window.__TAURI__.event;

// ── Preferences
const Prefs = {
  get broker()   { return localStorage.getItem('mqtt.broker')   ?? ''; },
  get topic()    { return localStorage.getItem('mqtt.topic')    ?? ''; },
  get username() { return localStorage.getItem('mqtt.username') ?? ''; },
  save(broker, topic, username) {
    localStorage.setItem('mqtt.broker',   broker);
    localStorage.setItem('mqtt.topic',    topic);
    localStorage.setItem('mqtt.username', username);
  },
};

// ── Internationalisation
const I18N = {
  en: {
    // Login
    'login.sub':           'MQTT Dashboard Connection',
    'login.broker':        'MQTT BROKER',
    'login.topic':         'TOPIC',
    'login.username':      'USERNAME',
    'login.password':      'PASSWORD',
    'login.connect':       'CONNECT',
    'login.fillFields':    'Please fill in Broker and Topic.',
    'login.connecting':    'Connecting…',
    'login.failed':        'Connection failed. Check your settings.',
    'login.disconnected':  'Disconnected from broker.',
    'login.error':         'Error: ',
    // Tabs
    'tab.overview':        'Overview',
    'tab.graphs':          'Graphs',
    'tab.gps':             'GPS',
    'tab.advanced':        'Advanced',
    'tab.controls':        'Controls',
    'tab.logs':            'Logs',
    'tab.disconnect':      '⏻ Disconnect',
    // Overview
    'ov.gear':             'GEAR',
    'ov.lambda':           'Lambda',
    'ov.fuelPress':        'Fuel Press',
    'ov.oilPress':         'Oil Press',
    'ov.airTemp':          'Air Temp',
    // Graph
    'graph.clear':         '✕ Clear',
    'graph.startLog':      'Start Log',
    'graph.stopLog':       'Stop Log',
    'graph.session':       'Session #',
    'graph.noData':        'Waiting for telemetry data…',
    // Advanced — card titles
    'adv.engine':          'ENGINE',
    'adv.pressTemps':      'PRESSURES & TEMPS',
    'adv.egt':             'EXHAUST — EGT',
    'adv.wheelSpeeds':     'WHEEL SPEEDS',
    'adv.brakeDisc':       'BRAKE DISC TEMP',
    'adv.dynamics':        'VEHICLE DYNAMICS',
    'adv.injection':       'INJECTION',
    'adv.gpsTelemetry':    'GPS & TELEMETRY',
    // Advanced — field labels
    'adv.coolant':         'Coolant',
    'adv.gear':            'Gear',
    'adv.voltage':         'Voltage',
    'adv.intakeTemp':      'Intake Temp',
    'adv.oilTemp':         'Oil Temp',
    'adv.oilPressure':     'Oil Pressure',
    'adv.fuelPressure':    'Fuel Pressure',
    'adv.cyl1':            'Cylinder 1',
    'adv.cyl2':            'Cylinder 2',
    'adv.cyl3':            'Cylinder 3',
    'adv.cyl4':            'Cylinder 4',
    'adv.frontLeft':       'Front Left',
    'adv.frontRight':      'Front Right',
    'adv.rearLeft':        'Rear Left',
    'adv.rearRight':       'Rear Right',
    'adv.lonG':            'Longitudinal G',
    'adv.latG':            'Lateral G',
    'adv.tracCtrl':        'Traction Control',
    'adv.injA':            'Injector A',
    'adv.injB':            'Injector B',
    'adv.gpsSpeed':        'GPS Speed',
    'adv.signal':          '4G Signal',
    'adv.uptimeMin':       'Uptime (min)',
    'adv.uptimeSec':       'Uptime (sec)',
    'adv.coords':          'Coordinates',
    // Controls
    'ctrl.soon':           'Controls — coming soon',
    // Logs
    'logs.sessions':       'Sessions',
    'logs.channels':       'Channels',
    'logs.all':            'All',
    'logs.noSession':      'Select a session to view',
    'logs.noSessions':     'No recorded sessions',
    'logs.errSessions':    'Error reading logs',
    'logs.loading':        'Loading…',
    'logs.errLoad':        'Error loading session.',
    'logs.exporting':      'Exporting…',
    'logs.refreshTitle':   'Refresh list',
    'logs.exportTitle':    'Export selected session as CSV',
    'logs.openDirTitle':   'Open logs folder',
    'logs.gpsSection':     '⬡ GPS — Laps',
    'logs.showHideGps':    'Show/hide GPS section',
    // GPS tab
    'gps.positionTitle':   'GPS POSITION',
    'gps.latitude':        'Latitude',
    'gps.longitude':       'Longitude',
    'gps.speed':           'GPS Speed',
    'gps.track':           'Track',
    'gps.distance':        'Distance',
    'gps.lapTitle':        'LAP',
    'gps.lapsTitle':       'LAPS',
    'gps.deltaBest':       'Δ Best',
    'gps.noLaps':          'No recorded laps',
    'gps.mapOff':          '◐ Map: OFF',
    'gps.mapOn':           '◐ Map: ON',
    'gps.center':          '◎ Center on Car',
    'gps.startTiming':     '▶ Start Timing',
    'gps.stopTiming':      '⏹ Stop Timing',
    'gps.clearAll':        '✕ Clear All',
    'gps.lapNavHint':      'Click to navigate to this lap in the chart',
    'gps.lapCount':        (n) => `${n} lap${n === 1 ? '' : 's'}`,
    'gps.lapTooltip':      (n, t) => `Lap #${n} — ${t}`,
    'gps.best':            '◆ best',
    // Traction control
    'trac.active':         'Active',
    'trac.inactive':       'Inactive',
    // Channel groups
    'group.Engine':        'Engine',
    'group.Thermal':       'Thermal',
    'group.Pressure':      'Pressure',
    'group.EGT':           'EGT',
    'group.Brakes':        'Brakes',
    'group.Dynamics':      'Dynamics',
    // Serial
    'serial.port':         'PORT',
    'serial.baud':         'BAUD RATE',
    'serial.scan':         'Scan ports',
    'serial.noPorts':      'No ports found',
    'serial.connecting':   'Connecting to serial port…',
    'serial.failed':       'Cannot open port. Check the connection.',
    'serial.disconnected': 'Serial port disconnected.',
  },
  pt: {
    // Login
    'login.sub':           'Conexão ao Dashboard MQTT',
    'login.broker':        'MQTT BROKER',
    'login.topic':         'TÓPICO',
    'login.username':      'USUÁRIO',
    'login.password':      'SENHA',
    'login.connect':       'CONECTAR',
    'login.fillFields':    'Preencha o Broker e o Tópico.',
    'login.connecting':    'Conectando…',
    'login.failed':        'Falha na conexão. Verifique as configurações.',
    'login.disconnected':  'Desconectado do broker.',
    'login.error':         'Erro: ',
    // Tabs
    'tab.overview':        'Visão Geral',
    'tab.graphs':          'Gráficos',
    'tab.gps':             'GPS',
    'tab.advanced':        'Avançado',
    'tab.controls':        'Controles',
    'tab.logs':            'Logs',
    'tab.disconnect':      '⏻ Desconectar',
    // Overview
    'ov.gear':             'MARCHA',
    'ov.lambda':           'Lambda',
    'ov.fuelPress':        'Press. Comb.',
    'ov.oilPress':         'Press. Óleo',
    'ov.airTemp':          'Temp. Ar',
    // Graph
    'graph.clear':         '✕ Limpar',
    'graph.startLog':      'Iniciar Log',
    'graph.stopLog':       'Parar Log',
    'graph.session':       'Sessão #',
    'graph.noData':        'Aguardando dados de telemetria…',
    // Advanced — card titles
    'adv.engine':          'MOTOR',
    'adv.pressTemps':      'PRESSÕES & TEMPS',
    'adv.egt':             'ESCAPE — EGT',
    'adv.wheelSpeeds':     'VELOCIDADES DAS RODAS',
    'adv.brakeDisc':       'TEMP. DISCO DE FREIO',
    'adv.dynamics':        'DINÂMICA DO VEÍCULO',
    'adv.injection':       'INJEÇÃO',
    'adv.gpsTelemetry':    'GPS & TELEMETRIA',
    // Advanced — field labels
    'adv.coolant':         'Refrigerante',
    'adv.gear':            'Marcha',
    'adv.voltage':         'Tensão',
    'adv.intakeTemp':      'Temp. Admissão',
    'adv.oilTemp':         'Temp. Óleo',
    'adv.oilPressure':     'Pressão Óleo',
    'adv.fuelPressure':    'Pressão Comb.',
    'adv.cyl1':            'Cilindro 1',
    'adv.cyl2':            'Cilindro 2',
    'adv.cyl3':            'Cilindro 3',
    'adv.cyl4':            'Cilindro 4',
    'adv.frontLeft':       'Dianteiro Esq.',
    'adv.frontRight':      'Dianteiro Dir.',
    'adv.rearLeft':        'Traseiro Esq.',
    'adv.rearRight':       'Traseiro Dir.',
    'adv.lonG':            'G Longitudinal',
    'adv.latG':            'G Lateral',
    'adv.tracCtrl':        'Controle de Tração',
    'adv.injA':            'Injetor A',
    'adv.injB':            'Injetor B',
    'adv.gpsSpeed':        'Veloc. GPS',
    'adv.signal':          'Sinal 4G',
    'adv.uptimeMin':       'Uptime (min)',
    'adv.uptimeSec':       'Uptime (seg)',
    'adv.coords':          'Coordenadas',
    // Controls
    'ctrl.soon':           'Controles — em breve',
    // Logs
    'logs.sessions':       'Sessões',
    'logs.channels':       'Canais',
    'logs.all':            'Tudo',
    'logs.noSession':      'Selecione uma sessão para visualizar',
    'logs.noSessions':     'Nenhuma sessão gravada',
    'logs.errSessions':    'Erro ao ler logs',
    'logs.loading':        'Carregando…',
    'logs.errLoad':        'Erro ao carregar sessão.',
    'logs.exporting':      'Exportando…',
    'logs.refreshTitle':   'Atualizar lista',
    'logs.exportTitle':    'Exportar sessão selecionada como CSV',
    'logs.openDirTitle':   'Abrir pasta de logs',
    'logs.gpsSection':     '⬡ GPS — Voltas',
    'logs.showHideGps':    'Mostrar/ocultar seção GPS',
    // GPS tab
    'gps.positionTitle':   'POSIÇÃO GPS',
    'gps.latitude':        'Latitude',
    'gps.longitude':       'Longitude',
    'gps.speed':           'Veloc. GPS',
    'gps.track':           'Trilha',
    'gps.distance':        'Distância',
    'gps.lapTitle':        'VOLTA',
    'gps.lapsTitle':       'VOLTAS',
    'gps.deltaBest':       'Δ Melhor',
    'gps.noLaps':          'Sem voltas gravadas',
    'gps.mapOff':          '◐ Mapa: OFF',
    'gps.mapOn':           '◐ Mapa: ON',
    'gps.center':          '◎ Centrar no Carro',
    'gps.startTiming':     '▶ Iniciar Timing',
    'gps.stopTiming':      '⏹ Parar Timing',
    'gps.clearAll':        '✕ Limpar Tudo',
    'gps.lapNavHint':      'Clique para navegar para esta volta no gráfico',
    'gps.lapCount':        (n) => `${n} volta${n === 1 ? '' : 's'}`,
    'gps.lapTooltip':      (n, t) => `Volta #${n} — ${t}`,
    'gps.best':            '◆ melhor',
    // Traction control
    'trac.active':         'Ativo',
    'trac.inactive':       'Inativo',
    // Channel groups
    'group.Engine':        'Motor',
    'group.Thermal':       'Térmico',
    'group.Pressure':      'Pressão',
    'group.EGT':           'EGT',
    'group.Brakes':        'Freios',
    'group.Dynamics':      'Dinâmica',
    // Serial
    'serial.port':         'PORTA',
    'serial.baud':         'TAXA DE BAUD',
    'serial.scan':         'Escanear portas',
    'serial.noPorts':      'Nenhuma porta encontrada',
    'serial.connecting':   'Conectando à porta serial…',
    'serial.failed':       'Não foi possível abrir a porta. Verifique a conexão.',
    'serial.disconnected': 'Porta serial desconectada.',
  },
};

let currentLang = localStorage.getItem('ft.lang') || 'pt';

/** Translate a key; optional extra args are forwarded to function-valued entries. */
function T(key, ...args) {
  const dict = I18N[currentLang] ?? I18N.pt;
  const val  = dict[key] ?? I18N.pt[key] ?? key;
  return typeof val === 'function' ? val(...args) : val;
}

/**
 * Apply translations to every [data-i18n] element (textContent),
 * [data-i18n-title] (title attr), and known dynamic UI elements.
 */
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = T(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = T(el.dataset.i18nTitle);
  });
  // Sync language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
  // Dynamic elements whose text depends on app state
  const logLabel = document.getElementById('log-btn-label');
  if (logLabel) {
    const isLogging = document.getElementById('log-btn')?.classList.contains('logging');
    logLabel.textContent = T(isLogging ? 'graph.stopLog' : 'graph.startLog');
  }
  const timingBtn = document.getElementById('gps-timing-btn');
  if (timingBtn) {
    const isActive = timingBtn.classList.contains('active');
    timingBtn.textContent = T(isActive ? 'gps.stopTiming' : 'gps.startTiming');
  }
  const osmBtn = document.getElementById('gps-osm-btn');
  if (osmBtn) {
    const isOn = osmBtn.classList.contains('active');
    osmBtn.textContent = T(isOn ? 'gps.mapOn' : 'gps.mapOff');
  }
}

// ── Channel definitions (graph)
const CHANNELS = {
  rpm:           { label: 'RPM',        color: '#f72585', unit: '',     min: 0,   max: 12000, group: 'Engine'   },
  tps:           { label: 'TPS',        color: '#f59e0b', unit: '%',    min: 0,   max: 100,   group: 'Engine'   },
  speed_fr:      { label: 'Speed',      color: '#22c55e', unit: 'km/h', min: 0,   max: 150,   group: 'Engine'   },
  map_val:       { label: 'MAP',        color: '#a78bfa', unit: 'bar',  min: 0,   max: 1.5,   group: 'Engine'   },
  lambda:        { label: 'Lambda',     color: '#fb923c', unit: 'λ',    min: 0.5, max: 2.0,   group: 'Engine'   },
  bat:           { label: 'Battery',    color: '#fbbf24', unit: 'V',    min: 10,  max: 16,    group: 'Engine'   },
  gear:          { label: 'Gear',       color: '#6ee7b7', unit: '',     min: 0,   max: 6,     group: 'Engine'   },
  temp:          { label: 'Coolant',    color: '#ef4444', unit: '°C',   min: 30,  max: 150,   group: 'Thermal'  },
  oil_temp:      { label: 'Oil Temp',   color: '#f97316', unit: '°C',   min: 30,  max: 160,   group: 'Thermal'  },
  air_temp:      { label: 'Air Temp',   color: '#fca5a5', unit: '°C',   min: 0,   max: 60,    group: 'Thermal'  },
  oil_pressure:  { label: 'Oil Press',  color: '#60a5fa', unit: 'bar',  min: 0,   max: 10,    group: 'Pressure' },
  fuel_pressure: { label: 'Fuel Press', color: '#34d399', unit: 'bar',  min: 0,   max: 10,    group: 'Pressure' },
  egt1:          { label: 'EGT 1',      color: '#ff6b6b', unit: '°C',   min: 0,   max: 1000,  group: 'EGT'      },
  egt2:          { label: 'EGT 2',      color: '#ffa07a', unit: '°C',   min: 0,   max: 1000,  group: 'EGT'      },
  egt3:          { label: 'EGT 3',      color: '#ffd700', unit: '°C',   min: 0,   max: 1000,  group: 'EGT'      },
  egt4:          { label: 'EGT 4',      color: '#ff8c00', unit: '°C',   min: 0,   max: 1000,  group: 'EGT'      },
  brake_disc_temp_fl:  { label: 'Disc FL',    color: '#38bdf8', unit: '°C',   min: 0,   max: 600,   group: 'Brakes'   },
  brake_disc_temp_fr:  { label: 'Disc FR',    color: '#818cf8', unit: '°C',   min: 0,   max: 600,   group: 'Brakes'   },
  brake_disc_temp_rl:  { label: 'Disc RL',    color: '#a78bfa', unit: '°C',   min: 0,   max: 600,   group: 'Brakes'   },
  brake_disc_temp_rr:  { label: 'Disc RR',    color: '#c084fc', unit: '°C',   min: 0,   max: 600,   group: 'Brakes'   },
  g_force_a:     { label: 'G-Force A',  color: '#e879f9', unit: 'g',    min: -5,  max: 5,     group: 'Dynamics' },
  g_force_l:     { label: 'G-Force L',  color: '#818cf8', unit: 'g',    min: -5,  max: 5,     group: 'Dynamics' },
};

// History buffer — rolling in-memory store (default 10 min)
class HistoryBuffer {
  constructor(maxMs = 600_000) { this.maxMs = maxMs; this.data = []; }

  push(point) {
    const now = Date.now();
    this.data.push({ ts: now, ...point });
    // Trim front via binary search for efficiency
    const cutoff = now - this.maxMs;
    let lo = 0, hi = this.data.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.data[mid].ts < cutoff) lo = mid + 1; else hi = mid;
    }
    if (lo > 0) this.data.splice(0, lo);
  }

  /** Return data points within the last `seconds` seconds. */
  window(seconds) {
    const cutoff = Date.now() - seconds * 1000;
    let lo = 0, hi = this.data.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.data[mid].ts < cutoff) lo = mid + 1; else hi = mid;
    }
    return this.data.slice(lo);
  }

  clear() { this.data = []; }
  get length() { return this.data.length; }
}

// Gauge: ArcGauge — 270° sweep, racing-style
class ArcGauge {
  constructor(id, { min=0, max=100, title='', unit='', sections=[], decimals=0,
                    majorTicks=10, valueVisible=false }) {
    this.cvs = document.getElementById(id);
    this.ctx = this.cvs.getContext('2d');
    this.min = min; this.max = max; this.title = title; this.unit = unit;
    this.sections = [...sections].sort((a, b) => a.start - b.start); this.decimals = decimals;
    this.majorTicks = majorTicks; this.valueVisible = valueVisible;
    this.SA = (135 * Math.PI) / 180;  // start angle (lower-left)
    this.SW = (270 * Math.PI) / 180;  // sweep (clockwise)
    this._val = min; this._disp = min; this._peak = min; this._raf = null;
    this._draw();
    // Scale canvas to tile CSS size so it stays sharp at any window size
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => {
        const w = this.cvs.clientWidth, h = this.cvs.clientHeight;
        if (w > 0 && h > 0 && (this.cvs.width !== w || this.cvs.height !== h)) {
          this.cvs.width = w; this.cvs.height = h; this._draw();
        }
      });
      this._ro.observe(this.cvs);
    }
  }

  setValue(v) {
    this._val = Math.max(this.min, Math.min(this.max, v));
    if (this._val > this._peak) this._peak = this._val;
    this._animate();
  }

  resetPeak() { this._peak = this.min; }

  _animate() {
    if (this._raf) cancelAnimationFrame(this._raf);
    const diff = this._val - this._disp;
    if (Math.abs(diff) < (this.max - this.min) * 0.0008) {
      this._disp = this._val; this._draw(); return;
    }
    this._disp += diff * 0.2;
    this._draw();
    this._raf = requestAnimationFrame(() => this._animate());
  }

  // Draw segmented progress arc
  _drawProgressArc(ctx, cx, cy, r, lw) {
    if (this._disp <= this.min) return;
    const sorted = this.sections;  // pre-sorted in constructor
    const DEFAULT = '#f72585';
    const segs = [];
    let cursor = this.min;

    for (const sec of sorted) {
      if (cursor < this._disp && cursor < sec.start)
        segs.push({ from: cursor, to: Math.min(sec.start, this._disp), color: DEFAULT });
      if (sec.start < this._disp) {
        const from = Math.max(cursor, sec.start);
        const to   = Math.min(sec.end,   this._disp);
        if (from < to) segs.push({ from, to, color: sec.color });
      }
      cursor = sec.end;
    }
    if (cursor < this._disp) segs.push({ from: cursor, to: this._disp, color: DEFAULT });

    for (const seg of segs) {
      const a0 = this.SA + ((seg.from - this.min) / (this.max - this.min)) * this.SW;
      const a1 = this.SA + ((seg.to   - this.min) / (this.max - this.min)) * this.SW;
      if (a1 <= a0) continue;
      ctx.save();
      ctx.shadowColor = seg.color; ctx.shadowBlur = 22;
      ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1);
      ctx.strokeStyle = seg.color; ctx.lineWidth = lw; ctx.lineCap = 'butt';
      ctx.stroke();
      ctx.restore();
    }
  }

  _draw() {
    const ctx = this.ctx;
    const W = this.cvs.width, H = this.cvs.height;
    const cx = W / 2, cy = H * 0.52;
    const r  = Math.min(W, H) * 0.38;
    const { SA, SW } = this;
    const EA = SA + SW;

    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createRadialGradient(cx, cy, r * 0.05, cx, cy, r * 1.3);
    grad.addColorStop(0, '#1c1c1c'); grad.addColorStop(0.6, '#111'); grad.addColorStop(1, '#080808');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    ctx.beginPath(); ctx.arc(cx, cy, r + 18, SA, EA);
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.stroke();

    ctx.beginPath(); ctx.arc(cx, cy, r, SA, EA);
    ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 16; ctx.lineCap = 'butt'; ctx.stroke();

    for (const s of this.sections) {
      const a0 = SA + ((s.start - this.min) / (this.max - this.min)) * SW;
      const a1 = SA + ((s.end   - this.min) / (this.max - this.min)) * SW;
      ctx.save();
      ctx.shadowColor = s.color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(cx, cy, r + 10, a0, a1);
      ctx.strokeStyle = s.color + '88'; ctx.lineWidth = 5; ctx.stroke();
      ctx.restore();
    }

    this._drawProgressArc(ctx, cx, cy, r, 16);

    if (this._peak > this.min + (this.max - this.min) * 0.02) {
      const pA = SA + ((this._peak - this.min) / (this.max - this.min)) * SW;
      ctx.save();
      ctx.shadowColor = '#fff6'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(cx, cy, r, pA - 0.03, pA + 0.01);
      ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 16; ctx.stroke();
      ctx.restore();
    }

    const minN = this.majorTicks * 5;
    for (let i = 0; i <= minN; i++) {
      if (i % 5 === 0) continue;
      const a = SA + (i / minN) * SW;
      ctx.beginPath();
      ctx.moveTo(cx + (r - 10) * Math.cos(a), cy + (r - 10) * Math.sin(a));
      ctx.lineTo(cx + (r + 1)  * Math.cos(a), cy + (r + 1)  * Math.sin(a));
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1.2; ctx.stroke();
    }

    for (let i = 0; i <= this.majorTicks; i++) {
      const a  = SA + (i / this.majorTicks) * SW;
      const co = Math.cos(a), si = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cx + (r - 20) * co, cy + (r - 20) * si);
      ctx.lineTo(cx + (r + 3)  * co, cy + (r + 3)  * si);
      ctx.strokeStyle = '#666'; ctx.lineWidth = 2.5; ctx.stroke();

      const lv = this.min + (i / this.majorTicks) * (this.max - this.min);
      ctx.fillStyle = '#888';
      ctx.font = `bold ${Math.floor(H * 0.050)}px 'Courier New', monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lv.toFixed(this.decimals), cx + (r - 40) * co, cy + (r - 40) * si);
    }

    ctx.fillStyle = '#aaa';
    ctx.font = `bold ${Math.floor(H * 0.072)}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.title, cx, cy - r * 0.28);

    if (this.valueVisible) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.floor(H * 0.095)}px 'Courier New', monospace`;
      ctx.fillText(this._disp.toFixed(this.decimals), cx, cy + r * 0.62);
    }
    ctx.fillStyle = '#888';
    ctx.font = `${Math.floor(H * 0.055)}px Arial`;
    ctx.fillText(this.unit, cx, cy + r * (this.valueVisible ? 0.86 : 0.38));

    const va = SA + ((this._disp - this.min) / (this.max - this.min)) * SW;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(va);
    ctx.shadowColor = '#fffd'; ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(-r * 0.14, 0); ctx.lineTo(r * 0.91, 0);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5.5; ctx.lineCap = 'round'; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-r * 0.14, 0); ctx.lineTo(-r * 0.06, 0);
    ctx.strokeStyle = '#f72585'; ctx.lineWidth = 7; ctx.lineCap = 'butt'; ctx.stroke();
    ctx.restore();

    for (const [rr, fill] of [
      [r * 0.10, '#111'],
      [r * 0.07, '#1e1e1e'],
      [r * 0.046, '#f72585'],
      [r * 0.026, '#0d0d0d'],
    ]) {
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill();
    }
  }
}

// Gauge: SemiGauge — 180° arc, for Fuel and Temp
class SemiGauge {
  constructor(id, { min=0, max=1, title='', unit='', sections=[], decimals=0,
                    customLabels=null, valueVisible=true }) {
    this.cvs = document.getElementById(id);
    this.ctx = this.cvs.getContext('2d');
    this.min = min; this.max = max; this.title = title; this.unit = unit;
    this.sections = [...sections].sort((a, b) => a.start - b.start); this.decimals = decimals;
    this.customLabels = customLabels; this.valueVisible = valueVisible;
    this.SA = Math.PI;       // 180° — leftmost point
    this.SW = Math.PI;       // 180° sweep clockwise
    this._val = min; this._disp = min; this._raf = null;
    this._draw();
    // Scale canvas to tile CSS size so it stays sharp at any window size
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => {
        const w = this.cvs.clientWidth, h = this.cvs.clientHeight;
        if (w > 0 && h > 0 && (this.cvs.width !== w || this.cvs.height !== h)) {
          this.cvs.width = w; this.cvs.height = h; this._draw();
        }
      });
      this._ro.observe(this.cvs);
    }
  }

  setValue(v) {
    this._val = Math.max(this.min, Math.min(this.max, v));
    this._animate();
  }

  _animate() {
    if (this._raf) cancelAnimationFrame(this._raf);
    const diff = this._val - this._disp;
    if (Math.abs(diff) < (this.max - this.min) * 0.0008) {
      this._disp = this._val; this._draw(); return;
    }
    this._disp += diff * 0.2;
    this._draw();
    this._raf = requestAnimationFrame(() => this._animate());
  }

  _drawProgressArc(ctx, cx, cy, r, lw) {
    if (this._disp <= this.min) return;
    const sorted = this.sections;  // pre-sorted in constructor
    const DEFAULT = '#f72585';
    const segs = [];
    let cursor = this.min;

    for (const sec of sorted) {
      if (cursor < this._disp && cursor < sec.start)
        segs.push({ from: cursor, to: Math.min(sec.start, this._disp), color: DEFAULT });
      if (sec.start < this._disp) {
        const from = Math.max(cursor, sec.start);
        const to   = Math.min(sec.end,   this._disp);
        if (from < to) segs.push({ from, to, color: sec.color });
      }
      cursor = sec.end;
    }
    if (cursor < this._disp) segs.push({ from: cursor, to: this._disp, color: DEFAULT });

    for (const seg of segs) {
      const a0 = this.SA + ((seg.from - this.min) / (this.max - this.min)) * this.SW;
      const a1 = this.SA + ((seg.to   - this.min) / (this.max - this.min)) * this.SW;
      if (a1 <= a0) continue;
      ctx.save();
      ctx.shadowColor = seg.color; ctx.shadowBlur = 22;
      ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1);
      ctx.strokeStyle = seg.color; ctx.lineWidth = lw; ctx.lineCap = 'butt';
      ctx.stroke();
      ctx.restore();
    }
  }

  _draw() {
    const ctx = this.ctx;
    const W = this.cvs.width, H = this.cvs.height;
    const cx = W / 2, cy = H * 0.62;
    const r  = Math.min(W, H) * 0.35;
    const { SA, SW } = this;
    const EA = SA + SW;

    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createRadialGradient(cx, cy, r * 0.05, cx, cy, r * 1.3);
    grad.addColorStop(0, '#1c1c1c'); grad.addColorStop(0.6, '#111'); grad.addColorStop(1, '#080808');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    ctx.beginPath(); ctx.arc(cx, cy, r, SA, EA);
    ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 16; ctx.lineCap = 'butt'; ctx.stroke();

    this._drawProgressArc(ctx, cx, cy, r, 16);

    const N = (this.customLabels?.length ?? 1) - 1 || 4;
    for (let i = 0; i <= N; i++) {
      const a = SA + (i / N) * SW;
      const co = Math.cos(a), si = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cx + (r - 18) * co, cy + (r - 18) * si);
      ctx.lineTo(cx + (r + 3)  * co, cy + (r + 3)  * si);
      ctx.strokeStyle = '#666'; ctx.lineWidth = 2.5; ctx.stroke();

      const lv = this.customLabels
        ? this.customLabels[i]
        : (this.min + (i / N) * (this.max - this.min)).toFixed(this.decimals);
      if (lv !== '') {
        ctx.fillStyle = '#888';
        ctx.font = `bold ${Math.floor(H * 0.062)}px 'Courier New', monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(lv, cx + (r - 32) * co, cy + (r - 32) * si);
      }
    }

    ctx.fillStyle = '#999';
    ctx.font = `bold ${Math.floor(H * 0.060)}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.title, cx, cy - r - 26);

    if (this.valueVisible) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.floor(H * 0.095)}px 'Courier New', monospace`;
      ctx.fillText(this._disp.toFixed(this.decimals), cx, cy + r * 0.38);
    }
    if (this.unit) {
      ctx.fillStyle = '#888';
      ctx.font = `${Math.floor(H * 0.056)}px Arial`;
      ctx.fillText(this.unit, cx, cy + r * 0.68);
    }

    const va = SA + ((this._disp - this.min) / (this.max - this.min)) * SW;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(va);
    ctx.shadowColor = '#fffd'; ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(-r * 0.14, 0); ctx.lineTo(r * 0.91, 0);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5.5; ctx.lineCap = 'round'; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-r * 0.14, 0); ctx.lineTo(-r * 0.06, 0);
    ctx.strokeStyle = '#f72585'; ctx.lineWidth = 7; ctx.lineCap = 'butt'; ctx.stroke();
    ctx.restore();

    for (const [rr, fill] of [
      [r * 0.10, '#111'],
      [r * 0.07, '#1e1e1e'],
      [r * 0.046, '#f72585'],
      [r * 0.026, '#0d0d0d'],
    ]) {
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill();
    }
  }
}

// Gauge: LinearGauge — vertical bar with section zones + glow
class LinearGauge {
  constructor(id, { min=0, max=100, sections=[], barColor='#00e5ff' }) {
    this.cvs = document.getElementById(id);
    this.ctx = this.cvs.getContext('2d');
    this.min = min; this.max = max;
    this.sections = sections; this.barColor = barColor;
    this._val = min; this._draw();
    // Resize canvas when CSS layout changes (disc slots flex-grow, window resize)
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => {
        const w = this.cvs.clientWidth, h = this.cvs.clientHeight;
        if (w > 0 && h > 0 && (this.cvs.width !== w || this.cvs.height !== h)) {
          this.cvs.width = w; this.cvs.height = h; this._draw();
        }
      });
      this._ro.observe(this.cvs);
    }
  }

  setValue(v) { this._val = Math.max(this.min, Math.min(this.max, v)); this._draw(); }

  _draw() {
    const ctx = this.ctx;
    const W = this.cvs.width, H = this.cvs.height;
    const bW = Math.round(W * 0.44), bX = Math.round((W - bW) / 2);
    const bTop = Math.round(H * 0.04), bBot = Math.round(H * 0.96), bH = bBot - bTop;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 0, W, H);

    for (const s of this.sections) {
      const y1 = bTop + (1 - (s.end   - this.min) / (this.max - this.min)) * bH;
      const y2 = bTop + (1 - (s.start - this.min) / (this.max - this.min)) * bH;
      ctx.fillStyle = s.color; ctx.globalAlpha = 0.12;
      ctx.fillRect(bX, y1, bW, y2 - y1);
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 1;
    ctx.strokeRect(bX, bTop, bW, bH);

    const norm = (this._val - this.min) / (this.max - this.min);
    const fH   = norm * bH;
    const fY   = bTop + bH - fH;

    let fill = this.barColor;
    for (const s of this.sections) {
      if (this._val >= s.start && this._val < s.end) { fill = s.color; break; }
    }
    const last = this.sections[this.sections.length - 1];
    if (last && this._val >= last.end) fill = last.color;

    ctx.save();
    ctx.shadowColor = fill; ctx.shadowBlur = 10;
    ctx.fillStyle = fill;
    ctx.fillRect(bX, fY, bW, fH);
    ctx.restore();

    for (const s of this.sections.slice(0, -1)) {
      const divY = bTop + (1 - (s.end - this.min) / (this.max - this.min)) * bH;
      ctx.beginPath(); ctx.moveTo(bX, divY); ctx.lineTo(bX + bW, divY);
      ctx.strokeStyle = '#0d0d0d'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }
}

// LeafletGPSMap — Leaflet-based GPS track map with OSM toggle + lap timing
class LeafletGPSMap {
  constructor() {
    // Leaflet map instance (created lazily on first tab show)
    this.map          = null;
    this._osmLayer    = null;
    this._osmEnabled  = false;

    // Track data
    this.track       = [];   // [[lat, lon], ...]
    this._totalDist  = 0;

    // Leaflet layers
    this._trackLine   = null;  // full session path (dim)
    this._lapLine     = null;  // current lap path (bright)
    this._posMarker   = null;  // car position
    this._startMarker = null;  // session start
    this._finishMarker= null;  // finish line
    this._lapLines    = [];    // completed lap polylines
    this._lapHighlight= null;  // temp highlight on lap click

    // Lap timing
    this.lapTimingActive   = false;
    this._finishLine       = null;   // {lat, lon} — set automatically when timing starts
    this._currentLap       = null;   // {startTime, points: []}
    this._lapTimerHandle   = null;
    this._lastCrossingTime = 0;
    this.laps              = [];
    this.bestLap           = null;

    // DB persistence
    this._gpsSessionId   = null;   // row id in gps_sessions table
    this._autoStartedLog = false;  // true if GPS timing auto-started the telemetry log
  }

  // ── Init (called when tab first becomes visible)
  init(containerId) {
    if (this.map) { this.map.invalidateSize(); return; }

    this.map = L.map(containerId, {
      center: [-14.2, -51.9], zoom: 4,
      zoomControl: true, attributionControl: true,
    });

    // CartoDB dark_all — looks great with our dark UI
    this._osmLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd', maxZoom: 20,
      }
    );
    // OSM default ON
    this._osmLayer.addTo(this.map).bringToBack();
    this._osmEnabled = true;

    // Polylines — full track (dim) + current lap (bright)
    this._trackLine = L.polyline([], { color: '#4c1d95', weight: 2, opacity: 0.7 }).addTo(this.map);
    this._lapLine   = L.polyline([], { color: '#f72585', weight: 3, opacity: 1   }).addTo(this.map);

    // If data already arrived before map was visible, replay it
    if (this.track.length > 0) {
      this._trackLine.setLatLngs(this.track);
      this.map.fitBounds(L.latLngBounds(this.track), { padding: [30, 30] });
    }
  }

  toggleOSM() {
    if (!this.map) return false;
    this._osmEnabled = !this._osmEnabled;
    if (this._osmEnabled) this._osmLayer.addTo(this.map).bringToBack();
    else                  this._osmLayer.remove();
    return this._osmEnabled;
  }

  _placeFinishLine(lat, lon) {
    this._finishLine = { lat, lon };
    if (this._finishMarker) this._finishMarker.remove();
    if (!this.map) return;
    this._finishMarker = L.marker([lat, lon], {
      icon: L.divIcon({ html: '<div class="gps-finish-icon">⬡</div>', className: '', iconSize: [26,26], iconAnchor: [13,13] }),
      zIndexOffset: 1000,
    }).bindTooltip('Linha de chegada').addTo(this.map);
  }

  pushPoint(lat, lon) {
    if (!isFinite(lat) || !isFinite(lon)) return;
    if (Math.abs(lat) < 0.001 && Math.abs(lon) < 0.001) return;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return;

    const last = this.track[this.track.length - 1];
    if (last && Math.abs(last[0] - lat) < 1e-6 && Math.abs(last[1] - lon) < 1e-6) return;

    if (last) this._totalDist += _haversine(last[0], last[1], lat, lon);

    if (this.track.length >= 20000) this.track.shift();
    this.track.push([lat, lon]);

    if (this.map) {
      this._trackLine.addLatLng([lat, lon]);

      // Position marker (car dot)
      if (!this._posMarker) {
        this._posMarker = L.marker([lat, lon], {
          icon: L.divIcon({ html: '<div class="gps-car-dot"></div>', className: '', iconSize: [14,14], iconAnchor: [7,7] }),
          zIndexOffset: 2000,
        }).addTo(this.map);
        // First fix: center map on car
        this.map.setView([lat, lon], 17);
        // Place session-start marker
        this._startMarker = L.marker([lat, lon], {
          icon: L.divIcon({ html: '<div class="gps-finish-icon" style="color:#22c55e;text-shadow:0 0 12px #22c55e">★</div>', className: '', iconSize: [22,22], iconAnchor: [11,11] }),
        }).bindTooltip('Início').addTo(this.map);
      } else {
        this._posMarker.setLatLng([lat, lon]);
      }
    }

    // Lap timing
    if (this.lapTimingActive && this._currentLap) {
      this._currentLap.points.push([lat, lon]);
      if (this.map) this._lapLine.addLatLng([lat, lon]);
      this._checkCrossing(lat, lon);
    }

    setText('gps-pts',  this.track.length + ' pts');
    setText('gps-dist', _fmtMeters(this._totalDist));
  }

  centerOnCar() {
    if (!this.map || !this._posMarker) return;
    this.map.setView(this._posMarker.getLatLng(), Math.max(this.map.getZoom(), 16));
  }

  startTiming() {
    this.lapTimingActive = true;
    this._lastCrossingTime = 0;   // reset crossing cooldown

    // Auto-place finish line at current car position if none set
    if (!this._finishLine && this.track.length > 0) {
      const pos = this.track[this.track.length - 1];
      this._placeFinishLine(pos[0], pos[1]);
    }

    this._currentLap = {
      number:    this.laps.length + 1,
      startTime: Date.now(),
      startedAt: new Date().toISOString(),
      points:    this.track.length ? [this.track[this.track.length - 1]] : [],
      startTelTs: Date.now(),
    };
    if (this.map) this._lapLine.setLatLngs([]);

    document.getElementById('gps-timer-section').style.display = '';
    setText('gps-lap-num', this._currentLap.number);

    clearInterval(this._lapTimerHandle);
    this._lapTimerHandle = setInterval(() => this._tickTimer(), 80);

    document.getElementById('gps-timing-btn').textContent = T('gps.stopTiming');
    document.getElementById('gps-timing-btn').classList.add('active');

    // Persist: create GPS session linked to the active telemetry log session.
    // If no log is running, auto-start one so GPS laps and telemetry are captured together.
    this._gpsSessionId = null;
    const _startGpsSession = (logId) => {
      invoke('start_gps_session', { label: null, logSessionId: logId ?? null }).then(id => {
        this._gpsSessionId = id;
      }).catch(console.error);
    };

    if (logSessionId === null) {
      // Auto-start a combined telemetry + GPS log
      invoke('start_log').then(id => {
        logSessionId = id;
        logPacketCount = 0;
        const btn   = document.getElementById('log-btn');
        const label = document.getElementById('log-btn-label');
        if (btn)   btn.classList.add('logging');
        if (label) label.textContent = T('graph.stopLog');
        updateLogInfo();
        const info = document.getElementById('log-info');
        if (info) info.style.display = 'flex';
        this._autoStartedLog = true;
        _startGpsSession(logSessionId);
      }).catch(console.error);
    } else {
      this._autoStartedLog = false;
      _startGpsSession(logSessionId);
    }
  }

  stopTiming() {
    this.lapTimingActive = false;
    clearInterval(this._lapTimerHandle);
    document.getElementById('gps-timing-btn').textContent = T('gps.startTiming');
    document.getElementById('gps-timing-btn').classList.remove('active');

    // Persist: mark GPS session as stopped
    if (this._gpsSessionId !== null) {
      invoke('end_gps_session', { gpsSessionId: this._gpsSessionId }).catch(console.error);
      this._gpsSessionId = null;
    }

    // If we auto-started the telemetry log, stop it now
    if (this._autoStartedLog) {
      invoke('stop_log').catch(console.error);
      logSessionId   = null;
      logPacketCount = 0;
      const btn   = document.getElementById('log-btn');
      const label = document.getElementById('log-btn-label');
      if (btn)   btn.classList.remove('logging');
      if (label) label.textContent = T('graph.startLog');
      const info = document.getElementById('log-info');
      if (info) info.style.display = 'none';
      this._autoStartedLog = false;
    }
  }

  _checkCrossing(lat, lon) {
    if (!this._finishLine || !this._currentLap) return;
    const dist    = _haversine(lat, lon, this._finishLine.lat, this._finishLine.lon);
    const now     = Date.now();
    const elapsed = now - this._currentLap.startTime;
    // 10 m radius, lap must be >15 s, global 8 s cooldown prevents multi-fire
    if (dist < 10 && elapsed > 15000 && (now - this._lastCrossingTime) > 8000) {
      this._lastCrossingTime = now;
      this._completeLap();
    }
  }

  _completeLap() {
    const lapStartTime = this._currentLap.startTime;
    const duration = Date.now() - lapStartTime;

    // Gather telemetry stats from in-memory history buffer
    const t0 = this._currentLap.startTelTs;
    const lapData = history.data.filter(p => p.ts >= t0);
    const stats = lapData.length > 0 ? {
      maxSpeed: Math.max(...lapData.map(p => p.speed_fr)),
      avgSpeed: Math.round(lapData.reduce((s, p) => s + p.speed_fr, 0) / lapData.length),
      maxRPM:   Math.max(...lapData.map(p => p.rpm)),
    } : null;

    const lap = {
      number:    this._currentLap.number,
      startedAt: this._currentLap.startedAt,
      startTime: lapStartTime,
      duration,
      points:    [...this._currentLap.points],
      stats,
    };
    this.laps.push(lap);
    if (!this.bestLap || duration < this.bestLap.duration) this.bestLap = lap;

    // Persist lap to DB
    if (this._gpsSessionId !== null) {
      const pointsJson = lap.points.length ? JSON.stringify(lap.points) : null;
      invoke('save_lap', {
        gpsSessionId: this._gpsSessionId,
        lapNumber:    lap.number,
        startedAt:    lap.startedAt,
        startedAtMs:  lap.startTime,
        durationMs:   lap.duration,
        maxSpeedKmh:  stats?.maxSpeed ?? null,
        avgSpeedKmh:  stats ? stats.avgSpeed * 1.0 : null,
        maxRpm:       stats?.maxRPM ?? null,
        gpsPoints:    pointsJson,
      }).catch(console.error);
    }

    // Draw completed lap trace (colour cycles through a palette)
    if (this.map && lap.points.length > 1) {
      const palette = ['#a855f7','#818cf8','#38bdf8','#34d399','#fbbf24','#fb923c','#f43f5e'];
      const c = palette[(lap.number - 1) % palette.length];
      const ll = L.polyline(lap.points, { color: c, weight: 2, opacity: 0.85, dashArray: '5 3' }).addTo(this.map);
      this._lapLines.push(ll);
    }

    this._updateLapTable();

    // Auto-start next lap
    this._currentLap = {
      number:     this.laps.length + 1,
      startTime:  Date.now(),
      startedAt:  new Date().toISOString(),
      points:     this.track.length ? [this.track[this.track.length - 1]] : [],
      startTelTs: Date.now(),
    };
    if (this.map) this._lapLine.setLatLngs([]);
    setText('gps-lap-num', this._currentLap.number);
    setText('gps-delta', '—');
    document.getElementById('gps-delta').style.color = '';
  }

  _tickTimer() {
    if (!this._currentLap) return;
    const ms = Date.now() - this._currentLap.startTime;
    setText('gps-lap-timer', _fmtLapTime(ms));
    if (this.bestLap && ms > 2000) {
      const delta = ms - this.bestLap.duration;
      const el = document.getElementById('gps-delta');
      if (el) {
        el.textContent  = (delta >= 0 ? '+' : '') + _fmtLapTime(Math.abs(delta));
        el.style.color  = delta > 0 ? '#ef4444' : '#22c55e';
      }
    }
  }

  _updateLapTable() {
    const container = document.getElementById('gps-laps-list');
    if (!container) return;
    if (!this.laps.length) {
      container.innerHTML = `<div class="gps-no-laps">${T('gps.noLaps')}</div>`;
      return;
    }
    container.innerHTML = '';
    for (let i = this.laps.length - 1; i >= 0; i--) {
      const lap   = this.laps[i];
      const isBest = lap === this.bestLap;
      const isLast = i === this.laps.length - 1;
      const delta  = this.bestLap ? lap.duration - this.bestLap.duration : 0;

      const row = document.createElement('div');
      row.className = 'gps-lap-row' + (isBest ? ' lap-best' : '') + (isLast ? ' lap-last' : '');

      const deltaStr = isBest ? T('gps.best') : (delta >= 0 ? '+' : '') + _fmtLapTime(Math.abs(delta));
      const deltaClass = isBest ? 'neg' : delta > 0 ? 'pos' : 'neg';
      const statsLine = lap.stats
        ? `<div class="gps-lap-stats">${lap.stats.maxSpeed.toFixed(0)} km/h max · ${lap.stats.maxRPM} RPM</div>`
        : '';

      row.innerHTML =
        `<span class="gps-lap-n">#${lap.number}</span>` +
        `<span class="gps-lap-t">${_fmtLapTime(lap.duration)}</span>` +
        `<span class="gps-lap-d ${deltaClass}">${deltaStr}</span>` +
        statsLine;

      row.addEventListener('click', () => {
        if (this._lapHighlight) this._lapHighlight.remove();
        if (!this.map || lap.points.length < 2) return;
        this._lapHighlight = L.polyline(lap.points, { color: '#fff', weight: 4, opacity: 0.6 }).addTo(this.map);
        this.map.fitBounds(L.latLngBounds(lap.points), { padding: [40, 40] });
        setTimeout(() => { this._lapHighlight?.remove(); this._lapHighlight = null; }, 3000);
      });
      container.appendChild(row);
    }
  }

  clear() {
    // Close any open GPS session in DB
    if (this._gpsSessionId !== null) {
      invoke('end_gps_session', { gpsSessionId: this._gpsSessionId }).catch(console.error);
      this._gpsSessionId = null;
    }

    // If we auto-started the telemetry log, stop it now
    if (this._autoStartedLog) {
      invoke('stop_log').catch(console.error);
      logSessionId   = null;
      logPacketCount = 0;
      const btn   = document.getElementById('log-btn');
      const label = document.getElementById('log-btn-label');
      if (btn)   btn.classList.remove('logging');
      if (label) label.textContent = T('graph.startLog');
      const info = document.getElementById('log-info');
      if (info) info.style.display = 'none';
      this._autoStartedLog = false;
    }

    this.track = []; this._totalDist = 0;
    this.laps  = []; this.bestLap = null;
    this.lapTimingActive = false;
    this._lastCrossingTime = 0;
    clearInterval(this._lapTimerHandle);
    this._currentLap = null;

    if (this.map) {
      this._trackLine.setLatLngs([]);
      this._lapLine.setLatLngs([]);
      this._lapLines.forEach(l => l.remove()); this._lapLines = [];
      this._lapHighlight?.remove(); this._lapHighlight = null;
      if (this._posMarker)   { this._posMarker.remove();   this._posMarker   = null; }
      if (this._startMarker) { this._startMarker.remove(); this._startMarker = null; }
    }

    setText('gps-pts',       '0 pts');
    setText('gps-dist',      '—');
    setText('gps-lap-timer', '0:00.00');
    setText('gps-delta',     '—');
    document.getElementById('gps-timer-section').style.display = 'none';
    document.getElementById('gps-timing-btn').textContent      = T('gps.startTiming');
    document.getElementById('gps-timing-btn').classList.remove('active');
    // Remove finish line marker and reset state
    this._finishLine = null;
    if (this._finishMarker) { this._finishMarker.remove(); this._finishMarker = null; }
    this._updateLapTable();
  }
}

// ── Haversine distance (metres)
function _haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function _fmtMeters(m) {
  if (!m || m < 1) return '0 m';
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
}

// Format lap time as M:SS.ss (e.g., "1:23.45")
function _fmtLapTime(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const cs  = Math.floor((ms % 1000) / 10);
  return `${min}:${sec.toString().padStart(2,'0')}.${cs.toString().padStart(2,'0')}`;
}

// TelemetryChart — Chart.js wrapper with per-channel hidden Y axes
class TelemetryChart {
  constructor() {
    this.activeChannels = new Set(['rpm', 'tps', 'speed_fr']);
    this._chart = null;
    this._noDataEl = null;
    this._init();
  }

  _init() {
    // Destroy any pre-existing Chart.js instance bound to this canvas
    const canvas = document.getElementById('telemetry-chart');
    window.Chart.getChart(canvas)?.destroy();

    // Remove stale no-data overlay from a previous session
    document.querySelector('.graph-chart-wrap .graph-no-data')?.remove();

    // No-data overlay (added dynamically)
    const wrap = document.querySelector('.graph-chart-wrap');
    this._noDataEl = document.createElement('div');
    this._noDataEl.className = 'graph-no-data';
    this._noDataEl.textContent = T('graph.noData');
    wrap.appendChild(this._noDataEl);

    this._chart = new window.Chart(canvas, {
      type: 'line',
      data: { datasets: [] },
      options: {
        animation: false,
        parsing: false,
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111',
            borderColor: '#2a2a2a', borderWidth: 1,
            titleColor: '#555', bodyColor: '#ccc',
            callbacks: {
              title(items) {
                const ts = items[0]?.parsed?.x;
                if (!ts) return '';
                const s = Math.round((Date.now() - ts) / 1000);
                return s < 60 ? `${s}s ago` : `${(s/60).toFixed(1)}m ago`;
              },
              label(item) {
                const key = (item.dataset.yAxisID ?? '').replace('y_', '');
                const ch  = CHANNELS[key];
                if (!ch) return `${item.dataset.label}: ${item.parsed.y}`;
                return ` ${ch.label}: ${Number(item.parsed.y).toFixed(2)} ${ch.unit}`;
              },
            },
          },
        },
        scales: { x: this._xScale(60) },
      },
    });
  }

  _xScale(windowSecs) {
    const now = Date.now();
    return {
      type: 'linear',
      min: now - windowSecs * 1000,
      max: now,
      ticks: {
        callback(v) {
          const s = Math.round((now - v) / 1000);
          if (s === 0) return 'now';
          return s < 60 ? `${s}s` : `${(s/60).toFixed(1)}m`;
        },
        maxTicksLimit: 8, color: '#666', font: { size: 11 },
      },
      grid:   { color: '#1c1c1c' },
      border: { color: '#2a2a2a' },
    };
  }

  resize() { this._chart?.resize(); }

  toggleChannel(key) {
    if (this.activeChannels.has(key)) this.activeChannels.delete(key);
    else this.activeChannels.add(key);
  }

  update(histBuffer, windowSecs) {
    const rows = histBuffer.window(windowSecs);
    this._noDataEl.style.display = rows.length === 0 ? 'flex' : 'none';
    if (rows.length === 0) return;

    const now      = Date.now();
    const datasets = [];
    const scales   = { x: this._xScale(windowSecs) };

    for (const key of this.activeChannels) {
      const ch = CHANNELS[key];
      if (!ch) continue;
      datasets.push({
        label:           ch.label,
        yAxisID:         'y_' + key,
        data:            rows.map(r => ({ x: r.ts, y: r[key] ?? 0 })),
        borderColor:     ch.color,
        backgroundColor: ch.color + '14',
        borderWidth:     1.5,
        pointRadius:     0,
        tension:         0.3,
        fill:            false,
      });
      scales['y_' + key] = { type: 'linear', display: false, min: ch.min, max: ch.max };
    }

    this._chart.data.datasets       = datasets;
    this._chart.options.scales      = scales;
    this._chart.update('none');
  }

  destroy() { this._chart?.destroy(); }
}

// Globals
let gauges    = {};
let history   = new HistoryBuffer();
let telChart  = null;
let currentTab     = 'overview';
let graphWindow    = 60;          // seconds
let sessionStart   = null;
let sessionTimer   = null;
let _msgCount      = 0;
let _rateLast      = Date.now();

// ── Datalog
let logSessionId        = null;    // active session id (null = not logging)
let logPacketCount      = 0;
let logStartedGpsTiming = false;   // true when log button auto-started GPS timing

// ── GPS
let gpsMap = null;

// ── Log-viewer GPS map
let logViewSessionId = null;  // id of the session currently shown in log viewer

let lvGpsMap        = null;   // Leaflet map instance for Logs tab
let lvGpsMapMarker  = null;   // car position marker on log map
let lvGpsMapLayers  = [];     // polylines for current session
let lvGpsDataExists = false;  // true when the loaded session has GPS laps

// ── Log viewer
let logViewChart          = null;
let logViewActiveChannels = new Set(['rpm', 'tps', 'speed_fr']);
let logViewData           = [];   // TelemetryRow[] from get_session_data
let logViewZoomMs         = 0;    // 0 = show full session
let logViewOffsetMs       = 0;    // current pan position (ms from session start)
let logViewMaxOffset      = 0;    // totalMs - zoomMs (scrubber upper bound)
let logViewTotalMs        = 0;    // total duration of loaded session

// ── Reconnect cleanup
let _chartInterval = null;   // setInterval handle for graph update — cleared on reconnect
let _unlisteners   = [];     // Tauri event unlisten functions — cleared on reconnect

// ── helpers
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setTileState(id, state) {
  const t = document.getElementById(id);
  if (!t) return;
  t.classList.remove('tile-warn', 'tile-danger');
  if (state) t.classList.add('tile-' + state);
}

// Log viewer

// ── Helpers

function _fmtOffset(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60), ss = (s % 60).toString().padStart(2, '0');
  return `${m}m${ss}s`;
}

function _logXScale(xMin, xMax) {
  return {
    type: 'linear', min: xMin, max: xMax || 1,
    ticks: {
      callback: v => _fmtOffset(v),
      maxTicksLimit: 10, color: '#666', font: { size: 11 },
    },
    grid:   { color: '#1c1c1c' },
    border: { color: '#2a2a2a' },
  };
}

// ── Scrubber state → UI sync

function _syncScrubber() {
  const scrubber = document.getElementById('log-scrubber');
  const display  = document.getElementById('lv-time-display');
  if (!scrubber) return;

  const canScrub = logViewZoomMs > 0 && logViewMaxOffset > 0;
  scrubber.disabled = !canScrub;

  if (canScrub) {
    // Normalize offset to 0-1000 integer so the step=1 slider is always smooth
    scrubber.value = Math.round((logViewOffsetMs / logViewMaxOffset) * 1000);
  } else {
    scrubber.value = 0;
  }

  const zoomMs = logViewZoomMs || logViewTotalMs;
  const endMs  = Math.min(logViewOffsetMs + zoomMs, logViewTotalMs);
  display.textContent = logViewTotalMs > 0
    ? `${_fmtOffset(logViewOffsetMs)} – ${_fmtOffset(endMs)}`
    : '—';
}

// ── Chart render

function _initLogViewChart() {
  // Destroy pre-existing Chart.js instance so the canvas can be reused
  if (logViewChart) { logViewChart.destroy(); logViewChart = null; }
  const canvas = document.getElementById('log-chart');
  logViewChart = new window.Chart(canvas, {
    type: 'line',
    data: { datasets: [] },
    options: {
      animation: false, parsing: false,
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111', borderColor: '#2a2a2a', borderWidth: 1,
          titleColor: '#555', bodyColor: '#ccc',
          callbacks: {
            title: items => _fmtOffset(items[0]?.parsed?.x ?? 0),
            label(item) {
              const key = (item.dataset.yAxisID ?? '').replace('y_', '');
              const ch  = CHANNELS[key];
              return ch ? ` ${ch.label}: ${Number(item.parsed.y).toFixed(2)} ${ch.unit}` : '';
            },
          },
        },
      },
      scales: { x: _logXScale(0, 1) },
    },
  });
}

function updateLogViewChart() {
  if (!logViewChart) return;
  const noData = document.getElementById('log-no-data');

  if (!logViewData.length) {
    noData.style.display = 'flex';
    logViewChart.data.datasets = [];
    logViewChart.update('none');
    _syncScrubber();
    return;
  }
  noData.style.display = 'none';

  // ts_ms fallback: if all rows are 0 (pre-migration schema), use index * 100 ms
  const allZero = logViewData.every(r => r.ts_ms === 0);
  const t0      = allZero ? 0 : logViewData[0].ts_ms;
  const xOf     = (r, i) => allZero ? i * 100 : r.ts_ms - t0;
  const totalMs = allZero
    ? (logViewData.length - 1) * 100
    : logViewData[logViewData.length - 1].ts_ms - t0;

  logViewTotalMs  = totalMs;
  const zoomMs    = logViewZoomMs || totalMs;           // 0 = full
  logViewMaxOffset = Math.max(0, totalMs - zoomMs);
  logViewOffsetMs  = Math.min(logViewOffsetMs, logViewMaxOffset); // clamp on zoom change

  const xMin = logViewOffsetMs;
  const xMax = logViewOffsetMs + Math.min(zoomMs, totalMs);

  _syncScrubber();

  const datasets = [];
  const scales   = { x: _logXScale(xMin, xMax) };

  for (const key of logViewActiveChannels) {
    const ch = CHANNELS[key];
    if (!ch) continue;
    datasets.push({
      label:           ch.label,
      yAxisID:         'y_' + key,
      data:            logViewData.map((r, i) => ({ x: xOf(r, i), y: r[key] ?? 0 })),
      borderColor:     ch.color,
      backgroundColor: ch.color + '14',
      borderWidth:     1.5,
      pointRadius:     0,
      tension:         0.3,
      fill:            false,
    });
    scales['y_' + key] = { type: 'linear', display: false, min: ch.min, max: ch.max };
  }

  logViewChart.data.datasets  = datasets;
  logViewChart.options.scales = scales;
  logViewChart.update('none');

  // Sync car position on the log GPS map
  _updateLogMapPosition();
}

// ── Controls wiring

function _initLogViewControls() {
  // Zoom buttons
  document.querySelectorAll('.lv-zoom-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.lv-zoom-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      logViewZoomMs = parseInt(btn.dataset.ms);
      // Keep current scroll position clamped to new window
      updateLogViewChart();
    };
  });

  // Scrubber — normalized 0-1000 → actual ms offset
  document.getElementById('log-scrubber').oninput = e => {
    if (logViewMaxOffset > 0) {
      logViewOffsetMs = Math.round((parseInt(e.target.value) / 1000) * logViewMaxOffset);
      updateLogViewChart();
    }
  };
}

// ── Session list

async function loadSessionData(sessionId, itemEl) {
  document.querySelectorAll('.session-item').forEach(e => e.classList.remove('active'));
  itemEl.classList.add('active');
  logViewSessionId = sessionId;
  logViewOffsetMs  = 0;
  // Enable the export button now that a session is selected
  const exportBtn = document.getElementById('export-csv-btn');
  if (exportBtn) exportBtn.disabled = false;
  const noData = document.getElementById('log-no-data');
  noData.textContent = T('logs.loading');
  noData.style.display = 'flex';
  // Hide GPS section while loading
  document.getElementById('lv-gps-section').style.display = 'none';
  try {
    logViewData = await invoke('get_session_data', { sessionId });
    updateLogViewChart();
  } catch (err) {
    noData.textContent = T('logs.errLoad');
    console.error(err);
  }
  // Load GPS laps linked to this log session (independent of chart)
  _loadGpsLapsForLog(sessionId);
}

// ── Log-viewer map helpers

function _initLvMap() {
  if (lvGpsMap) {
    setTimeout(() => lvGpsMap.invalidateSize(), 60);
    return;
  }
  lvGpsMap = L.map('lv-map', {
    center: [-14.2, -51.9], zoom: 4,
    zoomControl: true, attributionControl: false,
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '', subdomains: 'abcd', maxZoom: 20,
  }).addTo(lvGpsMap);
}

function _clearLvMapLayers() {
  lvGpsMapLayers.forEach(l => l.remove());
  lvGpsMapLayers = [];
  if (lvGpsMapMarker) { lvGpsMapMarker.remove(); lvGpsMapMarker = null; }
}

function _drawLvTrackFromTelemetry() {
  if (!lvGpsMap || !logViewData.length) return;
  const pts = [];
  for (const row of logViewData) {
    if (!row.gps_pos) continue;
    const p = row.gps_pos.split(',').map(s => parseFloat(s.trim()));
    if (p.length >= 2 && isFinite(p[0]) && isFinite(p[1]) &&
        !(Math.abs(p[0]) < 0.001 && Math.abs(p[1]) < 0.001)) {
      pts.push([p[0], p[1]]);
    }
  }
  if (pts.length < 2) return;
  const line = L.polyline(pts, { color: '#2a2a2a', weight: 2, opacity: 0.9 }).addTo(lvGpsMap);
  lvGpsMapLayers.push(line);
  lvGpsMap.fitBounds(L.latLngBounds(pts), { padding: [20, 20] });
}

async function _drawLvLapTraces(laps) {
  if (!lvGpsMap || !laps.length) return;
  const palette = ['#a855f7','#818cf8','#38bdf8','#34d399','#fbbf24','#fb923c','#f43f5e'];
  const allPts  = [];
  for (const lap of laps) {
    try {
      const json = await invoke('get_lap_points', { lapId: lap.id });
      if (!json) continue;
      const pts = JSON.parse(json);
      if (!pts.length) continue;
      allPts.push(...pts);
      const c    = palette[(lap.lap_number - 1) % palette.length];
      const line = L.polyline(pts, { color: c, weight: 2.5, opacity: 0.95 })
        .bindTooltip(T('gps.lapTooltip', lap.lap_number, _fmtLapTime(lap.duration_ms)))
        .addTo(lvGpsMap);
      lvGpsMapLayers.push(line);
    } catch (_) {}
  }
  if (allPts.length > 1) {
    lvGpsMap.fitBounds(L.latLngBounds(allPts), { padding: [24, 24] });
  }
}

function _updateLogMapPosition() {
  if (!lvGpsMap || !logViewData.length) return;
  const mapWrap = document.getElementById('lv-gps-map-wrap');
  if (!mapWrap || mapWrap.style.display === 'none') return;

  const allZero = logViewData.every(r => r.ts_ms === 0);
  const t0 = allZero ? 0 : logViewData[0].ts_ms;

  const zoomMs    = logViewZoomMs || logViewTotalMs;
  const centerRel = logViewOffsetMs + zoomMs / 2;
  const getMs     = (i) => allZero ? i * 100 : logViewData[i].ts_ms - t0;

  // Binary search for closest row to centerRel
  let lo = 0, hi = logViewData.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (getMs(mid) < centerRel) lo = mid + 1; else hi = mid;
  }
  if (lo > 0 && Math.abs(getMs(lo - 1) - centerRel) < Math.abs(getMs(lo) - centerRel)) lo--;

  const row = logViewData[lo];
  if (!row?.gps_pos) return;
  const parts = row.gps_pos.split(',').map(s => parseFloat(s.trim()));
  if (parts.length < 2 || !isFinite(parts[0]) || !isFinite(parts[1])) return;
  if (Math.abs(parts[0]) < 0.001 && Math.abs(parts[1]) < 0.001) return;

  if (!lvGpsMapMarker) {
    lvGpsMapMarker = L.marker([parts[0], parts[1]], {
      icon: L.divIcon({ html: '<div class="gps-car-dot"></div>', className: '', iconSize: [14,14], iconAnchor: [7,7] }),
      zIndexOffset: 2000,
    }).addTo(lvGpsMap);
  } else {
    lvGpsMapMarker.setLatLng([parts[0], parts[1]]);
  }
}

async function _loadGpsLapsForLog(logSessionId) {
  const section = document.getElementById('lv-gps-section');
  const lapsEl  = document.getElementById('lv-gps-laps');
  const metaEl  = document.getElementById('lv-gps-meta');

  // Clear previous session's map data immediately
  _clearLvMapLayers();
  lvGpsDataExists = false;

  try {
    const gps = await invoke('get_gps_session_for_log', { logSessionId });
    if (!gps || !gps.laps.length) { section.style.display = 'none'; return; }
    lvGpsDataExists = true;

    const best = gps.laps.reduce((a, b) => b.duration_ms < a.duration_ms ? b : a);
    metaEl.textContent = T('gps.lapCount', gps.laps.length);
    lapsEl.innerHTML = '';

    const allZero = logViewData.every(r => r.ts_ms === 0);
    for (const lap of gps.laps) {
      const isBest   = lap.id === best.id;
      const delta    = lap.duration_ms - best.duration_ms;
      const deltaStr = isBest ? T('gps.best') : (delta >= 0 ? '+' : '') + _fmtLapTime(Math.abs(delta));
      const dClass   = isBest ? 'neg' : delta > 0 ? 'pos' : 'neg';
      const canNav   = lap.started_at_ms != null && logViewData.length > 0 && !allZero;
      const row = document.createElement('div');
      row.className = 'lv-gps-lap-row' + (isBest ? ' lap-best' : '') + (canNav ? ' lap-navigable' : '');
      row.title = canNav ? T('gps.lapNavHint') : '';
      row.innerHTML =
        `<span class="gps-lap-n">#${lap.lap_number}</span>` +
        `<span class="gps-lap-t">${_fmtLapTime(lap.duration_ms)}</span>` +
        `<span class="gps-lap-d ${dClass}">${deltaStr}</span>` +
        (lap.max_speed_kmh != null
          ? `<span class="lv-gps-stat">${lap.max_speed_kmh.toFixed(0)} km/h</span>` +
            `<span class="lv-gps-stat">${lap.max_rpm ?? '—'} RPM</span>`
          : '') +
        (canNav ? `<span class="lv-gps-nav-hint">↑ gráfico</span>` : '');

      if (canNav) {
        row.addEventListener('click', () => {
          const t0 = logViewData[0].ts_ms;
          const lapStartOffset = lap.started_at_ms - t0;
          if (lapStartOffset < 0 || lapStartOffset > logViewTotalMs) return;
          logViewZoomMs   = lap.duration_ms + 10000;
          logViewOffsetMs = Math.max(0, lapStartOffset - 5000);
          document.querySelectorAll('.lv-zoom-btn').forEach(b => b.classList.remove('active'));
          updateLogViewChart();
          document.querySelectorAll('.lv-gps-lap-row').forEach(r => r.classList.remove('lap-active'));
          row.classList.add('lap-active');
        });
      }
      lapsEl.appendChild(row);
    }

    const gpsToggleOn = document.getElementById('lv-gps-toggle')?.checked !== false;
    section.style.display = gpsToggleOn ? '' : 'none';
    if (!gpsToggleOn) return;

    // Populate GPS map (always visible — no map-only toggle)
    setTimeout(async () => {
      _initLvMap();
      _drawLvTrackFromTelemetry();
      await _drawLvLapTraces(gps.laps);
      _updateLogMapPosition();
    }, 60);
  } catch (_) {
    section.style.display = 'none';
  }
}

async function refreshSessions() {
  const list = document.getElementById('session-list');
  list.innerHTML = '';
  try {
    const sessions = await invoke('list_sessions');
    if (!sessions.length) {
      list.innerHTML = `<div class="session-empty">${T('logs.noSessions')}</div>`;
      return;
    }
    for (const s of sessions) {
      const el = document.createElement('div');
      el.className = 'session-item';
      const recBadge = s.stopped_at ? '' : ' <span style="color:var(--red)">●</span>';
      const gpsBadge = s.has_gps ? '<span class="session-gps-badge">⬡ GPS</span>' : '';
      el.innerHTML =
        `<div class="session-item-top">` +
          `<span class="session-id">#${s.id}${recBadge}</span>` +
          `<span class="session-pkts">${s.packet_count} pkts</span>` +
        `</div>` +
        `<div class="session-item-bottom">` +
          `<span class="session-time">${s.started_at.replace('T', ' ').replace('Z', '')}</span>` +
          gpsBadge +
        `</div>`;
      el.addEventListener('click', () => loadSessionData(s.id, el));
      list.appendChild(el);
    }
  } catch (err) {
    list.innerHTML = `<div class="session-empty">${T('logs.errSessions')}</div>`;
    console.error(err);
  }
}

// ── Init

function initLogViewer() {
  _initLogViewChart();
  _initLogViewControls();

  buildChannelListDOM(
    document.getElementById('logview-channel-list'),
    logViewActiveChannels,
    () => updateLogViewChart(),
  );

  document.getElementById('refresh-sessions-btn').onclick = refreshSessions;
  document.getElementById('open-log-dir-btn').onclick = () =>
    invoke('open_log_dir').catch(console.error);

  document.getElementById('export-csv-btn').onclick = async () => {
    if (!logViewSessionId) return;
    const btn    = document.getElementById('export-csv-btn');
    const status = document.getElementById('lv-export-status');
    btn.disabled = true;
    status.textContent = T('logs.exporting');
    status.className   = 'lv-export-status';
    try {
      const path = await invoke('export_session_csv', { sessionId: logViewSessionId });
      status.textContent = '✓ ' + path;
      status.className   = 'lv-export-status ok';
    } catch (err) {
      if (err === 'cancelled') {
        status.textContent = '';
      } else {
        status.textContent = '✗ ' + err;
        status.className   = 'lv-export-status err';
      }
    } finally {
      btn.disabled = false;
      // Clear status after 5 s
      setTimeout(() => { if (status) status.textContent = ''; }, 5000);
    }
  };

  // GPS section toggle — shows/hides the entire GPS section
  document.getElementById('lv-gps-toggle').onchange = e => {
    const section = document.getElementById('lv-gps-section');
    if (e.target.checked && lvGpsDataExists) {
      section.style.display = '';
      setTimeout(() => {
        if (lvGpsMap) lvGpsMap.invalidateSize();
        _updateLogMapPosition();
      }, 60);
    } else {
      section.style.display = 'none';
    }
  };

  invoke('get_log_dir').then(p => setText('log-dir-path', p)).catch(() => {});
  refreshSessions();
}

// Datalog controls
async function toggleLog() {
  const btn   = document.getElementById('log-btn');
  const label = document.getElementById('log-btn-label');

  if (logSessionId === null) {
    // Start log + GPS timing
    try {
      btn.disabled = true;
      const id = await invoke('start_log');
      logSessionId   = id;
      logPacketCount = 0;
      btn.classList.add('logging');
      label.textContent = T('graph.stopLog');
      updateLogInfo();
      document.getElementById('log-info').style.display = 'flex';

      // Always start GPS timing together (unified log)
      if (gpsMap && !gpsMap.lapTimingActive) {
        logStartedGpsTiming = true;
        // logSessionId is now set, so startTiming() will link GPS session to it
        gpsMap.startTiming();
      }
    } catch (err) {
      console.error('start_log failed:', err);
    } finally {
      btn.disabled = false;
    }
  } else {
    // Stop log + GPS timing
    try {
      btn.disabled = true;
      await invoke('stop_log');
    } catch (err) {
      console.error('stop_log failed:', err);
    } finally {
      // Stop GPS timing if the log button started it
      if (logStartedGpsTiming && gpsMap && gpsMap.lapTimingActive) {
        gpsMap._autoStartedLog = false;  // prevent double stop_log
        gpsMap.stopTiming();
        logStartedGpsTiming = false;
      }
      logSessionId   = null;
      logPacketCount = 0;
      btn.classList.remove('logging');
      label.textContent = T('graph.startLog');
      document.getElementById('log-info').style.display = 'none';
      btn.disabled = false;
    }
  }
}

function updateLogInfo() {
  setText('log-session-id', logSessionId ?? '—');
  setText('log-pkt-count',  logPacketCount);
}

// Init gauges
function initGauges() {
  gauges.rpm = new ArcGauge('rpm-canvas', {
    min: 0, max: 12, title: 'RPM', unit: 'x1000',
    decimals: 0, majorTicks: 12, valueVisible: false,
    sections: [{ start: 10.5, end: 12, color: '#ef4444' }],
  });
  gauges.speed = new ArcGauge('speed-canvas', {
    min: 0, max: 150, title: 'SPEED', unit: 'km/h',
    decimals: 0, majorTicks: 10, valueVisible: true, sections: [],
  });
  gauges.map = new ArcGauge('map-canvas', {
    min: 0, max: 1.5, title: 'MAP', unit: 'BAR',
    decimals: 2, majorTicks: 5, valueVisible: true, sections: [],
  });
  gauges.fuel = new SemiGauge('fuel-canvas', {
    min: 0, max: 1, title: 'FUEL', unit: '', decimals: 2, valueVisible: false,
    customLabels: ['E', '', '1/2', '', 'F'],
    sections: [
      { start: 0,   end: 0.2, color: '#ef4444' },
      { start: 0.2, end: 1.0, color: '#22c55e' },
    ],
  });
  gauges.temp = new SemiGauge('temp-canvas', {
    min: 30, max: 150, title: 'TEMP', unit: '°C', decimals: 0, valueVisible: true,
    sections: [
      { start:  30, end:  85, color: '#1e90ff' },
      { start:  85, end: 115, color: '#22c55e' },
      { start: 115, end: 150, color: '#ef4444' },
    ],
  });
  gauges.tps = new LinearGauge('tps-canvas', {
    min: 0, max: 100, barColor: '#f59e0b',
    sections: [
      { start:  0, end:  30, color: '#22c55e' },
      { start: 30, end:  70, color: '#f59e0b' },
      { start: 70, end: 100, color: '#ef4444' },
    ],
  });

  const DISC_SEC = [
    { start:   0, end:  80, color: '#1e90ff' },
    { start:  80, end: 200, color: '#84cc16' },
    { start: 200, end: 350, color: '#f97316' },
    { start: 350, end: 600, color: '#ef4444' },
  ];
  gauges.discFL = new LinearGauge('disc-fl', { min: 0, max: 600, sections: DISC_SEC });
  gauges.discRL = new LinearGauge('disc-rl', { min: 0, max: 600, sections: DISC_SEC });
  gauges.discFR = new LinearGauge('disc-fr', { min: 0, max: 600, sections: DISC_SEC });
  gauges.discRR = new LinearGauge('disc-rr', { min: 0, max: 600, sections: DISC_SEC });
}

// Init graph
function initChart() {
  telChart = new TelemetryChart();
  _buildChannelList();
  _initGraphControls();

  // Update chart every 500 ms when graph tab is active
  _chartInterval = setInterval(() => {
    if (currentTab !== 'graph' || !telChart) return;
    telChart.update(history, graphWindow);
    setText('graph-pts', history.length + ' pts');
    setText('sb-pts',    history.length + ' pts');
  }, 500);
}

/**
 * Build a channel toggle list (with group headers that toggle all in group).
 * @param {HTMLElement} container  The element to populate
 * @param {Set<string>} activeSet  The set of active channel keys (mutated in place)
 * @param {Function}    onChange   Called whenever the selection changes
 */
function buildChannelListDOM(container, activeSet, onChange) {
  container.innerHTML = '';
  const groups = {};
  for (const [key, ch] of Object.entries(CHANNELS)) {
    (groups[ch.group] ??= []).push({ key, ch });
  }

  for (const [group, items] of Object.entries(groups)) {
    // Group header
    const header = document.createElement('div');
    header.className = 'ch-group-header';

    const labelEl = document.createElement('span');
    labelEl.className = 'ch-group-label-text';
    labelEl.textContent = T('group.' + group);

    const groupBtn = document.createElement('button');
    groupBtn.className = 'ch-group-toggle-btn';

    const syncGroupBtn = () => {
      const n = items.filter(({key}) => activeSet.has(key)).length;
      groupBtn.textContent = `${n}/${items.length}`;
      groupBtn.classList.toggle('all-active', n === items.length);
      groupBtn.classList.toggle('some-active', n > 0 && n < items.length);
    };
    syncGroupBtn();

    groupBtn.addEventListener('click', () => {
      const allActive = items.every(({key}) => activeSet.has(key));
      for (const {key} of items) {
        allActive ? activeSet.delete(key) : activeSet.add(key);
        const itemEl = container.querySelector(`[data-ch="${key}"]`);
        if (itemEl) itemEl.classList.toggle('active', !allActive);
      }
      syncGroupBtn();
      onChange();
    });

    header.appendChild(labelEl);
    header.appendChild(groupBtn);
    container.appendChild(header);

    // Individual channel toggles
    for (const { key, ch } of items) {
      const el = document.createElement('div');
      el.className = 'ch-toggle' + (activeSet.has(key) ? ' active' : '');
      el.dataset.ch = key;
      el.innerHTML =
        `<span class="ch-dot" style="background:${ch.color}"></span>` +
        `<span class="ch-name">${ch.label}</span>` +
        `<span class="ch-unit">${ch.unit}</span>`;
      el.addEventListener('click', () => {
        activeSet.has(key) ? activeSet.delete(key) : activeSet.add(key);
        el.classList.toggle('active');
        syncGroupBtn();
        onChange();
      });
      container.appendChild(el);
    }
  }
}

function _buildChannelList() {
  buildChannelListDOM(
    document.getElementById('channel-list'),
    telChart.activeChannels,
    () => { /* chart updates on interval */ },
  );
}

function _initGraphControls() {
  document.querySelectorAll('.tr-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tr-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      graphWindow = parseInt(btn.dataset.s);
    };
  });
  document.getElementById('clear-history-btn').onclick = () => {
    history.clear();
  };
}

// GPS Map init
function initGPSMap() {
  // Remove the old Leaflet map so the container can be re-used on reconnect
  if (gpsMap?.map) { gpsMap.map.remove(); }
  // Also clean up the log-viewer Leaflet map
  if (lvGpsMap) { lvGpsMap.remove(); lvGpsMap = null; lvGpsMapMarker = null; lvGpsMapLayers = []; }

  gpsMap = new LeafletGPSMap();

  // Sync button to match the default ON state of the map
  const _osmBtn = document.getElementById('gps-osm-btn');
  _osmBtn.textContent = T('gps.mapOn');
  _osmBtn.classList.add('active');

  // Use .onclick so re-registration replaces the previous handler (no duplicates)
  _osmBtn.onclick = () => {
    const on = gpsMap.toggleOSM();
    _osmBtn.textContent = T(on ? 'gps.mapOn' : 'gps.mapOff');
    _osmBtn.classList.toggle('active', on);
  };

  document.getElementById('gps-center-btn').onclick  = () => gpsMap.centerOnCar();
  document.getElementById('gps-timing-btn').onclick  = () => {
    if (gpsMap.lapTimingActive) gpsMap.stopTiming();
    else                        gpsMap.startTiming();
  };
  document.getElementById('gps-clear-btn').onclick   = () => gpsMap.clear();
}

// Tabs
function initTabs() {
  document.querySelectorAll('#tab-bar .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#tab-bar .tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      document.getElementById('tab-' + currentTab).classList.add('active');

      if (currentTab === 'overview') {
        // WebKit discards canvas backing stores when hidden — force redraw
        requestAnimationFrame(() => {
          Object.values(gauges).forEach(g => g._draw?.());
        });
      }
      if (currentTab === 'graph') {
        requestAnimationFrame(() => telChart?.resize());
      }
      if (currentTab === 'logs') {
        requestAnimationFrame(() => logViewChart?.resize());
        refreshSessions();
      }
      if (currentTab === 'gps') {
        // Init Leaflet on first show; subsequent shows just fix the size
        requestAnimationFrame(() => gpsMap?.init('gps-map'));
      }
    };
  });
}

// Status bar
function startSession(broker) {
  sessionStart = Date.now();
  document.getElementById('status-dot').classList.add('connected');
  setText('sb-broker', broker.replace('tcp://', ''));
  sessionTimer = setInterval(() => {
    const s  = Math.floor((Date.now() - sessionStart) / 1000);
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    setText('sb-session', mm + ':' + ss);
  }, 1000);
}

function stopSession() {
  clearInterval(sessionTimer);
  sessionTimer = null;
  sessionStart = null;
  document.getElementById('status-dot').classList.remove('connected');
  setText('sb-broker', '—');
  setText('sb-session', '00:00');
  setText('sb-rate', '0 msg/s');
  setText('sb-pts', '0 pts');
  _msgCount = 0;

  // Auto-stop GPS timing and datalog if still active
  if (gpsMap && gpsMap.lapTimingActive) {
    gpsMap._autoStartedLog = false;
    gpsMap.stopTiming();
    logStartedGpsTiming = false;
  }
  if (logSessionId !== null) {
    invoke('stop_log').catch(() => {});
    logSessionId   = null;
    logPacketCount = 0;
    const btn = document.getElementById('log-btn');
    if (btn) {
      btn.classList.remove('logging');
      setText('log-btn-label', T('graph.startLog'));
    }
    const info = document.getElementById('log-info');
    if (info) info.style.display = 'none';
  }
}

function countMessage() {
  _msgCount++;
  const now = Date.now();
  if (now - _rateLast >= 1000) {
    setText('sb-rate', Math.round(_msgCount * 1000 / (now - _rateLast)) + ' msg/s');
    _msgCount = 0; _rateLast = now;
  }
}

// Telemetry update
function applyTelemetry(d) {
  countMessage();
  history.push(d);

  // Increment datalog counter if a session is active
  if (logSessionId !== null) {
    logPacketCount++;
    if (logPacketCount % 10 === 0) updateLogInfo();
  }

  // ── Gauges
  gauges.rpm.setValue(d.rpm / 1000);
  gauges.speed.setValue(d.speed_fr);
  gauges.temp.setValue(d.temp);
  gauges.map.setValue(d.map_val);
  gauges.tps.setValue(d.tps);
  gauges.discFL.setValue(d.brake_disc_temp_fl);
  gauges.discRL.setValue(d.brake_disc_temp_rl);
  gauges.discFR.setValue(d.brake_disc_temp_fr);
  gauges.discRR.setValue(d.brake_disc_temp_rr);

  // ── Tile alerts
  setTileState('tile-rpm',
    d.rpm > 11000 ? 'danger' : d.rpm > 10500 ? 'warn' : null);
  setTileState('tile-temp',
    d.temp > 130 ? 'danger' : d.temp > 110 ? 'warn' : null);

  // ── Overview text
  setText('rpm-value',     d.rpm);
  setText('gear-display',  d.gear === 0 ? 'N' : d.gear);
  setText('disc-fl-val',   Math.round(d.brake_disc_temp_fl) + '°C');
  setText('disc-rl-val',   Math.round(d.brake_disc_temp_rl) + '°C');
  setText('disc-fr-val',   Math.round(d.brake_disc_temp_fr) + '°C');
  setText('disc-rr-val',   Math.round(d.brake_disc_temp_rr) + '°C');
  setText('tps-val',       d.tps.toFixed(0) + '%');
  setText('ov-lambda',     d.lambda.toFixed(3));
  setText('ov-fuel-press', d.fuel_pressure.toFixed(1) + ' bar');
  setText('ov-oil-press',  d.oil_pressure.toFixed(1)  + ' bar');
  setText('ov-air-temp',   d.air_temp.toFixed(1)       + ' °C');
  setText('ov-egt1',       d.egt1.toFixed(0)           + '°C');
  setText('ov-egt2',       d.egt2.toFixed(0)           + '°C');
  setText('ov-egt3',       d.egt3.toFixed(0)           + '°C');
  setText('ov-egt4',       d.egt4.toFixed(0)           + '°C');

  // ── Advanced cards
  setText('a-rpm',        d.rpm);
  setText('a-temp',       d.temp.toFixed(1)         + ' °C');
  setText('a-gear',       d.gear === 0 ? 'N' : d.gear);
  setText('a-bat',        d.bat.toFixed(2)           + ' V');
  setText('a-tps',        d.tps.toFixed(1)           + ' %');
  setText('a-map',        d.map_val.toFixed(3)       + ' BAR');
  setText('a-lambda',     d.lambda.toFixed(3));
  setText('a-oil-press',  d.oil_pressure.toFixed(1)  + ' bar');
  setText('a-fuel-press', d.fuel_pressure.toFixed(1) + ' bar');
  setText('a-air-temp',   d.air_temp.toFixed(1)      + ' °C');
  setText('a-oil-temp',   d.oil_temp.toFixed(1)      + ' °C');
  setText('a-egt1',       d.egt1.toFixed(0)           + ' °C');
  setText('a-egt2',       d.egt2.toFixed(0)           + ' °C');
  setText('a-egt3',       d.egt3.toFixed(0)           + ' °C');
  setText('a-egt4',       d.egt4.toFixed(0)           + ' °C');
  setText('a-speed-fl',   d.speed_fl                  + ' km/h');
  setText('a-speed-fr',   d.speed_fr                  + ' km/h');
  setText('a-speed-rl',   d.speed_rl                  + ' km/h');
  setText('a-speed-rr',   d.speed_rr                  + ' km/h');
  setText('a-disc-fl',    d.brake_disc_temp_fl.toFixed(1)   + ' °C');
  setText('a-disc-fr',    d.brake_disc_temp_fr.toFixed(1)   + ' °C');
  setText('a-disc-rl',    d.brake_disc_temp_rl.toFixed(1)   + ' °C');
  setText('a-disc-rr',    d.brake_disc_temp_rr.toFixed(1)   + ' °C');
  setText('a-gforce-a',   d.g_force_a.toFixed(2)      + ' g');
  setText('a-gforce-l',   d.g_force_l.toFixed(2)      + ' g');
  setText('a-trac',       d.trac_ctrl_cut ? T('trac.active') : T('trac.inactive'));
  setText('a-inj-a',      d.inj_time_a.toFixed(2)     + ' ms');
  setText('a-inj-b',      d.inj_time_b.toFixed(2)     + ' ms');
  setText('a-gps-speed',  d.gps_speed.toFixed(1)      + ' km/h');
  setText('a-gps-pos',    d.gps_pos);
  setText('a-minutes',    d.minutes);

  // ── GPS map
  setText('gps-speed', d.gps_speed.toFixed(1) + ' km/h');
  if (d.gps_pos) {
    const parts = d.gps_pos.split(',').map(s => parseFloat(s.trim()));
    if (parts.length >= 2 && isFinite(parts[0]) && isFinite(parts[1])) {
      const [lat, lon] = parts;
      setText('gps-lat', lat.toFixed(6) + '°');
      setText('gps-lon', lon.toFixed(6) + '°');
      gpsMap?.pushPoint(lat, lon);
    }
  }
  setText('a-seconds',    d.seconds);
  setText('a-signal',     d.signal);
}

// Login / Dashboard routing
function showLogin() {
  document.getElementById('dashboard').style.display    = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}
function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard').style.display    = 'flex';
}
function setStatus(msg, isError = false) {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  el.style.color = isError ? '#ef4444' : '#555';
}

// Entry point
window.addEventListener('DOMContentLoaded', async () => {
  // ── Language switcher
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.lang;
      localStorage.setItem('ft.lang', currentLang);
      applyI18n();
    });
  });
  applyI18n();   // apply saved language on load

  // ── Connection type toggle (MQTT / Serial)
  let connType = localStorage.getItem('ft.connType') || 'mqtt';

  function _setConnType(type) {
    connType = type;
    localStorage.setItem('ft.connType', type);
    document.querySelectorAll('.conn-type-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.conn === type));
    document.getElementById('conn-mqtt-fields').style.display   = type === 'mqtt'   ? '' : 'none';
    document.getElementById('conn-serial-fields').style.display = type === 'serial' ? '' : 'none';
    if (type === 'serial') _scanSerialPorts();
  }

  document.querySelectorAll('.conn-type-btn').forEach(btn =>
    btn.addEventListener('click', () => _setConnType(btn.dataset.conn)));

  // Apply saved connection type (without scanning yet — scanning happens on first switch)
  document.querySelectorAll('.conn-type-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.conn === connType));
  document.getElementById('conn-mqtt-fields').style.display   = connType === 'mqtt'   ? '' : 'none';
  document.getElementById('conn-serial-fields').style.display = connType === 'serial' ? '' : 'none';

  // ── Serial port scanner
  async function _scanSerialPorts() {
    const sel = document.getElementById('serial-port-select');
    const saved = sel.value;
    try {
      const ports = await invoke('list_serial_ports');
      sel.innerHTML = '';
      if (ports.length === 0) {
        sel.innerHTML = `<option value="">${T('serial.noPorts')}</option>`;
      } else {
        ports.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p; opt.textContent = p;
          if (p === saved) opt.selected = true;
          sel.appendChild(opt);
        });
      }
    } catch { /* silently ignore */ }
  }

  document.getElementById('serial-scan-btn').addEventListener('click', _scanSerialPorts);
  if (connType === 'serial') _scanSerialPorts();

  // ── Saved MQTT credentials
  document.getElementById('broker').value   = Prefs.broker;
  document.getElementById('topic').value    = Prefs.topic;
  document.getElementById('username').value = Prefs.username;

  // ── Connect button
  function _initDashboard(label) {
    // Tear down previous session before reinitialising
    _unlisteners.forEach(fn => fn()); _unlisteners = [];
    if (_chartInterval) { clearInterval(_chartInterval); _chartInterval = null; }
    Object.values(gauges).forEach(g => g._ro?.disconnect());
    history = new HistoryBuffer();
    initGauges();
    initTabs();
    initChart();
    initLogViewer();
    initGPSMap();
    showDashboard();
    startSession(label);
  }

  document.getElementById('connect-btn').addEventListener('click', async () => {
    const btn = document.getElementById('connect-btn');
    btn.disabled = true;

    if (connType === 'serial') {
      // Serial connection
      const portSel = document.getElementById('serial-port-select');
      const portName = portSel.value;
      const baudRate = parseInt(document.getElementById('serial-baud-select').value);

      if (!portName) { setStatus(T('serial.noPorts'), true); btn.disabled = false; return; }
      setStatus(T('serial.connecting'));

      try {
        _initDashboard(portName);
        await invoke('connect_serial', { portName, baudRate });
        _unlisteners.push(await listen('telemetry', ({ payload }) => applyTelemetry(payload)));
        _unlisteners.push(await listen('serial-disconnected', () => {
          stopSession(); showLogin();
          setStatus(T('serial.disconnected'), true);
          document.getElementById('connect-btn').disabled = false;
        }));
      } catch (err) {
        stopSession(); showLogin();
        setStatus(T('login.error') + err, true);
        btn.disabled = false;
      }

    } else {
      // MQTT connection
      const broker   = document.getElementById('broker').value.trim();
      const topic    = document.getElementById('topic').value.trim();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      if (!broker || !topic) { setStatus(T('login.fillFields'), true); btn.disabled = false; return; }
      setStatus(T('login.connecting'));

      try {
        const ok = await invoke('test_connection', { broker, username, password });
        if (!ok) { setStatus(T('login.failed'), true); btn.disabled = false; return; }

        Prefs.save(broker, topic, username);
        _initDashboard(broker);

        await invoke('connect_mqtt', { broker, topic, username, password });
        _unlisteners.push(await listen('telemetry', ({ payload }) => applyTelemetry(payload)));
        _unlisteners.push(await listen('mqtt-disconnected', () => {
          stopSession(); showLogin();
          setStatus(T('login.disconnected'), true);
          document.getElementById('connect-btn').disabled = false;
        }));
      } catch (err) {
        setStatus(T('login.error') + err, true);
        btn.disabled = false;
      }
    }
  });

  // ── Disconnect button
  document.getElementById('disconnect-btn').addEventListener('click', async () => {
    if (connType === 'serial') {
      await invoke('disconnect_serial').catch(() => {});
    } else {
      await invoke('disconnect_mqtt').catch(() => {});
    }
    stopSession();
    showLogin();
    setStatus('');
    document.getElementById('connect-btn').disabled = false;
  });

  document.getElementById('password').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('connect-btn').click();
  });

  document.getElementById('log-btn').addEventListener('click', toggleLog);
});
