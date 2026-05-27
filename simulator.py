#!/usr/bin/env python3
"""
Badger Telemetry — Car Simulator
Envia pacotes MQTT simulando o carro em pista.

Instalar dependência:
    pip install paho-mqtt

Uso:
    python simulator.py
    python simulator.py --host 192.168.1.10 --port 1883 --topic car/rpm
    python simulator.py --host localhost --user esp32 --pass senha123
"""

import paho.mqtt.client as mqtt
import time, math, random, argparse, sys

# ── Argumentos ─────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description="Badger Telemetry Simulator")
parser.add_argument("--host",  default="localhost",   help="Broker host")
parser.add_argument("--port",  default=1883, type=int, help="Broker port")
parser.add_argument("--topic", default="car/rpm",     help="MQTT topic")
parser.add_argument("--user",  default="",            help="Username")
parser.add_argument("--pass",  default="", dest="password", help="Password")
parser.add_argument("--hz",    default=20,  type=int, help="Packets per second")
args = parser.parse_args()

# ── Helpers ────────────────────────────────────────────────────────────────────
def clamp(v, lo, hi): return max(lo, min(hi, v))
def noise(amp=1.0):   return (random.random() * 2 - 1) * amp
def smooth(current, target, dt, tau):
    return current + (target - current) * (1 - math.exp(-dt / tau))

