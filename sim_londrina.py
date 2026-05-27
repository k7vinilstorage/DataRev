#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════╗
║  FT Telemetry Dash — Simulador de Voltas                        ║
║  Autódromo Internacional de Londrina "Ayrton Senna"             ║
║  ~3.2 km · Londrina, PR, Brasil                                 ║
╚══════════════════════════════════════════════════════════════════╝

Simula um carro de Fórmula SAE percorrendo o circuito de Londrina
e publica telemetria MQTT no formato do FT Telemetry Dash.

Pré-requisito:
    pip install paho-mqtt

Uso:
    python3 sim_londrina.py
    python3 sim_londrina.py --broker tcp://192.168.0.10:1883
    python3 sim_londrina.py --topic ft/telemetry --rate 25 --laps 5
    python3 sim_londrina.py --help
"""

import math
import time
import random
import argparse
import sys
import os

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("❌  paho-mqtt não encontrado.  Instale: pip install paho-mqtt")
    sys.exit(1)


# ═══════════════════════════════════════════════════════════════════════════════
#  CIRCUITO — Autódromo Internacional de Londrina "Ayrton Senna"
#
#  Waypoints GPS aproximados do traçado real. Sentido horário.
#  Cada entrada: (latitude, longitude, velocidade_alvo_kmh)
#
#  Setores:
#    S1  Reta principal + Curva 1         [pts  0–9 ]
#    S2  Curva 2 + S-curves técnicas      [pts 10–19]
#    S3  Reta traseira + Chicane final    [pts 20–27]
# ═══════════════════════════════════════════════════════════════════════════════

CIRCUIT = [
    # ── RETA PRINCIPAL (~620 m, W→E) ──────────────────────────────────────────
    (-23.2712, -51.0875, 140),   #  0   LINHA DE CHEGADA / CHEGADA  ★
    (-23.2715, -51.0860, 158),   #  1
    (-23.2718, -51.0844, 165),   #  2
    (-23.2721, -51.0828, 170),   #  3
    (-23.2724, -51.0813, 172),   #  4
    (-23.2727, -51.0797, 160),   #  5   fim da reta / zona de freada

    # ── CURVA 1 (freada pesada, direita ~90°) ─────────────────────────────────
    (-23.2731, -51.0787,  88),   #  6
    (-23.2738, -51.0782,  64),   #  7
    (-23.2747, -51.0780,  56),   #  8   apex C1
    (-23.2755, -51.0784,  72),   #  9

    # ── CURVA 2 (esquerda, saída acelerada) ───────────────────────────────────
    (-23.2762, -51.0793,  96),   # 10
    (-23.2767, -51.0806, 118),   # 11
    (-23.2768, -51.0820, 130),   # 12   entrando no setor técnico

    # ── SETOR TÉCNICO — S-CURVES ───────────────────────────────────────────────
    (-23.2766, -51.0833,  84),   # 13   C3 esquerda
    (-23.2761, -51.0843,  68),   # 14
    (-23.2755, -51.0848,  62),   # 15   apex C3
    (-23.2748, -51.0846,  78),   # 16
    (-23.2741, -51.0840,  94),   # 17   C4 direita
    (-23.2735, -51.0833, 108),   # 18
    (-23.2730, -51.0828, 120),   # 19   saída do setor técnico

    # ── RETA TRASEIRA (~520 m) ─────────────────────────────────────────────────
    (-23.2726, -51.0834, 138),   # 20
    (-23.2723, -51.0844, 148),   # 21
    (-23.2720, -51.0855, 145),   # 22
    (-23.2718, -51.0865, 132),   # 23   aproximando a chicane

    # ── CHICANE FINAL (C5-C6) ─────────────────────────────────────────────────
    (-23.2716, -51.0871,  80),   # 24   freada C5
    (-23.2714, -51.0874,  66),   # 25   apex C5
    (-23.2713, -51.0875,  84),   # 26   apex C6
    (-23.2712, -51.0874, 112),   # 27   saída → reta principal (≠ pt 0)
]

FINISH_IDX    = 0          # índice do waypoint linha de chegada
SECTOR_LIMITS = (9, 19)    # segmento onde começa S2 e S3


# ═══════════════════════════════════════════════════════════════════════════════
#  PRÉ-CÁLCULOS DO CIRCUITO
# ═══════════════════════════════════════════════════════════════════════════════

def haversine(lat1, lon1, lat2, lon2):
    R = 6_371_000
    dl = math.radians(lat2 - lat1)
    dn = math.radians(lon2 - lon1)
    a  = math.sin(dl/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dn/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

N = len(CIRCUIT)
SEG_LEN   = [haversine(*CIRCUIT[i][:2], *CIRCUIT[(i+1)%N][:2]) for i in range(N)]
TOTAL_KM  = sum(SEG_LEN) / 1000

# Distância acumulada do início até o começo de cada segmento
CUM_DIST  = [0.0]
for d in SEG_LEN:
    CUM_DIST.append(CUM_DIST[-1] + d)


# ═══════════════════════════════════════════════════════════════════════════════
#  MODELO DO CARRO (Formula SAE)
# ═══════════════════════════════════════════════════════════════════════════════

class CarModel:
    """Estado físico/térmico do carro — atualizado a cada step."""

    # Caixas de marcha: (velocidade mínima, velocidade máxima)
    GEAR_BANDS = [(0,38), (32,68), (60,96), (88,126), (118,158), (148,210)]

    def __init__(self):
        # Posição no circuito
        self.seg    = 0      # índice do segmento atual
        self.seg_t  = 0.0    # fração percorrida no segmento (0..1)

        # Contagem de voltas
        self.lap          = 0
        self.lap_start_ts = time.time()
        self.best_lap_s   = None
        self.last_lap_s   = None
        self.sector       = 1
        self.s1_ts        = None

        # Cinemática
        self.speed  = 80.0   # km/h
        self.gear   = 3
        self.rpm    = 5000

        # Motor / controle
        self.tps         = 50.0     # %
        self.map_v       = 0.8      # bar
        self.lambda_     = 1.0      # λ
        self.inj_a       = 8.0      # ms
        self.inj_b       = 8.0      # ms
        self.trac_cut    = 0        # corte de tração (0/1)

        # Térmico
        self.coolant_t   = 78.0     # °C
        self.oil_t       = 88.0     # °C
        self.air_t       = 28.0     # °C fixo (temperatura ambiente)
        self.egt         = [640.0, 645.0, 638.0, 643.0]   # °C por cilindro
        self.brake_f     = [175.0, 175.0]  # FL, FR  °C
        self.brake_r     = [118.0, 118.0]  # RL, RR  °C

        # Elétrico / sensores
        self.oil_p       = 4.0      # bar
        self.fuel_p      = 3.4      # bar
        self.bat         = 13.8     # V
        self.signal      = 92       # GPS signal (0-100)

        # G-forces
        self.g_long      = 0.0
        self.g_lat       = 0.0

    # ── Física principal ───────────────────────────────────────────────────────
    def step(self, dt: float):
        """Avança a simulação por dt segundos. Retorna True se nova volta foi completada."""
        n = N
        target_now  = CIRCUIT[self.seg % n][2]
        target_next = CIRCUIT[(self.seg + 1) % n][2]
        target_spd  = _lerp(target_now, target_next, self.seg_t)

        # ── Aceleração / freada ────────────────────────────────────────────────
        diff = target_spd - self.speed
        # Freia mais rápido (−12 m/s²) do que acelera (≈+8 m/s²)
        accel_ms2 = _clamp(diff * 1.8, -12.0, 8.0)
        self.speed = _clamp(self.speed + accel_ms2 * 3.6 * dt, 25.0, 200.0)

        # ── Avança posição no circuito ─────────────────────────────────────────
        dist_m   = self.speed / 3.6 * dt
        seg_len  = SEG_LEN[self.seg % n]
        if seg_len > 0:
            self.seg_t += dist_m / seg_len

        new_lap = False
        while self.seg_t >= 1.0:
            self.seg_t -= 1.0
            self.seg    = (self.seg + 1) % n
            if self.seg == FINISH_IDX:
                new_lap = True
                now = time.time()
                self.last_lap_s = now - self.lap_start_ts
                if self.best_lap_s is None or self.last_lap_s < self.best_lap_s:
                    self.best_lap_s = self.last_lap_s
                self.lap += 1
                self.lap_start_ts = now
                self.sector = 1
                self.s1_ts  = now

        # Setor
        if self.sector == 1 and self.seg >= SECTOR_LIMITS[0]:
            self.sector = 2
        if self.sector == 2 and self.seg >= SECTOR_LIMITS[1]:
            self.sector = 3

        # ── Câmbio ────────────────────────────────────────────────────────────
        for g, (lo, hi) in enumerate(self.GEAR_BANDS, 1):
            if self.speed < hi or g == 6:
                self.gear = g
                break

        # ── RPM (modelo de caixa de marcha linear por faixa) ──────────────────
        lo, hi = self.GEAR_BANDS[self.gear - 1]
        frac   = _clamp((self.speed - lo) / max(hi - lo, 1), 0.0, 1.0)
        rpm_base = 3200 + frac * 8600      # 3200→11800 rpm por marcha
        self.rpm = int(_clamp(rpm_base + random.gauss(0, 90), 2000, 12000))

        # ── TPS / MAP / Lambda ────────────────────────────────────────────────
        on_throttle = diff > 0
        tps_target  = 92.0 if on_throttle else 8.0
        self.tps    = _clamp(_lerp(self.tps, tps_target, 0.25) + random.gauss(0, 1.5), 0, 100)
        self.map_v  = 0.25 + self.tps / 100 * 1.3 + random.gauss(0, 0.015)
        lam_target  = 0.97 if self.tps > 70 else 1.03
        self.lambda_= _lerp(self.lambda_, lam_target, 0.08) + random.gauss(0, 0.008)

        # ── Injeção ───────────────────────────────────────────────────────────
        self.inj_a = _clamp(self.tps / 100 * 11 + 2 + random.gauss(0, 0.12), 1, 14)
        self.inj_b = self.inj_a + random.gauss(0, 0.18)

        # ── Térmica do motor ──────────────────────────────────────────────────
        heat_factor = (self.rpm - 5000) / 7000     # [-0.7 .. 1.0]
        cool_target = 88 + heat_factor * 18
        self.coolant_t += (cool_target - self.coolant_t) * 0.003 * dt + random.gauss(0, 0.04)
        self.coolant_t  = _clamp(self.coolant_t, 70, 118)

        oil_target  = 98 + heat_factor * 25
        self.oil_t  += (oil_target - self.oil_t) * 0.002 * dt + random.gauss(0, 0.04)
        self.oil_t   = _clamp(self.oil_t, 78, 140)

        egt_target = 520 + self.tps * 5.2 + self.rpm * 0.038
        for i in range(4):
            self.egt[i] += (egt_target - self.egt[i]) * 0.015 * dt + random.gauss(0, 1.8)
            self.egt[i]  = _clamp(self.egt[i], 380, 960)

        # ── Temperatura dos discos de freio ───────────────────────────────────
        brk_intensity = max(0.0, -diff / 3.6)    # m/s de desaceleração
        f_target = 80 + brk_intensity * 9 + self.speed * 1.1
        r_target = 55 + brk_intensity * 6 + self.speed * 0.75
        k_heat   = 0.08 * dt
        k_cool   = 0.012 * dt
        for i in range(2):
            self.brake_f[i] += (f_target - self.brake_f[i]) * k_heat + random.gauss(0, 0.8)
            self.brake_r[i] += (r_target - self.brake_r[i]) * k_cool + random.gauss(0, 0.6)
            self.brake_f[i]  = _clamp(self.brake_f[i], 55, 580)
            self.brake_r[i]  = _clamp(self.brake_r[i], 40, 420)

        # ── G-forces ──────────────────────────────────────────────────────────
        # Longitudinal: estimado pela aceleração
        self.g_long = _clamp(accel_ms2 / 9.81 + random.gauss(0, 0.04), -4.0, 3.0)

        # Lateral: estimado pela curvatura do traçado
        p0 = CIRCUIT[self.seg % n]
        p1 = CIRCUIT[(self.seg + 1) % n]
        p2 = CIRCUIT[(self.seg + 2) % n]
        vx1, vy1 = p1[1]-p0[1], p1[0]-p0[0]
        vx2, vy2 = p2[1]-p1[1], p2[0]-p1[0]
        cross = vx1*vy2 - vy1*vx2
        denom = (math.hypot(vx1,vy1) * math.hypot(vx2,vy2)) + 1e-12
        curvature = cross / denom
        lat_g_raw = curvature * (self.speed / 3.6) ** 2 / (9.81 * 15)
        self.g_lat = _clamp(lat_g_raw * 60 + random.gauss(0, 0.04), -3.5, 3.5)

        # ── Pressões / bateria ────────────────────────────────────────────────
        self.oil_p   = _clamp(2.8 + self.rpm / 12000 * 4 + random.gauss(0, 0.04), 1.5, 8.0)
        self.fuel_p  = 3.2 + random.gauss(0, 0.025)
        self.bat     = 13.65 + random.gauss(0, 0.025)
        self.signal  = int(_clamp(92 + random.gauss(0, 2), 75, 99))

        return new_lap

    # ── GPS ───────────────────────────────────────────────────────────────────
    def gps(self):
        """Posição GPS interpolada + ruído de 0.4 m."""
        n   = N
        p0  = CIRCUIT[self.seg % n]
        p1  = CIRCUIT[(self.seg + 1) % n]
        nd  = 0.4 / 111_111   # 0.4 m em graus
        lat = _lerp(p0[0], p1[0], self.seg_t) + random.gauss(0, nd)
        lon = _lerp(p0[1], p1[1], self.seg_t) + random.gauss(0, nd)
        return lat, lon

    def dist_in_lap(self):
        """Distância percorrida na volta atual (metros)."""
        d = CUM_DIST[self.seg] + SEG_LEN[self.seg] * self.seg_t
        return d

    def wheel_spd(self):
        s = self.speed
        return (
            _clamp(s + random.gauss(0, 0.4), 0, 220),
            _clamp(s + random.gauss(0, 0.4), 0, 220),
            _clamp(s + random.gauss(0, 0.4), 0, 220),
            _clamp(s + random.gauss(0, 0.4), 0, 220),
        )

    # ── Payload MQTT ──────────────────────────────────────────────────────────
    def payload(self):
        """
        33 campos separados por '/' — formato do FT Telemetry Dash.

        [0]  rpm            [1]  temp (coolant)   [2]  bat
        [3]  gear           [4]  lambda            [5]  tps
        [6]  map            [7]  air_temp          [8]  oil_pressure
        [9]  fuel_pressure  [10] oil_temp          [11-14] speed_fl/fr/rl/rr
        [15] trac_ctrl_cut  [16] g_force_a (long)  [17] g_force_l (lat)
        [18] inj_time_a     [19] inj_time_b
        [20-23] egt1-4
        [24-27] brake_disc_temp_fl/fr/rl/rr
        [28] signal         [29] gps_speed
        [30] minutes        [31] seconds           [32] gps_pos "lat,lon"
        """
        lat, lon = self.gps()
        fl, fr, rl, rr = self.wheel_spd()
        now = time.gmtime()

        fields = [
            str(self.rpm),                        #  0
            f"{self.coolant_t:.1f}",              #  1
            f"{self.bat:.2f}",                    #  2
            str(self.gear),                       #  3
            f"{self.lambda_:.3f}",                #  4
            f"{self.tps:.1f}",                    #  5
            f"{self.map_v:.3f}",                  #  6
            f"{self.air_t:.1f}",                  #  7
            f"{self.oil_p:.2f}",                  #  8
            f"{self.fuel_p:.2f}",                 #  9
            f"{self.oil_t:.1f}",                  # 10
            str(int(fl)),                         # 11
            str(int(fr)),                         # 12
            str(int(rl)),                         # 13
            str(int(rr)),                         # 14
            str(self.trac_cut),                   # 15
            f"{self.g_long:.3f}",                 # 16
            f"{self.g_lat:.3f}",                  # 17
            f"{self.inj_a:.2f}",                  # 18
            f"{self.inj_b:.2f}",                  # 19
            f"{self.egt[0]:.1f}",                 # 20
            f"{self.egt[1]:.1f}",                 # 21
            f"{self.egt[2]:.1f}",                 # 22
            f"{self.egt[3]:.1f}",                 # 23
            f"{self.brake_f[0]:.1f}",             # 24
            f"{self.brake_f[1]:.1f}",             # 25
            f"{self.brake_r[0]:.1f}",             # 26
            f"{self.brake_r[1]:.1f}",             # 27
            str(self.signal),                     # 28
            f"{self.speed:.1f}",                  # 29
            str(now.tm_min),                      # 30
            str(now.tm_sec),                      # 31
            f"{lat:.6f},{lon:.6f}",               # 32
        ]
        return "/".join(fields)


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _lerp(a, b, t): return a + (b - a) * t
def _clamp(v, lo, hi): return max(lo, min(hi, v))

def _fmt_lap(secs: float) -> str:
    m  = int(secs // 60)
    s  = secs % 60
    return f"{m}:{s:05.2f}"

def _bar(frac: float, width=20, char="█", empty="░") -> str:
    filled = int(round(frac * width))
    return char * filled + empty * (width - filled)

def _clear_line():
    sys.stdout.write("\r\033[K")

def _sector_str(s: int) -> str:
    return f"S{s}" if s in (1, 2, 3) else "–"


# ═══════════════════════════════════════════════════════════════════════════════
#  MQTT
# ═══════════════════════════════════════════════════════════════════════════════

def _parse_broker(broker: str):
    s = broker.replace("tcp://", "").replace("mqtt://", "")
    parts = s.split(":")
    host = parts[0]
    port = int(parts[1]) if len(parts) > 1 else 1883
    return host, port


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Simulador FT Telemetry — Autódromo de Londrina",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python3 sim_londrina.py
  python3 sim_londrina.py --broker tcp://192.168.1.10:1883 --topic ft/telem
  python3 sim_londrina.py --rate 25 --laps 10
        """
    )
    parser.add_argument("--broker",   default="tcp://localhost:1883",
                        help="Broker MQTT  (default: tcp://localhost:1883)")
    parser.add_argument("--topic",    default="telemetry/car",
                        help="Tópico MQTT  (default: telemetry/car)")
    parser.add_argument("--rate",     default=20, type=int,
                        help="Taxa de publicação em Hz  (default: 20)")
    parser.add_argument("--laps",     default=0,  type=int,
                        help="Nº de voltas (0 = infinito)  (default: 0)")
    parser.add_argument("--username", default="", help="Usuário MQTT")
    parser.add_argument("--password", default="", help="Senha MQTT")
    args = parser.parse_args()

    host, port = _parse_broker(args.broker)
    dt = 1.0 / max(1, args.rate)

    # ── Conecta MQTT ──────────────────────────────────────────────────────────
    client = mqtt.Client(client_id=f"ft-sim-{int(time.time())}")
    if args.username:
        client.username_pw_set(args.username, args.password)

    connected = False
    def on_connect(c, ud, flags, rc):
        nonlocal connected
        connected = (rc == 0)

    client.on_connect = on_connect
    print(f"\n🔌  Conectando a {host}:{port} …")
    try:
        client.connect(host, port, keepalive=60)
    except Exception as e:
        print(f"❌  Falha na conexão: {e}")
        sys.exit(1)

    client.loop_start()
    for _ in range(30):      # aguarda até 3 s
        if connected:
            break
        time.sleep(0.1)

    if not connected:
        print("❌  Broker não respondeu. Verifique o endereço/porta.")
        client.loop_stop()
        sys.exit(1)

    print(f"✅  Conectado!  Tópico: {args.topic}")

    # ── Cabeçalho ─────────────────────────────────────────────────────────────
    print()
    print("╔══════════════════════════════════════════════════════════════════╗")
    print("║  🏎   FT Telemetry Sim — Autódromo Internacional de Londrina   ║")
    print(f"║  Circuito: {TOTAL_KM:.2f} km · {N} waypoints · {args.rate} Hz              ║")
    print(f"║  Voltas: {'∞' if args.laps == 0 else args.laps}  |  Broker: {host}:{port}".ljust(67) + "║")
    print("╚══════════════════════════════════════════════════════════════════╝")
    print()
    print("  Pressione Ctrl+C para encerrar.\n")

    car  = CarModel()
    msgs = 0
    last_display_ts = time.time()

    try:
        while True:
            t0 = time.time()

            new_lap = car.step(dt)
            pl = car.payload()
            client.publish(args.topic, pl, qos=0)
            msgs += 1

            # ── Exibe telemetria no terminal a cada 0.2 s ─────────────────────
            now = time.time()
            if now - last_display_ts >= 0.2:
                last_display_ts = now

                elapsed_lap  = now - car.lap_start_ts
                dist_pct     = car.dist_in_lap() / (TOTAL_KM * 1000)
                rpm_pct      = (car.rpm - 2000) / 10000
                tps_bar      = _bar(car.tps / 100, width=12)
                rpm_bar      = _bar(rpm_pct,        width=10)
                best_str     = _fmt_lap(car.best_lap_s) if car.best_lap_s else "--:--.--"
                last_str     = _fmt_lap(car.last_lap_s) if car.last_lap_s else "--:--.--"

                line = (
                    f"\r  "
                    f"V{car.lap + 1:>2}·{_sector_str(car.sector)}  "
                    f"{_fmt_lap(elapsed_lap)}  "
                    f"[{_bar(dist_pct, 14)}]  "
                    f"{car.speed:>5.1f}km/h  "
                    f"G{car.gear}  "
                    f"{car.rpm:>5}rpm [{rpm_bar}]  "
                    f"TPS[{tps_bar}]  "
                    f"T{car.coolant_t:>4.0f}°  "
                    f"Best:{best_str}"
                )
                sys.stdout.write(line)
                sys.stdout.flush()

            # ── Nova volta ────────────────────────────────────────────────────
            if new_lap:
                lap_str = _fmt_lap(car.last_lap_s)
                best_str = _fmt_lap(car.best_lap_s)
                is_best  = (car.last_lap_s == car.best_lap_s)
                flag     = "🏆  MELHOR VOLTA!" if is_best else ""
                print(f"\n\n  🏁  Volta {car.lap} concluída — {lap_str}  (best: {best_str})  {flag}")
                print()

                if args.laps > 0 and car.lap >= args.laps:
                    print(f"\n  ✅  {car.lap} volta(s) simulada(s). Encerrando.\n")
                    break

            # ── Throttle do loop ──────────────────────────────────────────────
            elapsed = time.time() - t0
            sleep_t = dt - elapsed
            if sleep_t > 0:
                time.sleep(sleep_t)

    except KeyboardInterrupt:
        print(f"\n\n  ⛔  Simulação encerrada após {car.lap} volta(s) e {msgs} mensagens.\n")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
