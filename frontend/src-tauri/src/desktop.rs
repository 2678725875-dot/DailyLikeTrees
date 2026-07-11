/** Desktop (PC) platform bootstrap.
 *
 *  Responsibilities:
 *  - Spawn self-contained backend.exe (production) or Python backend (dev)
 *  - Clean up zombie processes on startup (port conflict prevention)
 *  - Kill backend process tree on exit
 *
 *  This module is NOT compiled on mobile targets.
 */

use std::fs::File;
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

struct BackendProcess(Mutex<Option<Child>>);

/// Write a line to the debug log file beside the executable.
fn debug_log(msg: &str) {
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            let log_path = dir.join("dailyliketrees_debug.log");
            let ts = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0);
            let line = format!("[{}] {}\n", ts, msg);
            let _ = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&log_path)
                .and_then(|mut f| std::io::Write::write_all(&mut f, line.as_bytes()).map(|_| f))
                .map(|_| ());
        }
    }
}

macro_rules! dlog {
    ($($arg:tt)*) => {
        {
            let msg = format!($($arg)*);
            log::info!("{}", msg);
            debug_log(&msg);
        }
    };
}

pub fn run() {
    let app = tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let mut spawned = false;

            // ── Production: spawn self-contained backend.exe (no Python required) ──
            if !cfg!(debug_assertions) {

                // ── Port cleanup ──
                // PyInstaller one-file spawns python.exe as a child process.
                // Killing only backend.exe leaves python.exe orphaned, still
                // holding port 8000.  /T (tree kill) kills the whole subtree.
                dlog!("Port cleanup — killing stale backend.exe process trees...");
                let mut kill_backend_cmd = Command::new("taskkill");
                #[cfg(target_os = "windows")]
                kill_backend_cmd.creation_flags(CREATE_NO_WINDOW);
                let kill_backend = kill_backend_cmd
                    .args(["/F", "/T", "/IM", "backend.exe"])
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .status();
                match &kill_backend {
                    Ok(s) if s.success() => dlog!("  Killed stale backend.exe tree(s)"),
                    Ok(s) => dlog!("  No stale backend.exe found (exit={})", s.code().unwrap_or(-1)),
                    Err(e) => dlog!("  taskkill backend.exe failed (may be OK): {}", e),
                }

                // Also kill orphaned python.exe children that may have lost
                // their parent backend.exe (defence in depth).
                let mut kill_python_cmd = Command::new("taskkill");
                #[cfg(target_os = "windows")]
                kill_python_cmd.creation_flags(CREATE_NO_WINDOW);
                let kill_python = kill_python_cmd
                    .args(["/F", "/T", "/IM", "python.exe"])
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .status();
                match &kill_python {
                    Ok(s) if s.success() => dlog!("  Killed stale python.exe tree(s)"),
                    Ok(s) => dlog!("  No stale python.exe found (exit={})", s.code().unwrap_or(-1)),
                    Err(e) => dlog!("  taskkill python.exe failed (may be OK): {}", e),
                }

                // PowerShell: kill whatever is still listening on port 8000
                dlog!("  Checking port 8000 with PowerShell...");
                let mut ps_cmd = Command::new("powershell");
                #[cfg(target_os = "windows")]
                ps_cmd.creation_flags(CREATE_NO_WINDOW);
                let ps_result = ps_cmd
                    .args([
                        "-NoProfile", "-Command",
                        "$p = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -First 1; if ($p) { Stop-Process -Id $p.OwningProcess -Force; Write-Host ('killed pid=' + $p.OwningProcess) } else { Write-Host 'port free' }"
                    ])
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .status();
                match &ps_result {
                    Ok(s) if s.success() => dlog!("  PowerShell port check done"),
                    Ok(s) => dlog!("  PowerShell exited with {}", s.code().unwrap_or(-1)),
                    Err(e) => dlog!("  PowerShell failed (may be OK): {}", e),
                }

                // Brief pause to let the port be released
                std::thread::sleep(std::time::Duration::from_millis(800));
                let resource_dir = app.path().resource_dir().ok();
                let exe_dir = std::env::current_exe().ok().and_then(|e| e.parent().map(|p| p.to_path_buf()));

                dlog!("Production mode — searching for backend.exe");
                dlog!("  resource_dir: {:?}", resource_dir);
                dlog!("  exe_dir:      {:?}", exe_dir);

                // Build candidate list with deduplication
                let mut seen = std::collections::HashSet::new();
                let mut candidates: Vec<std::path::PathBuf> = Vec::new();
                for dir in resource_dir.iter().chain(exe_dir.iter()) {
                    let p = dir.join("backend.exe");
                    let canonical = std::fs::canonicalize(&p).unwrap_or_else(|_| p.clone());
                    if seen.insert(canonical.clone()) {
                        candidates.push(p);
                    }
                }

                // Also try a few well-known relative paths
                for rel in &["backend.exe", "resources/backend.exe"] {
                    let p = std::path::PathBuf::from(rel);
                    if !candidates.contains(&p) {
                        candidates.push(p);
                    }
                }

                dlog!("  Candidates: {:?}", candidates.iter().map(|p| p.display().to_string()).collect::<Vec<_>>());

                let log_file = exe_dir.as_ref().map(|d| d.join("backend_stderr.log"));

                let mut found = false;
                for exe in &candidates {
                    let exists = exe.exists();
                    dlog!("  Check {} — exists={}", exe.display(), exists);
                    if !exists {
                        continue;
                    }

                    let mut cmd = Command::new(exe);
                    #[cfg(target_os = "windows")]
                    cmd.creation_flags(CREATE_NO_WINDOW);
                    cmd.stdout(std::process::Stdio::null());

                    // In production, pipe stderr to a log file for debugging
                    if let Some(ref log_path) = log_file {
                        if let Ok(f) = File::create(log_path) {
                            cmd.stderr(f);
                        } else {
                            cmd.stderr(std::process::Stdio::null());
                        }
                    } else {
                        cmd.stderr(std::process::Stdio::null());
                    }

                    match cmd.spawn() {
                        Ok(child) => {
                            dlog!("  ✓ Backend started (pid={})", child.id());
                            app.handle().manage(BackendProcess(Mutex::new(Some(child))));
                            spawned = true;
                            found = true;
                            break;
                        }
                        Err(e) => {
                            dlog!("  ✗ Failed to spawn {}: {}", exe.display(), e);
                        }
                    }
                }
                if !found {
                    dlog!("  ✗✗✗ BACKEND NOT FOUND OR NOT SPAWNABLE ✗✗✗");
                }
            }

            // ── Dev mode: spawn Python backend ──
            if !spawned && cfg!(debug_assertions) {
                let backend_dir = {
                    let manifest = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
                    manifest
                        .parent() // src-tauri/ → frontend/
                        .and_then(|p| p.parent()) // frontend/ → project root
                        .map(|p| p.join("backend"))
                        .unwrap_or_else(|| std::path::PathBuf::from("../../backend"))
                };

                let python_cmd = if cfg!(target_os = "windows") {
                    vec!["python", "python3"]
                } else {
                    vec!["python3", "python"]
                };

                for cmd_name in &python_cmd {
                    let mut py_cmd = Command::new(cmd_name);
                    #[cfg(target_os = "windows")]
                    py_cmd.creation_flags(CREATE_NO_WINDOW);
                    match py_cmd
                        .args([
                            "-m", "uvicorn", "app.main:app",
                            "--host", "127.0.0.1", "--port", "8000",
                        ])
                        .current_dir(&backend_dir)
                        .stdout(std::process::Stdio::null())
                        .stderr(std::process::Stdio::null())
                        .spawn()
                    {
                        Ok(child) => {
                            log::info!("Backend started with '{}', pid: {}", cmd_name, child.id());
                            app.handle().manage(BackendProcess(Mutex::new(Some(child))));
                            spawned = true;
                            break;
                        }
                        Err(e) => {
                            log::warn!("Failed to start backend with '{}': {}", cmd_name, e);
                        }
                    }
                }
            }

            if !spawned {
                log::error!("Could not start backend. In production, is backend.exe bundled? In dev, is Python installed?");
            }

            // ── Window sizing: 1320×950 target, scale down for smaller screens ──
            const TARGET_W: f64 = 1320.0;
            const TARGET_H: f64 = 950.0;

            if let Ok(Some(monitor)) = app.primary_monitor() {
                let screen = monitor.size();
                let sw = screen.width as f64;
                let sh = screen.height as f64;

                if sw < TARGET_W || sh < TARGET_H {
                    let scale = f64::min(sw / TARGET_W, sh / TARGET_H);
                    let new_w = ((TARGET_W * scale).round() as u32).max(960);
                    let new_h = ((TARGET_H * scale).round() as u32).max(692);
                    dlog!(
                        "Screen {}x{} < target {}x{}, scaling to {}x{} (ratio {:.3})",
                        screen.width, screen.height,
                        TARGET_W as u32, TARGET_H as u32,
                        new_w, new_h, scale
                    );
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.set_size(tauri::PhysicalSize::new(new_w, new_h));
                    }
                }
            }

            // ── Embedded HTTP server for frontend ──
            // WebView2 149+ can't render tauri:// custom protocol (white
            // screen).  We serve the same files via http://127.0.0.1:PORT.
            let frontend_dir = {
                let exe_dir = std::env::current_exe()
                    .ok()
                    .and_then(|e| e.parent().map(|p| p.to_path_buf()));
                exe_dir
                    .as_ref()
                    .map(|d| d.join("frontend"))
                    .or_else(|| app.path().resource_dir().ok().map(|d| d.join("frontend")))
                    .unwrap_or_else(|| std::path::PathBuf::from("frontend"))
            };
            let serve_dir =
                std::fs::canonicalize(&frontend_dir).unwrap_or_else(|_| frontend_dir.clone());
            dlog!("HTTP root: {:?}", serve_dir);

            let port = {
                use std::net::TcpListener;
                TcpListener::bind("127.0.0.1:0")
                    .expect("Failed to bind")
                    .local_addr()
                    .unwrap()
                    .port()
            };

            let serve_dir_clone = serve_dir.clone();
            std::thread::spawn(move || {
                let server = match tiny_http::Server::http(&format!("127.0.0.1:{}", port)) {
                    Ok(s) => s,
                    Err(_) => return,
                };
                loop {
                    let request = match server.recv() {
                        Ok(r) => r,
                        Err(_) => break,
                    };
                    let url_path = request
                        .url()
                        .trim_start_matches('/')
                        .replace("%20", " ");
                    let url_path = if url_path.is_empty() {
                        "index.html"
                    } else {
                        &url_path
                    };
                    let mut file_path = serve_dir_clone.join(url_path);
                    if !file_path.is_file() {
                        file_path = serve_dir_clone.join("index.html");
                    }
                    // Prevent directory traversal
                    if std::fs::canonicalize(&file_path)
                        .map(|p| !p.starts_with(&serve_dir_clone))
                        .unwrap_or(true)
                    {
                        let _ = request.respond(
                            tiny_http::Response::from_string("404").with_status_code(404),
                        );
                        continue;
                    }
                    match std::fs::File::open(&file_path) {
                        Ok(file) => {
                            let response = tiny_http::Response::from_file(file);
                            // Force correct MIME for JS (ES modules require it)
                            let mime = match file_path.extension().and_then(|e| e.to_str()) {
                                Some("js") | Some("mjs") => {
                                    "application/javascript; charset=UTF-8"
                                }
                                Some("css") => "text/css; charset=UTF-8",
                                Some("html") | Some("htm") => "text/html; charset=UTF-8",
                                _ => "",
                            };
                            if !mime.is_empty() {
                                let hdr: tiny_http::Header =
                                    format!("Content-Type: {}", mime).parse().unwrap();
                                let _ = request.respond(response.with_header(hdr));
                            } else {
                                let _ = request.respond(response);
                            }
                        }
                        Err(_) => {
                            let _ = request.respond(
                                tiny_http::Response::from_string("500").with_status_code(500),
                            );
                        }
                    }
                }
            });

            let http_url = format!("http://127.0.0.1:{}/index.html", port);
            dlog!("Navigate to: {}", http_url);
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.navigate(url::Url::parse(&http_url).unwrap());
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let tauri::RunEvent::ExitRequested { .. } = event {
            if let Some(state) = app_handle.try_state::<BackendProcess>() {
                if let Ok(mut guard) = state.0.lock() {
                    if let Some(ref mut child) = *guard {
                        let pid = child.id();
                        log::info!("Stopping backend process tree (root pid {})...", pid);
                        // Use taskkill /T to kill the entire tree, not just
                        // the bootloader; otherwise python.exe stays alive
                        // and holds port 8000 for the next launch.
                        let mut exit_kill = Command::new("taskkill");
                        #[cfg(target_os = "windows")]
                        exit_kill.creation_flags(CREATE_NO_WINDOW);
                        let _ = exit_kill
                            .args(["/F", "/T", "/PID", &pid.to_string()])
                            .stdout(std::process::Stdio::null())
                            .stderr(std::process::Stdio::null())
                            .status();
                        let _ = child.wait();
                        log::info!("Backend stopped.");
                    }
                }
            }
        }
    });
}
