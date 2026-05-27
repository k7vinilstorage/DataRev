use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Sender};
use std::io::Read;
use chrono::Utc;
use rumqttc::{AsyncClient, Event, MqttOptions, Packet, QoS};
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State};

// ── State

struct MqttState {
    client: Arc<Mutex<Option<AsyncClient>>>,
}

struct DatalogState {
    sender: Arc<Mutex<Option<Sender<LogMsg>>>>,
}

struct SerialState {
    running: Arc<Mutex<Option<Arc<AtomicBool>>>>,
}

enum LogMsg {
    Data(TelemetryData),
    Stop,
}

// ── Telemetry payload (MQTT → frontend live)

#[derive(Serialize, Deserialize, Clone)]
struct TelemetryData {
    rpm: i32,
    temp: f64,
    bat: f64,
    gear: i32,
    lambda: f64,
    tps: f64,
    map_val: f64,
    air_temp: f64,
    oil_pressure: f64,
    fuel_pressure: f64,
    oil_temp: f64,
    speed_fl: i32,
    speed_fr: i32,
    speed_rl: i32,
    speed_rr: i32,
    trac_ctrl_cut: i32,
    g_force_a: f64,
    g_force_l: f64,
    inj_time_a: f64,
    inj_time_b: f64,
    egt1: f64,
    egt2: f64,
    egt3: f64,
    egt4: f64,
    brake_disc_temp_fl: f64,
    brake_disc_temp_fr: f64,
    brake_disc_temp_rl: f64,
    brake_disc_temp_rr: f64,
    signal: i32,
    gps_speed: f64,
    minutes: i32,
    seconds: i32,
    gps_pos: String,
}

// ── DB response types

#[derive(Serialize)]
struct SessionInfo {
    id: i64,
    started_at: String,
    stopped_at: Option<String>,
    packet_count: i64,
    has_gps: bool,
}

#[derive(Serialize)]
struct GpsSessionInfo {
    id: i64,
    started_at: String,
    stopped_at: Option<String>,
    label: Option<String>,
    lap_count: i64,
    log_session_id: Option<i64>,
}

#[derive(Serialize)]
struct GpsSessionWithLaps {
    id: i64,
    started_at: String,
    stopped_at: Option<String>,
    lap_count: i64,
    laps: Vec<LapInfo>,
}

#[derive(Serialize)]
struct LapInfo {
    id: i64,
    lap_number: i64,
    started_at: String,
    started_at_ms: Option<i64>,
    duration_ms: i64,
    max_speed_kmh: Option<f64>,
    avg_speed_kmh: Option<f64>,
    max_rpm: Option<i64>,
}

/// One row from the telemetry table — returned to the log viewer frontend.
#[derive(Serialize)]
struct TelemetryRow {
    ts_ms: i64,
    rpm: i32,
    temp: f64,
    bat: f64,
    gear: i32,
    lambda: f64,
    tps: f64,
    map_val: f64,
    air_temp: f64,
    oil_pressure: f64,
    fuel_pressure: f64,
    oil_temp: f64,
    speed_fl: i32,
    speed_fr: i32,
    speed_rl: i32,
    speed_rr: i32,
    trac_ctrl_cut: i32,
    g_force_a: f64,
    g_force_l: f64,
    inj_time_a: f64,
    inj_time_b: f64,
    egt1: f64,
    egt2: f64,
    egt3: f64,
    egt4: f64,
    brake_disc_temp_fl: f64,
    brake_disc_temp_fr: f64,
    brake_disc_temp_rl: f64,
    brake_disc_temp_rr: f64,
    signal: i32,
    gps_speed: f64,
    minutes: i32,
    seconds: i32,
    gps_pos: String,
}

// ── Helpers

fn parse_broker(broker: &str) -> Option<(String, u16)> {
    let url = broker.trim_start_matches("tcp://");
    let mut it = url.splitn(2, ':');
    let host = it.next()?.to_string();
    let port: u16 = it.next()?.trim().parse().ok()?;
    Some((host, port))
}

