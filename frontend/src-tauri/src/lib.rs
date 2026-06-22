/** DailyLikeTrees — cross-platform app library.
 *
 *  Platform dispatch:
 *    Desktop (Windows / macOS / Linux) → desktop::run()
 *    Mobile  (Android / iOS)            → mobile::run()
 *
 *  Each platform module handles its own backend lifecycle,
 *  window configuration, and platform-specific plugins.
 */

#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod desktop;

#[cfg(any(target_os = "android", target_os = "ios"))]
mod mobile;

/// Entry point called from main.rs.
/// Dispatches to the appropriate platform module at compile time.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        desktop::run();
    }

    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        mobile::run();
    }
}
