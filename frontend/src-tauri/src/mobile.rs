/** Mobile (PE) platform bootstrap.
 *
 *  Differences from desktop:
 *  - No local backend.exe spawning (API connects to a remote server)
 *  - Mobile-specific plugins (notifications, deep links, safe area)
 *  - Smaller window / fullscreen by default
 *  - Touch-optimized event handling
 *
 *  This module is ONLY compiled on Android / iOS targets.
 */

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

            // TODO: Mobile-specific setup
            // - Configure remote API base URL
            // - Register push notification handlers
            // - Set up deep link handlers
            // - Configure status bar / safe area

            log::info!("Mobile platform initialized");

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building mobile application");

    app.run(|_app_handle, event| {
        if let tauri::RunEvent::ExitRequested { .. } = event {
            log::info!("Mobile app exiting");
        }
    });
}