fn parse_telemetry(p: &[&str]) -> Result<TelemetryData, Box<dyn std::error::Error + Send + Sync>> {
    Ok(TelemetryData {
        rpm:                p[0].parse()?,
        temp:               p[1].parse()?,
        bat:                p[2].parse()?,
        gear:               p[3].parse()?,
        lambda:             p[4].parse()?,
        tps:                p[5].parse()?,
        map_val:            p[6].parse()?,
        air_temp:           p[7].parse()?,
        oil_pressure:       p[8].parse()?,
        fuel_pressure:      p[9].parse()?,
        oil_temp:           p[10].parse()?,
        speed_fl:           p[11].parse()?,
        speed_fr:           p[12].parse()?,
        speed_rl:           p[13].parse()?,
        speed_rr:           p[14].parse()?,
        trac_ctrl_cut:      p[15].parse()?,
        g_force_a:          p[16].parse()?,
        g_force_l:          p[17].parse()?,
        inj_time_a:         p[18].parse()?,
        inj_time_b:         p[19].parse()?,
        egt1:               p[20].parse()?,
        egt2:               p[21].parse()?,
        egt3:               p[22].parse()?,
        egt4:               p[23].parse()?,
        brake_disc_temp_fl: p[24].parse()?,
        brake_disc_temp_fr: p[25].parse()?,
        brake_disc_temp_rl: p[26].parse()?,
        brake_disc_temp_rr: p[27].parse()?,
        signal:             p[28].parse()?,
        gps_speed:          p[29].parse()?,
        minutes:            p[30].parse()?,
        seconds:            p[31].parse()?,
        gps_pos:            p[32].to_string(),
    })
}

fn db_path(app: &AppHandle) -> std::path::PathBuf {
    let data_dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."));
    let _ = std::fs::create_dir_all(&data_dir);
    data_dir.join("datarev.db")
}

fn now_iso() -> String {
    Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string()
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

fn init_db(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS log_sessions (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at   TEXT    NOT NULL,
            stopped_at   TEXT,
            packet_count INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS telemetry (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id          INTEGER NOT NULL REFERENCES log_sessions(id),
            ts                  TEXT    NOT NULL,
            ts_ms               INTEGER NOT NULL DEFAULT 0,
            rpm                 INTEGER,
            temp                REAL,
            bat                 REAL,
            gear                INTEGER,
            lambda              REAL,
            tps                 REAL,
            map_val             REAL,
            air_temp            REAL,
            oil_pressure        REAL,
            fuel_pressure       REAL,
            oil_temp            REAL,
            speed_fl            INTEGER,
            speed_fr            INTEGER,
            speed_rl            INTEGER,
            speed_rr            INTEGER,
            trac_ctrl_cut       INTEGER,
            g_force_a           REAL,
            g_force_l           REAL,
            inj_time_a          REAL,
            inj_time_b          REAL,
            egt1                REAL,
            egt2                REAL,
            egt3                REAL,
            egt4                REAL,
            brake_disc_temp_fl  REAL,
            brake_disc_temp_fr  REAL,
            brake_disc_temp_rl  REAL,
            brake_disc_temp_rr  REAL,
            signal              INTEGER,
            gps_speed           REAL,
            minutes             INTEGER,
            seconds             INTEGER,
            gps_pos             TEXT
        );"
    )?;
    // GPS sessions + laps tables
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS gps_sessions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at  TEXT    NOT NULL,
            stopped_at  TEXT,
            label       TEXT,
            lap_count   INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS laps (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            gps_session_id  INTEGER NOT NULL REFERENCES gps_sessions(id) ON DELETE CASCADE,
            lap_number      INTEGER NOT NULL,
            started_at      TEXT    NOT NULL,
            duration_ms     INTEGER NOT NULL,
            max_speed_kmh   REAL,
            avg_speed_kmh   REAL,
            max_rpm         INTEGER,
            gps_points      TEXT
        );"
    )?;
    // Migrations (silently ignored if column already exists)
    conn.execute_batch(
        "ALTER TABLE telemetry ADD COLUMN ts_ms INTEGER NOT NULL DEFAULT 0;"
    ).ok();
    conn.execute_batch(
        "ALTER TABLE gps_sessions ADD COLUMN log_session_id INTEGER REFERENCES log_sessions(id);"
    ).ok();
    conn.execute_batch(
        "ALTER TABLE laps ADD COLUMN started_at_ms INTEGER;"
    ).ok();
    Ok(())
}

