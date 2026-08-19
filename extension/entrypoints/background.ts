export default defineBackground(() => {
  // Open the side panel when the extension icon is clicked
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      await browser.sidePanel.open({ tabId: tab.id });
    }
  });

  // Watch for Google OAuth callback completing
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
      changeInfo.status === "complete" &&
      tab.url?.startsWith("http://localhost:8000/api/google/callback")
    ) {
      browser.runtime.sendMessage({ action: "googleAuthCompleted" }).catch(() => {});
    }
  });
});
