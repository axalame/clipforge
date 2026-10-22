#[cfg(windows)]
#[allow(non_snake_case)]
mod win32 {
    use std::ffi::c_void;

    pub type HWND = *mut c_void;
    pub type HANDLE = *mut c_void;
    pub type BOOL = i32;
    pub type DWORD = u32;
    pub type UINT = u32;
    pub type LPCWSTR = *const u16;
    pub type LPARAM = isize;
    pub type WNDENUMPROC = Option<unsafe extern "system" fn(HWND, LPARAM) -> BOOL>;
    pub type SUBCLASSPROC = Option<
        unsafe extern "system" fn(
            hWnd: HWND,
            uMsg: UINT,
            wParam: usize,
            lParam: isize,
            uIdSubclass: usize,
            dwRefData: usize,
        ) -> isize,
    >;

    pub const ERROR_ALREADY_EXISTS: DWORD = 183;
    pub const SW_SHOW: i32 = 5;
    pub const SW_RESTORE: i32 = 9;
    pub const MB_OK: UINT = 0x00000000;
    pub const MB_ICONINFORMATION: UINT = 0x00000040;
    pub const MB_TOPMOST: UINT = 0x00040000;
    pub const MB_SETFOREGROUND: UINT = 0x00010000;
    pub const WM_NCDESTROY: UINT = 0x0082;

    #[link(name = "kernel32")]
    extern "system" {
        pub fn CreateMutexW(
            lpMutexAttributes: *mut c_void,
            bInitialOwner: BOOL,
            lpName: LPCWSTR,
        ) -> HANDLE;
        pub fn GetLastError() -> DWORD;
        pub fn CloseHandle(hObject: HANDLE) -> BOOL;
    }

    #[link(name = "user32")]
    extern "system" {
        pub fn FindWindowW(lpClassName: LPCWSTR, lpWindowName: LPCWSTR) -> HWND;
        pub fn ShowWindow(hWnd: HWND, nCmdShow: i32) -> BOOL;
        pub fn SetForegroundWindow(hWnd: HWND) -> BOOL;
        pub fn BringWindowToTop(hWnd: HWND) -> BOOL;
        pub fn MessageBoxW(hWnd: HWND, lpText: LPCWSTR, lpCaption: LPCWSTR, uType: UINT) -> i32;
        pub fn EnumWindows(lpEnumFunc: WNDENUMPROC, lParam: LPARAM) -> BOOL;
        pub fn SetPropW(hWnd: HWND, lpString: LPCWSTR, hData: HANDLE) -> BOOL;
        pub fn GetPropW(hWnd: HWND, lpString: LPCWSTR) -> HANDLE;
        pub fn RemovePropW(hWnd: HWND, lpString: LPCWSTR) -> HANDLE;
        pub fn RegisterWindowMessageW(lpString: LPCWSTR) -> UINT;
        pub fn PostMessageW(hWnd: HWND, Msg: UINT, wParam: usize, lParam: isize) -> BOOL;
    }

    #[link(name = "comctl32")]
    extern "system" {
        pub fn SetWindowSubclass(
            hWnd: HWND,
            pfnSubclass: SUBCLASSPROC,
            uIdSubclass: usize,
            dwRefData: usize,
        ) -> BOOL;
        pub fn DefSubclassProc(
            hWnd: HWND,
            uMsg: UINT,
            wParam: usize,
            lParam: isize,
        ) -> isize;
        pub fn RemoveWindowSubclass(
            hWnd: HWND,
            pfnSubclass: SUBCLASSPROC,
            uIdSubclass: usize,
        ) -> BOOL;
    }
}

use crate::api::UserEvent;
use tao::event_loop::EventLoopProxy;

#[cfg(windows)]
use std::ffi::OsStr;
#[cfg(windows)]
use std::os::windows::ffi::OsStrExt;

#[cfg(windows)]
pub fn to_wide(s: &str) -> Vec<u16> {
    OsStr::new(s).encode_wide().chain(std::iter::once(0)).collect()
}