// ── Commands

#[tauri::command]
async fn test_connection(broker: String, username: String, password: String) -> bool {
    let Some((host, port)) = parse_broker(&broker) else { return false; };
    let mut opts = MqttOptions::new("ft-test", host, port);
    opts.set_keep_alive(std::time::Duration::from_secs(5));
    if !username.is_empty() { opts.set_credentials(&username, &password); }
    let (client, mut eventloop) = AsyncClient::new(opts, 10);
    for _ in 0..30 {
        match eventloop.poll().await {
            Ok(Event::Incoming(Packet::ConnAck(_))) => { let _ = client.disconnect().await; return true; }
            Err(_) => return false,
            _ => {}
        }
    }
    false
}

#[tauri::command]
async fn connect_mqtt(
    broker: String, topic: String, username: String, password: String,
    state: State<'_, MqttState>,
    datalog: State<'_, DatalogState>,
    app: AppHandle,
) -> Result<(), String> {
    { let mut lock = state.client.lock().unwrap(); drop(lock.take()); }

    let Some((host, port)) = parse_broker(&broker) else {
        return Err("Invalid broker URL — expected tcp://host:port".into());
    };
    let client_id = format!("ft-telem-{}", now_ms());
    let mut opts = MqttOptions::new(client_id, host, port);
    opts.set_keep_alive(std::time::Duration::from_secs(30));
    if !username.is_empty() { opts.set_credentials(&username, &password); }

    let (client, mut eventloop) = AsyncClient::new(opts, 100);
    client.subscribe(&topic, QoS::AtLeastOnce).await.map_err(|e| e.to_string())?;
    { let mut lock = state.client.lock().unwrap(); *lock = Some(client); }

    let log_sender_arc = Arc::clone(&datalog.sender);
    tauri::async_runtime::spawn(async move {
        loop {
            match eventloop.poll().await {
                Ok(Event::Incoming(Packet::Publish(msg))) => {
                    let payload = String::from_utf8_lossy(&msg.payload);
                    let parts: Vec<&str> = payload.split('/').collect();
                    if parts.len() == 33 {
                        if let Ok(data) = parse_telemetry(&parts) {
                            { let lock = log_sender_arc.lock().unwrap();
                              if let Some(tx) = lock.as_ref() { let _ = tx.send(LogMsg::Data(data.clone())); } }
                            let _ = app.emit("telemetry", data);
                        }
                    }
                }
                Err(e) => { eprintln!("MQTT error: {e}"); let _ = app.emit("mqtt-disconnected", ()); break; }
                _ => {}
            }
        }
    });
    Ok(())
}

#[tauri::command]
async fn disconnect_mqtt(state: State<'_, MqttState>) -> Result<(), String> {
    let client = { let mut lock = state.client.lock().unwrap(); lock.take() };
    if let Some(c) = client { let _ = c.disconnect().await; }
    Ok(())
}