# ══════════════════════════════════════════════════════════════════════════════
# Simulador
# ══════════════════════════════════════════════════════════════════════════════
class CarSim:
    # Estados de corrida e durações típicas (segundos)
    STATES = {
        "idle":   (1, 3),
        "warmup": (2, 5),
        "accel":  (1, 4),
        "cruise": (2, 6),
        "brake":  (0.5, 2),
        "shift":  (0.1, 0.4),
    }
    # Próximo estado provável por estado atual
    TRANSITIONS = {
        "idle":   ["warmup", "warmup", "idle"],
        "warmup": ["accel", "accel", "cruise", "idle"],
        "accel":  ["cruise", "cruise", "brake", "shift"],
        "cruise": ["accel", "brake", "cruise", "cruise"],
        "brake":  ["accel", "cruise", "idle"],
        "shift":  ["accel", "accel", "cruise"],
    }

    def __init__(self):
        self.t      = 0.0
        self.state  = "idle"
        self.timer  = 2.0

        # Motor
        self.rpm    = 900.0
        self.tps    = 0.0
        self.speed  = 0.0
        self.gear   = 1

        # Térmicos (partem frios)
        self.coolant = 30.0
        self.oil_t   = 25.0
        self.air_t   = random.uniform(24, 34)
        self.egt     = [80.0] * 4

        # Temperatura dos discos de freio
        self.disc    = [35.0] * 4

        # Motor / pressões
        self.lambda_ = 1.0
        self.map_    = 0.5
        self.bat     = 12.6
        self.oil_p   = 2.5
        self.fuel_p  = 3.5
        self.inj_a   = 8.0

        # G-forces
        self.ga      = 0.0
        self.gl      = 0.0

        # GPS / volta
        self.gps_lat = -23.304500
        self.gps_lon = -51.169600
        self.signal  = 9
        self.lap_min = 1
        self.lap_sec = 30.0
        self.gps_spd = 0.0

    # ── Máquina de estados ─────────────────────────────────────────────────────
    def _next_state(self):
        nxt = random.choice(self.TRANSITIONS[self.state])
        lo, hi = self.STATES[nxt]
        self.state = nxt
        self.timer = random.uniform(lo, hi)

    # ── Passo de simulação ─────────────────────────────────────────────────────
    def step(self, dt):
        self.t     += dt
        self.timer -= dt
        if self.timer <= 0:
            self._next_state()

        st = self.state

        # ── Alvos por estado ───────────────────────────────────────────────────
        if st == "idle":
            rpm_t, tps_t = random.uniform(850, 1200), random.uniform(0, 3)
        elif st == "warmup":
            rpm_t, tps_t = random.uniform(1500, 3500), random.uniform(5, 25)
        elif st == "accel":
            rpm_t, tps_t = random.uniform(6500, 11500), random.uniform(75, 100)
        elif st == "cruise":
            rpm_t, tps_t = random.uniform(3500, 7000), random.uniform(20, 55)
        elif st == "brake":
            rpm_t, tps_t = random.uniform(1500, 4000), 0.0
        elif st == "shift":
            rpm_t, tps_t = random.uniform(4000, 8000), random.uniform(40, 70)
        else:
            rpm_t, tps_t = 1000, 0

        self.rpm   = smooth(self.rpm,  rpm_t, dt, 0.35)
        self.tps   = smooth(self.tps,  tps_t, dt, 0.15)

        # Velocidade
        spd_t = (self.rpm / 11500) * 145 * clamp(self.tps / 80, 0, 1)
        if st == "brake":
            spd_t = max(0, self.speed - 45 * dt)
        self.speed   = clamp(smooth(self.speed, spd_t, dt, 0.7), 0, 150)
        self.gps_spd = clamp(self.speed + noise(0.8), 0, 155)

        # Marcha
        s = self.speed
        self.gear = (1 if s < 20 else 2 if s < 42 else 3 if s < 68
                     else 4 if s < 98 else 5 if s < 125 else 6)

        # ── Térmicos ───────────────────────────────────────────────────────────
        heat = (self.tps / 100) * (self.rpm / 11500)

        self.coolant = clamp(smooth(self.coolant, 82 + heat * 45, dt, 18)
                             + noise(0.08), 30, 150)
        self.oil_t   = clamp(smooth(self.oil_t, 88 + heat * 55, dt, 25)
                             + noise(0.06), 25, 160)

        egt_t = 150 + heat * 750
        for i in range(4):
            self.egt[i] = clamp(smooth(self.egt[i], egt_t + noise(25), dt, 0.8)
                                + noise(3), 80, 950)

        # Discos — aquece rápido na freada, esfria devagar
        if st == "brake":
            disc_t = 120 + self.speed * 1.8 + noise(40)
            disc_tau = 0.4
        else:
            disc_t   = 40 + heat * 80 + noise(10)
            disc_tau = 8.0
        for i in range(4):
            self.disc[i] = clamp(smooth(self.disc[i], disc_t, dt, disc_tau)
                                 + noise(2), 30, 580)

        # ── Motor ──────────────────────────────────────────────────────────────
        self.lambda_ = clamp(1.0 - (self.tps - 50) / 180 + noise(0.015), 0.75, 1.4)
        self.map_    = clamp(0.25 + self.tps / 100 * 0.95 + noise(0.02), 0.2, 1.45)
        self.inj_a   = clamp(3 + self.tps / 100 * 16 + noise(0.15), 2, 22)
        self.oil_p   = clamp(0.4 + (self.rpm / 11500) * 7 + noise(0.08), 0, 10)
        self.fuel_p  = clamp(smooth(self.fuel_p, 3.5, dt, 2) + noise(0.04), 2.5, 5)
        bat_t        = 12.4 if self.rpm < 1500 else 13.9
        self.bat     = clamp(smooth(self.bat, bat_t, dt, 30) + noise(0.01), 10, 15)

        # G-forces
        if st == "accel":
            self.ga = clamp(smooth(self.ga, 1.8, dt, 0.5)  + noise(0.05), 0,  3)
            self.gl = smooth(self.gl, noise(0.2), dt, 0.3)
        elif st == "brake":
            self.ga = clamp(smooth(self.ga, -2.5, dt, 0.4) + noise(0.08), -3.5, 0)
            self.gl = smooth(self.gl, noise(0.4), dt, 0.3)
        elif st == "cruise":
            self.ga = smooth(self.ga, 0, dt, 1)
            self.gl = math.sin(self.t * 0.25) * 1.2 + noise(0.1)
        else:
            self.ga = smooth(self.ga, 0, dt, 0.8)
            self.gl = smooth(self.gl, 0, dt, 0.8)

        # Timer de volta
        self.lap_sec += dt
        if self.lap_sec >= 60:
            self.lap_sec -= 60
            self.lap_min = (self.lap_min + 1) % 100

        # GPS drift (simula movimento em pista)
        self.gps_lat += noise(0.000012) * (self.speed / 150)
        self.gps_lon += noise(0.000012) * (self.speed / 150)
        if random.random() < 0.01:
            self.signal = clamp(self.signal + random.choice([-1, 1]), 4, 12)

    # ── Payload MQTT (33 campos separados por '/') ─────────────────────────────
    def payload(self):
        ws = int(clamp(self.speed + noise(0.5), 0, 155))
        fields = [
            int(self.rpm),                              #  0  rpm
            round(self.coolant, 1),                     #  1  temp
            round(self.bat, 2),                         #  2  bat
            self.gear,                                  #  3  gear
            round(self.lambda_, 3),                     #  4  lambda
            round(self.tps, 1),                         #  5  tps
            round(self.map_, 3),                        #  6  map_val
            round(self.air_t + noise(0.15), 1),         #  7  air_temp
            round(self.oil_p, 2),                       #  8  oil_pressure
            round(self.fuel_p, 2),                      #  9  fuel_pressure
            round(self.oil_t, 1),                       # 10  oil_temp
            ws,                                         # 11  speed_fl
            int(clamp(ws + noise(0.8), 0, 155)),        # 12  speed_fr
            int(clamp(ws + noise(0.8), 0, 155)),        # 13  speed_rl
            int(clamp(ws + noise(0.8), 0, 155)),        # 14  speed_rr
            0,                                          # 15  trac_ctrl_cut
            round(self.ga, 3),                          # 16  g_force_a
            round(self.gl, 3),                          # 17  g_force_l
            round(self.inj_a, 2),                       # 18  inj_time_a
            round(self.inj_a + noise(0.2), 2),          # 19  inj_time_b
            round(self.egt[0], 1),                      # 20  egt1
            round(self.egt[1], 1),                      # 21  egt2
            round(self.egt[2], 1),                      # 22  egt3
            round(self.egt[3], 1),                      # 23  egt4
            round(self.disc[0], 1),                     # 24  disc_fl  (tire_temp_fl)
            round(self.disc[1], 1),                     # 25  disc_fr
            round(self.disc[2], 1),                     # 26  disc_rl
            round(self.disc[3], 1),                     # 27  disc_rr
            self.signal,                                # 28  signal
            round(self.gps_spd, 1),                     # 29  gps_speed
            self.lap_min,                               # 30  minutes
            int(self.lap_sec),                          # 31  seconds
            f"{self.gps_lat:.6f},{self.gps_lon:.6f}",  # 32  gps_pos
        ]
        return "/".join(str(f) for f in fields)

