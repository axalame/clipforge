export function showAppNotification(
  type: "success" | "warning" | "error" | "info",
  title: string,
  content?: string
) {
  // 1. In-App Naive UI Notification
  const n = (window as any).$notification;
  if (n && n[type]) {
    n[type]({
      title,
      content,
      duration: 4500,
      keepAliveOnHover: true,
    });
  } else {
    const m = (window as any).$message;
    if (m && m[type]) {
      m[type](`${title}${content ? ": " + content : ""}`);
    }
  }

  // 2. Windows Native Toast notification (via Web Notification API in WebView2)
  try {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body: content,
          icon: "/favicon.ico",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, {
              body: content,
              icon: "/favicon.ico",
            });
          }
        });
      }
    }
  } catch (err) {
    // Graceful fallback if platform restricts Notifications
  }
}