#[tauri::command]
fn start_log(datalog: State<'_, DatalogState>, app: AppHandle) -> Result<i64, String> {
    { let mut lock = datalog.sender.lock().unwrap(); drop(lock.take()); }

    let path = db_path(&app);
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    init_db(&conn).map_err(|e| e.to_string())?;

    let started = now_iso();
    conn.execute("INSERT INTO log_sessions (started_at) VALUES (?1)", params![started])
        .map_err(|e| e.to_string())?;
    let session_id = conn.last_insert_rowid();

    let (tx, rx) = mpsc::channel::<LogMsg>();

    std::thread::spawn(move || {
        let mut count: i64 = 0;
        let sql = "\
            INSERT INTO telemetry (
                session_id, ts, ts_ms,
                rpm, temp, bat, gear, lambda, tps, map_val, air_temp,
                oil_pressure, fuel_pressure, oil_temp,
                speed_fl, speed_fr, speed_rl, speed_rr,
                trac_ctrl_cut, g_force_a, g_force_l,
                inj_time_a, inj_time_b,
                egt1, egt2, egt3, egt4,
                brake_disc_temp_fl, brake_disc_temp_fr,
                brake_disc_temp_rl, brake_disc_temp_rr,
                signal, gps_speed, minutes, seconds, gps_pos
            ) VALUES (
                ?1, ?2, ?3,
                ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11,
                ?12, ?13, ?14,
                ?15, ?16, ?17, ?18,
                ?19, ?20, ?21,
                ?22, ?23,
                ?24, ?25, ?26, ?27,
                ?28, ?29, ?30, ?31,
                ?32, ?33, ?34, ?35, ?36
            )";

        for msg in rx.iter() {
            match msg {
                LogMsg::Stop => break,
                LogMsg::Data(d) => {
                    let ts = now_iso();
                    let ms = now_ms();
                    let _ = conn.execute(sql, params![
                        session_id, ts, ms,
                        d.rpm, d.temp, d.bat, d.gear, d.lambda, d.tps, d.map_val, d.air_temp,
                        d.oil_pressure, d.fuel_pressure, d.oil_temp,
                        d.speed_fl, d.speed_fr, d.speed_rl, d.speed_rr,
                        d.trac_ctrl_cut, d.g_force_a, d.g_force_l,
                        d.inj_time_a, d.inj_time_b,
                        d.egt1, d.egt2, d.egt3, d.egt4,
                        d.brake_disc_temp_fl, d.brake_disc_temp_fr,
                        d.brake_disc_temp_rl, d.brake_disc_temp_rr,
                        d.signal, d.gps_speed, d.minutes, d.seconds, d.gps_pos,
                    ]);
                    count += 1;
                }
            }
        }
        let stopped = now_iso();
        let _ = conn.execute(
            "UPDATE log_sessions SET stopped_at=?1, packet_count=?2 WHERE id=?3",
            params![stopped, count, session_id],
        );
    });

    { let mut lock = datalog.sender.lock().unwrap(); *lock = Some(tx); }
    Ok(session_id)
}

#[tauri::command]
fn stop_log(datalog: State<'_, DatalogState>) -> Result<(), String> {
    let mut lock = datalog.sender.lock().unwrap();
    if let Some(tx) = lock.take() { let _ = tx.send(LogMsg::Stop); }
    Ok(())
}

#[tauri::command]
fn log_is_active(datalog: State<'_, DatalogState>) -> bool {
    datalog.sender.lock().unwrap().is_some()
}