# ══════════════════════════════════════════════════════════════════════════════
# MQTT
# ══════════════════════════════════════════════════════════════════════════════
def on_connect(client, userdata, flags, rc):
    codes = {0:"OK", 1:"bad protocol", 2:"bad client id",
             3:"server unavailable", 4:"bad credentials", 5:"not authorized"}
    if rc == 0:
        print(f"  Conectado ao broker  ✓")
    else:
        print(f"  Falha na conexão: {codes.get(rc, rc)}")
        sys.exit(1)

def on_disconnect(client, userdata, rc):
    if rc != 0:
        print(f"\n  Desconectado inesperadamente (rc={rc}). Tentando reconectar…")

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("━" * 54)
    print("  Badger Telemetry Simulator")
    print("━" * 54)
    print(f"  Broker : {args.host}:{args.port}")
    print(f"  Tópico : {args.topic}")
    print(f"  Taxa   : {args.hz} Hz")
    print("━" * 54)

    client = mqtt.Client(client_id="badger-sim")
    client.on_connect    = on_connect
    client.on_disconnect = on_disconnect

    if args.user:
        client.username_pw_set(args.user, args.password)

    try:
        client.connect(args.host, args.port, keepalive=30)
    except Exception as e:
        print(f"  Erro ao conectar: {e}")
        sys.exit(1)

    client.loop_start()
    time.sleep(0.5)  # aguarda on_connect

    sim = CarSim()
    dt  = 1.0 / args.hz
    sent = 0
    t0   = time.time()

    print(f"\n  Enviando pacotes… (Ctrl+C para parar)\n")
    print(f"  {'Estado':<10} {'RPM':>6} {'Speed':>6} {'TPS':>5} {'Gear':>5} "
          f"{'Coolant':>8} {'DiscFL':>7}")
    print(f"  {'─'*10} {'─'*6} {'─'*6} {'─'*5} {'─'*5} {'─'*8} {'─'*7}")

    try:
        while True:
            loop_start = time.perf_counter()

            sim.step(dt)
            msg = sim.payload()
            client.publish(args.topic, msg, qos=0)
            sent += 1

            # Print status a cada segundo
            if sent % args.hz == 0:
                print(f"  {sim.state:<10} {int(sim.rpm):>6} {sim.speed:>5.1f} "
                      f"{sim.tps:>4.1f}% {sim.gear:>5}  "
                      f"{sim.coolant:>6.1f}°C {sim.disc[0]:>6.1f}°C",
                      end="\r")

            # Mantém taxa exata
            elapsed = time.perf_counter() - loop_start
            sleep   = dt - elapsed
            if sleep > 0:
                time.sleep(sleep)

    except KeyboardInterrupt:
        elapsed = time.time() - t0
        print(f"\n\n  Simulação encerrada após {elapsed:.1f}s  |  {sent} pacotes enviados")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