pub const APP_MUTEX_NAME: &str = "Local\\ClipForge_SingleInstance_App_Mutex_2026";
pub const ALERT_MUTEX_NAME: &str = "Local\\ClipForge_SingleInstance_Alert_Mutex_2026";
pub const MARKER_PROP_NAME: &str = "ClipForge_SingleInstance_Marker";
pub const RESTORE_MSG_NAME: &str = "ClipForge_RestoreWindow_Message";
const SUBCLASS_ID: usize = 0xCF01;

#[cfg(windows)]
pub struct SingleInstanceGuard {
    handle: win32::HANDLE,
}

#[cfg(windows)]
unsafe impl Send for SingleInstanceGuard {}
#[cfg(windows)]
unsafe impl Sync for SingleInstanceGuard {}

#[cfg(windows)]
impl Drop for SingleInstanceGuard {
    fn drop(&mut self) {
        if !self.handle.is_null() {
            unsafe {
                win32::CloseHandle(self.handle);
            }
        }
    }
}

#[cfg(not(windows))]
pub struct SingleInstanceGuard;

#[cfg(windows)]
struct SearchContext {
    target_hwnd: win32::HWND,
    marker_prop: Vec<u16>,
}

#[cfg(windows)]
unsafe extern "system" fn enum_windows_callback(hwnd: win32::HWND, lparam: win32::LPARAM) -> win32::BOOL {
    let ctx = &mut *(lparam as *mut SearchContext);
    let val = win32::GetPropW(hwnd, ctx.marker_prop.as_ptr());
    if !val.is_null() {
        ctx.target_hwnd = hwnd;
        return 0; // stop enumeration, found
    }
    1 // continue
}

#[cfg(windows)]
unsafe extern "system" fn subclass_proc(
    hwnd: win32::HWND,
    msg: win32::UINT,
    wparam: usize,
    lparam: isize,
    subclass_id: usize,
    ref_data: usize,
) -> isize {
    if ref_data != 0 {
        let (proxy, custom_msg_id) = &*(ref_data as *const (EventLoopProxy<UserEvent>, win32::UINT));
        if msg == *custom_msg_id {
            let _ = proxy.send_event(UserEvent::RestoreWindow);
            return 0;
        }
        if msg == win32::WM_NCDESTROY {
            let _ = Box::from_raw(ref_data as *mut (EventLoopProxy<UserEvent>, win32::UINT));
            let prop_name = to_wide(MARKER_PROP_NAME);
            win32::RemovePropW(hwnd, prop_name.as_ptr());
            win32::RemoveWindowSubclass(hwnd, Some(subclass_proc), subclass_id);
        }
    }
    win32::DefSubclassProc(hwnd, msg, wparam, lparam)
}

