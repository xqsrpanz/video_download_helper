export function notify(payload: Partial<chrome.notifications.NotificationOptions>) {
  chrome.runtime.sendMessage({ type: 'SYSTEM_NOTIFY', payload });
}