#[tauri::command]
fn list_sessions(app: AppHandle) -> Result<Vec<SessionInfo>, String> {
    let path = db_path(&app);
    if !path.exists() { return Ok(vec![]); }
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    init_db(&conn).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT l.id, l.started_at, l.stopped_at, l.packet_count,
                EXISTS(SELECT 1 FROM gps_sessions g WHERE g.log_session_id = l.id) AS has_gps
         FROM log_sessions l ORDER BY l.id DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(SessionInfo {
            id:           row.get(0)?,
            started_at:   row.get(1)?,
            stopped_at:   row.get(2)?,
            packet_count: row.get(3)?,
            has_gps:      row.get::<_, i64>(4)? != 0,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    Ok(rows)
}

#[tauri::command]
fn get_session_data(app: AppHandle, session_id: i64) -> Result<Vec<TelemetryRow>, String> {
    let path = db_path(&app);
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT ts_ms,
                rpm, temp, bat, gear, lambda, tps, map_val, air_temp,
                oil_pressure, fuel_pressure, oil_temp,
                speed_fl, speed_fr, speed_rl, speed_rr,
                trac_ctrl_cut, g_force_a, g_force_l,
                inj_time_a, inj_time_b,
                egt1, egt2, egt3, egt4,
                brake_disc_temp_fl, brake_disc_temp_fr,
                brake_disc_temp_rl, brake_disc_temp_rr,
                signal, gps_speed, minutes, seconds, gps_pos
         FROM telemetry WHERE session_id = ?1 ORDER BY id"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([session_id], |row| {
        Ok(TelemetryRow {
            ts_ms:              row.get(0)?,
            rpm:                row.get(1)?,
            temp:               row.get(2)?,
            bat:                row.get(3)?,
            gear:               row.get(4)?,
            lambda:             row.get(5)?,
            tps:                row.get(6)?,
            map_val:            row.get(7)?,
            air_temp:           row.get(8)?,
            oil_pressure:       row.get(9)?,
            fuel_pressure:      row.get(10)?,
            oil_temp:           row.get(11)?,
            speed_fl:           row.get(12)?,
            speed_fr:           row.get(13)?,
            speed_rl:           row.get(14)?,
            speed_rr:           row.get(15)?,
            trac_ctrl_cut:      row.get(16)?,
            g_force_a:          row.get(17)?,
            g_force_l:          row.get(18)?,
            inj_time_a:         row.get(19)?,
            inj_time_b:         row.get(20)?,
            egt1:               row.get(21)?,
            egt2:               row.get(22)?,
            egt3:               row.get(23)?,
            egt4:               row.get(24)?,
            brake_disc_temp_fl: row.get(25)?,
            brake_disc_temp_fr: row.get(26)?,
            brake_disc_temp_rl: row.get(27)?,
            brake_disc_temp_rr: row.get(28)?,
            signal:             row.get(29)?,
            gps_speed:          row.get(30)?,
            minutes:            row.get(31)?,
            seconds:            row.get(32)?,
            gps_pos:            row.get(33)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    Ok(rows)
}

#[tauri::command]
fn get_log_dir(app: AppHandle) -> Result<String, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

// ── GPS session commands

/// Create a new GPS session row linked to a telemetry log session, return its id.
#[tauri::command]
fn start_gps_session(app: AppHandle, label: Option<String>, log_session_id: Option<i64>) -> Result<i64, String> {
    let path = db_path(&app);
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    init_db(&conn).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO gps_sessions (started_at, label, log_session_id) VALUES (?1, ?2, ?3)",
        params![now_iso(), label, log_session_id],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

/// Persist a completed lap.  `gps_points` is a JSON string "[[lat,lon],…]".
#[tauri::command]
fn save_lap(
    app: AppHandle,
    gps_session_id: i64,
    lap_number: i64,
    started_at: String,
    started_at_ms: Option<i64>,
    duration_ms: i64,
    max_speed_kmh: Option<f64>,
    avg_speed_kmh: Option<f64>,
    max_rpm: Option<i64>,
    gps_points: Option<String>,
) -> Result<i64, String> {
    let path = db_path(&app);
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    init_db(&conn).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO laps (gps_session_id, lap_number, started_at, started_at_ms, duration_ms,
                           max_speed_kmh, avg_speed_kmh, max_rpm, gps_points)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![gps_session_id, lap_number, started_at, started_at_ms, duration_ms,
                max_speed_kmh, avg_speed_kmh, max_rpm, gps_points],
    ).map_err(|e| e.to_string())?;
    let lap_id = conn.last_insert_rowid();
    // update lap_count on the session
    conn.execute(
        "UPDATE gps_sessions SET lap_count = (SELECT COUNT(*) FROM laps WHERE gps_session_id = ?1) WHERE id = ?1",
        params![gps_session_id],
    ).map_err(|e| e.to_string())?;
    Ok(lap_id)
}

#[tauri::command]
fn end_gps_session(app: AppHandle, gps_session_id: i64) -> Result<(), String> {
    let path = db_path(&app);
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE gps_sessions SET stopped_at = ?1 WHERE id = ?2",
        params![now_iso(), gps_session_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn list_gps_sessions(app: AppHandle) -> Result<Vec<GpsSessionInfo>, String> {
    let path = db_path(&app);
    if !path.exists() { return Ok(vec![]); }
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    init_db(&conn).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, started_at, stopped_at, label, lap_count, log_session_id FROM gps_sessions ORDER BY id DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(GpsSessionInfo {
            id:              row.get(0)?,
            started_at:      row.get(1)?,
            stopped_at:      row.get(2)?,
            label:           row.get(3)?,
            lap_count:       row.get(4)?,
            log_session_id:  row.get(5)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    Ok(rows)
}

#[tauri::command]
fn get_gps_session_for_log(app: AppHandle, log_session_id: i64) -> Result<Option<GpsSessionWithLaps>, String> {
    let path = db_path(&app);
    if !path.exists() { return Ok(None); }
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;

    let row = conn.query_row(
        "SELECT id, started_at, stopped_at, lap_count FROM gps_sessions WHERE log_session_id = ?1 LIMIT 1",
        params![log_session_id],
        |r| Ok((r.get::<_,i64>(0)?, r.get::<_,String>(1)?, r.get::<_,Option<String>>(2)?, r.get::<_,i64>(3)?)),
    );

    let (gps_id, started_at, stopped_at, lap_count) = match row {
        Ok(r)  => r,
        Err(rusqlite::Error::QueryReturnedNoRows) => return Ok(None),
        Err(e) => return Err(e.to_string()),
    };

    let mut stmt = conn.prepare(
        "SELECT id, lap_number, started_at, started_at_ms, duration_ms, max_speed_kmh, avg_speed_kmh, max_rpm
         FROM laps WHERE gps_session_id = ?1 ORDER BY lap_number"
    ).map_err(|e| e.to_string())?;

    let laps: Vec<LapInfo> = stmt.query_map([gps_id], |r| {
        Ok(LapInfo {
            id:            r.get(0)?,
            lap_number:    r.get(1)?,
            started_at:    r.get(2)?,
            started_at_ms: r.get(3)?,
            duration_ms:   r.get(4)?,
            max_speed_kmh: r.get(5)?,
            avg_speed_kmh: r.get(6)?,
            max_rpm:       r.get(7)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    Ok(Some(GpsSessionWithLaps { id: gps_id, started_at, stopped_at, lap_count, laps }))
}

#[tauri::command]
fn list_laps_for_session(app: AppHandle, gps_session_id: i64) -> Result<Vec<LapInfo>, String> {
    let path = db_path(&app);
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, lap_number, started_at, started_at_ms, duration_ms, max_speed_kmh, avg_speed_kmh, max_rpm
         FROM laps WHERE gps_session_id = ?1 ORDER BY lap_number"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([gps_session_id], |row| {
        Ok(LapInfo {
            id:            row.get(0)?,
            lap_number:    row.get(1)?,
            started_at:    row.get(2)?,
            started_at_ms: row.get(3)?,
            duration_ms:   row.get(4)?,
            max_speed_kmh: row.get(5)?,
            avg_speed_kmh: row.get(6)?,
            max_rpm:       row.get(7)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    Ok(rows)
}

#[tauri::command]
fn get_lap_points(app: AppHandle, lap_id: i64) -> Result<Option<String>, String> {
    let path = db_path(&app);
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    let result: rusqlite::Result<Option<String>> = conn.query_row(
        "SELECT gps_points FROM laps WHERE id = ?1",
        params![lap_id],
        |row| row.get(0),
    );
    result.map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_gps_session(app: AppHandle, gps_session_id: i64) -> Result<(), String> {
    let path = db_path(&app);
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    // Enable foreign keys so CASCADE works
    conn.execute_batch("PRAGMA foreign_keys = ON;").map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM gps_sessions WHERE id = ?1", params![gps_session_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Serial port

#[tauri::command]
fn list_serial_ports() -> Vec<String> {
    serialport::available_ports()
        .unwrap_or_default()
        .into_iter()
        .map(|p| p.port_name)
        .collect()
}

/// Open a serial port and start reading telemetry lines from it.
/// Emits `"telemetry"` events (same payload as MQTT) and `"serial-disconnected"` on error.
#[tauri::command]
async fn connect_serial(
    app: AppHandle,
    port_name: String,
    baud_rate: u32,
    state: State<'_, SerialState>,
    datalog: State<'_, DatalogState>,
) -> Result<(), String> {
    // Stop any previous serial loop
    {
        let mut lock = state.running.lock().unwrap();
        if let Some(flag) = lock.take() {
            flag.store(false, Ordering::Relaxed);
        }
    }

    let port = serialport::new(&port_name, baud_rate)
        .timeout(std::time::Duration::from_millis(200))
        .open()
        .map_err(|e| format!("Cannot open {port_name}: {e}"))?;

    let running = Arc::new(AtomicBool::new(true));
    *state.running.lock().unwrap() = Some(running.clone());

    let log_sender_arc = Arc::clone(&datalog.sender);

    tokio::task::spawn_blocking(move || {
        let mut port = port;
        let mut buf: Vec<u8> = Vec::with_capacity(512);
        let mut byte = [0u8; 1];

        while running.load(Ordering::Relaxed) {
            match port.read(&mut byte) {
                Ok(1) => {
                    if byte[0] == b'\n' {
                        let s = String::from_utf8_lossy(&buf);
                        let s = s.trim().to_string();
                        let parts: Vec<&str> = s.split('/').collect();
                        if parts.len() == 33 {
                            if let Ok(data) = parse_telemetry(&parts) {
                                {
                                    let lock = log_sender_arc.lock().unwrap();
                                    if let Some(tx) = lock.as_ref() {
                                        let _ = tx.send(LogMsg::Data(data.clone()));
                                    }
                                }
                                let _ = app.emit("telemetry", data);
                            }
                        }
                        buf.clear();
                    } else if byte[0] != b'\r' {
                        buf.push(byte[0]);
                    }
                }
                // read timeout — just keep polling
                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {}
                Ok(_) => {}
                Err(e) => {
                    eprintln!("Serial read error: {e}");
                    let _ = app.emit("serial-disconnected", ());
                    break;
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn disconnect_serial(state: State<'_, SerialState>) -> Result<(), String> {
    let mut lock = state.running.lock().unwrap();
    if let Some(flag) = lock.take() {
        flag.store(false, Ordering::Relaxed);
    }
    Ok(())
}

/// Show a native save-file dialog, then write all telemetry rows as CSV.
#[tauri::command]
async fn export_session_csv(app: AppHandle, session_id: i64) -> Result<String, String> {
    use std::fmt::Write as FmtWrite;

    // Native save dialog — run blocking dialog off the async executor
    let default_name = format!("session_{}.csv", session_id);
    let picked = tokio::task::spawn_blocking(move || {
        rfd::FileDialog::new()
            .set_title("Exportar sessão como CSV")
            .set_file_name(&default_name)
            .add_filter("CSV", &["csv"])
            .save_file()
    }).await.map_err(|e| e.to_string())?;

    let out_path = match picked {
        Some(p) => p,
        None    => return Err("cancelled".into()),
    };

    // Query all rows for this session
    let db = db_path(&app);
    let conn = Connection::open(&db).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT ts, ts_ms,
                rpm, temp, bat, gear, lambda, tps, map_val, air_temp,
                oil_pressure, fuel_pressure, oil_temp,
                speed_fl, speed_fr, speed_rl, speed_rr,
                trac_ctrl_cut, g_force_a, g_force_l,
                inj_time_a, inj_time_b,
                egt1, egt2, egt3, egt4,
                brake_disc_temp_fl, brake_disc_temp_fr,
                brake_disc_temp_rl, brake_disc_temp_rr,
                signal, gps_speed, minutes, seconds, gps_pos
         FROM telemetry WHERE session_id = ?1 ORDER BY id"
    ).map_err(|e| e.to_string())?;

    let mut csv = String::from(
        "timestamp,ts_ms,rpm,coolant_temp_c,battery_v,gear,lambda,tps_pct,map_bar,\
air_temp_c,oil_pressure_bar,fuel_pressure_bar,oil_temp_c,\
speed_fl_kmh,speed_fr_kmh,speed_rl_kmh,speed_rr_kmh,\
trac_ctrl_cut,g_force_lon_g,g_force_lat_g,\
inj_time_a_ms,inj_time_b_ms,\
egt1_c,egt2_c,egt3_c,egt4_c,\
disc_temp_fl_c,disc_temp_fr_c,disc_temp_rl_c,disc_temp_rr_c,\
signal,gps_speed_kmh,uptime_min,uptime_sec,latitude,longitude\n"
    );

    let mut rows = stmt.query(params![session_id]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let ts:      String = row.get(0).unwrap_or_default();
        let ts_ms:   i64    = row.get(1).unwrap_or(0);
        let rpm:     i32    = row.get(2).unwrap_or(0);
        let temp:    f64    = row.get(3).unwrap_or(0.0);
        let bat:     f64    = row.get(4).unwrap_or(0.0);
        let gear:    i32    = row.get(5).unwrap_or(0);
        let lambda:  f64    = row.get(6).unwrap_or(0.0);
        let tps:     f64    = row.get(7).unwrap_or(0.0);
        let map_val:    f64    = row.get(8).unwrap_or(0.0);
        let air_temp:   f64    = row.get(9).unwrap_or(0.0);
        let oil_press:  f64    = row.get(10).unwrap_or(0.0);
        let fuel_press: f64    = row.get(11).unwrap_or(0.0);
        let oil_temp:   f64    = row.get(12).unwrap_or(0.0);
        let spd_fl:     i32    = row.get(13).unwrap_or(0);
        let spd_fr:     i32    = row.get(14).unwrap_or(0);
        let spd_rl:     i32    = row.get(15).unwrap_or(0);
        let spd_rr:     i32    = row.get(16).unwrap_or(0);
        let trac:       i32    = row.get(17).unwrap_or(0);
        let g_lon:      f64    = row.get(18).unwrap_or(0.0);
        let g_lat:      f64    = row.get(19).unwrap_or(0.0);
        let inj_time_a: f64    = row.get(20).unwrap_or(0.0);
        let inj_time_b: f64    = row.get(21).unwrap_or(0.0);
        let egt1:       f64    = row.get(22).unwrap_or(0.0);
        let egt2:       f64    = row.get(23).unwrap_or(0.0);
        let egt3:       f64    = row.get(24).unwrap_or(0.0);
        let egt4:       f64    = row.get(25).unwrap_or(0.0);
        let disc_fl:    f64    = row.get(26).unwrap_or(0.0);
        let disc_fr:    f64    = row.get(27).unwrap_or(0.0);
        let disc_rl:    f64    = row.get(28).unwrap_or(0.0);
        let disc_rr:    f64    = row.get(29).unwrap_or(0.0);
        let signal:     i32    = row.get(30).unwrap_or(0);
        let gps_speed:  f64    = row.get(31).unwrap_or(0.0);
        let uptime_min: i32    = row.get(32).unwrap_or(0);
        let uptime_sec: i32    = row.get(33).unwrap_or(0);
        let gps_pos:    String = row.get(34).unwrap_or_default();
        let mut gps_parts = gps_pos.splitn(2, ',');
        let lat_str = gps_parts.next().unwrap_or("").trim().to_string();
        let lon_str = gps_parts.next().unwrap_or("").trim().to_string();

        let _ = writeln!(csv,
            "{},{},{},{:.1},{:.2},{},{:.3},{:.1},{:.3},{:.1},{:.1},{:.1},{:.1},{},{},{},{},{},{:.3},{:.3},{:.2},{:.2},{:.0},{:.0},{:.0},{:.0},{:.1},{:.1},{:.1},{:.1},{},{:.1},{},{},{},{}",
            ts, ts_ms, rpm, temp, bat, gear, lambda, tps, map_val, air_temp,
            oil_press, fuel_press, oil_temp, spd_fl, spd_fr, spd_rl, spd_rr, trac, g_lon, g_lat,
            inj_time_a, inj_time_b, egt1, egt2, egt3, egt4,
            disc_fl, disc_fr, disc_rl, disc_rr, signal, gps_speed, uptime_min, uptime_sec,
            lat_str, lon_str,
        );
    }

    std::fs::write(&out_path, csv.as_bytes()).map_err(|e| e.to_string())?;
    Ok(out_path.to_string_lossy().to_string())
}

#[tauri::command]
fn open_log_dir(app: AppHandle) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let _ = std::fs::create_dir_all(&dir);
    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open").arg(&dir).spawn().map_err(|e| e.to_string())?;
    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer").arg(&dir).spawn().map_err(|e| e.to_string())?;
    #[cfg(target_os = "macos")]
    std::process::Command::new("open").arg(&dir).spawn().map_err(|e| e.to_string())?;
    Ok(())
}

// ── Entry point

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(MqttState  { client:  Arc::new(Mutex::new(None)) })
        .manage(DatalogState { sender: Arc::new(Mutex::new(None)) })
        .manage(SerialState  { running: Arc::new(Mutex::new(None)) })
        .invoke_handler(tauri::generate_handler![
            test_connection,
            connect_mqtt,
            disconnect_mqtt,
            list_serial_ports,
            connect_serial,
            disconnect_serial,
            start_log,
            stop_log,
            log_is_active,
            list_sessions,
            get_session_data,
            get_log_dir,
            open_log_dir,
            export_session_csv,
            start_gps_session,
            save_lap,
            end_gps_session,
            list_gps_sessions,
            get_gps_session_for_log,
            list_laps_for_session,
            get_lap_points,
            delete_gps_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