/// Checks if an instance of ClipForge is already running.
/// - If this is the first instance: returns Some(SingleInstanceGuard) which must be kept alive.
/// - If an instance is already running: restores the existing window, shows a warning message box,
///   and returns None so the caller can cleanly exit.
pub fn check_single_instance() -> Option<SingleInstanceGuard> {
    #[cfg(windows)]
    {
        let mutex_name = to_wide(APP_MUTEX_NAME);
        let handle = unsafe { win32::CreateMutexW(std::ptr::null_mut(), 1, mutex_name.as_ptr()) };
        let last_error = unsafe { win32::GetLastError() };

        if !handle.is_null() && last_error == win32::ERROR_ALREADY_EXISTS {
            // Another instance is already running!
            // 1. Locate the existing window
            let mut ctx = SearchContext {
                target_hwnd: std::ptr::null_mut(),
                marker_prop: to_wide(MARKER_PROP_NAME),
            };

            unsafe {
                win32::EnumWindows(Some(enum_windows_callback), &mut ctx as *mut _ as win32::LPARAM);
            }

            let mut hwnd = ctx.target_hwnd;
            if hwnd.is_null() {
                // Fallback to window title if marker prop is not found
                let title = to_wide("ClipForge");
                hwnd = unsafe { win32::FindWindowW(std::ptr::null(), title.as_ptr()) };
            }

            if !hwnd.is_null() {
                unsafe {
                    // Send custom message to trigger Tao's event loop restore
                    let msg_name = to_wide(RESTORE_MSG_NAME);
                    let msg_id = win32::RegisterWindowMessageW(msg_name.as_ptr());
                    if msg_id != 0 {
                        win32::PostMessageW(hwnd, msg_id, 0, 0);
                    }

                    // Directly restore and bring window to front via Windows API
                    win32::ShowWindow(hwnd, win32::SW_RESTORE);
                    win32::ShowWindow(hwnd, win32::SW_SHOW);
                    win32::BringWindowToTop(hwnd);
                    win32::SetForegroundWindow(hwnd);
                }
            }

            // 2. Show native warning message box to user (at most one active alert dialog to avoid spam)
            let alert_mutex_name = to_wide(ALERT_MUTEX_NAME);
            let alert_mutex = unsafe { win32::CreateMutexW(std::ptr::null_mut(), 1, alert_mutex_name.as_ptr()) };
            let alert_err = unsafe { win32::GetLastError() };
            if !alert_mutex.is_null() && alert_err != win32::ERROR_ALREADY_EXISTS {
                let caption = to_wide("ClipForge");
                let message = to_wide("Приложение ClipForge уже запущено.\n\nОкно программы выведено на передний план.");
                let flags = win32::MB_OK | win32::MB_ICONINFORMATION | win32::MB_TOPMOST | win32::MB_SETFOREGROUND;

                unsafe {
                    win32::MessageBoxW(std::ptr::null_mut(), message.as_ptr(), caption.as_ptr(), flags);
                    win32::CloseHandle(alert_mutex);
                }
            } else if !alert_mutex.is_null() {
                unsafe {
                    win32::CloseHandle(alert_mutex);
                }
            }

            unsafe {
                win32::CloseHandle(handle);
            }

            return None;
        }

        Some(SingleInstanceGuard { handle })
    }

    #[cfg(not(windows))]
    {
        Some(SingleInstanceGuard)
    }
}

/// Registers the main Tao window: marks it with a property and subclasses it
/// to listen for external single-instance restore messages.
pub fn register_main_window(window: &tao::window::Window, proxy: EventLoopProxy<UserEvent>) {
    #[cfg(windows)]
    {
        use tao::platform::windows::WindowExtWindows;
        let hwnd = window.hwnd() as win32::HWND;
        if !hwnd.is_null() {
            unsafe {
                // Set marker property on the HWND
                let prop_name = to_wide(MARKER_PROP_NAME);
                win32::SetPropW(hwnd, prop_name.as_ptr(), 1 as win32::HANDLE);

                // Register restore window message
                let msg_name = to_wide(RESTORE_MSG_NAME);
                let msg_id = win32::RegisterWindowMessageW(msg_name.as_ptr());

                // Subclass window to intercept the message
                let proxy_box = Box::new((proxy, msg_id));
                let ref_data = Box::into_raw(proxy_box) as usize;

                win32::SetWindowSubclass(hwnd, Some(subclass_proc), SUBCLASS_ID, ref_data);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_to_wide_null_terminated() {
        #[cfg(windows)]
        {
            let wide = to_wide("Test");
            assert_eq!(wide.len(), 5);
            assert_eq!(wide[4], 0);
            assert_eq!(wide[0], 'T' as u16);
        }
    }

    #[test]
    fn test_mutex_creation_and_already_exists() {
        #[cfg(windows)]
        {
            let test_mutex_name = to_wide("Local\\ClipForge_Test_Mutex_12345");
            let h1 = unsafe { win32::CreateMutexW(std::ptr::null_mut(), 1, test_mutex_name.as_ptr()) };
            assert!(!h1.is_null());

            let h2 = unsafe { win32::CreateMutexW(std::ptr::null_mut(), 1, test_mutex_name.as_ptr()) };
            assert!(!h2.is_null());
            let err = unsafe { win32::GetLastError() };
            assert_eq!(err, win32::ERROR_ALREADY_EXISTS);

            unsafe {
                win32::CloseHandle(h1);
                win32::CloseHandle(h2);
            }
        }
    }

    #[test]
    fn test_marker_and_msg_names() {
        #[cfg(windows)]
        {
            let marker = to_wide(MARKER_PROP_NAME);
            let msg = to_wide(RESTORE_MSG_NAME);
            assert_eq!(*marker.last().unwrap(), 0);
            assert_eq!(*msg.last().unwrap(), 0);
        }
    }
}
