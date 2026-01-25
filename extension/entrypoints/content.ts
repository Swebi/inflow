export default defineContentScript({
  matches: ["*://mail.google.com/*"],
  main() {
    // CRITICAL: First log to verify content script loads
    console.log("[Content Script] ✅ Gmail content script LOADED on:", window.location.href);
    
    // Setup message listener
    console.log("[Content Script] Setting up message listener...");
    browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: (response: any) => void) => {
      console.log("[Content Script] Received message:", message);
      
      if (message.action === "ping") {
        console.log("[Content Script] Ping received, responding...");
        sendResponse({ success: true, message: "Content script is ready" });
        return true;
      }
      
      if (message.action === "extractEmail") {
        console.log("[Content Script] Extract email action received");
        try {
          console.log("[Content Script] Starting email extraction...");
          const emailContent = extractGmailEmail();
          console.log("[Content Script] Email extracted successfully, length:", emailContent.length);
          console.log("[Content Script] Email content preview:", emailContent.substring(0, 100) + "...");
          sendResponse({ success: true, content: emailContent });
        } catch (error) {
          console.error("[Content Script] Error extracting email:", error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Failed to extract email",
          });
        }
        return true; // Keep the message channel open for async response
      }
      
      console.warn("[Content Script] Unknown action received:", message.action);
      return false;
    });
    
    console.log("[Content Script] ✅ Message listener set up successfully");
    
    // Setup SPA navigation detection for Gmail
    setupGmailNavigationDetection();
  },
});

// Setup navigation detection for Gmail SPA
function setupGmailNavigationDetection(): void {
  try {
    let lastUrl = window.location.href;
    let debounceTimer: number | null = null;

    const handleNavigation = (): void => {
      try {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;
          console.log("[Content Script] 🔄 Gmail navigation detected:", currentUrl);
          
          // Debounce to avoid excessive calls
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          
          debounceTimer = window.setTimeout(() => {
            console.log("[Content Script] Navigation complete, ready for extraction");
            
            // Check if we're viewing an email (not just inbox/list view)
            // Wait a bit more for DOM to update after navigation
            setTimeout(() => {
              if (isViewingEmail()) {
                console.log("[Content Script] 📧 Email view detected, notifying sidepanel...");
                // Send message to runtime to notify sidepanel of email change
                browser.runtime.sendMessage({
                  action: "emailChanged",
                  url: currentUrl,
                }).catch((error) => {
                  // It's okay if no listener is available (sidepanel might not be open)
                  console.log("[Content Script] No listener for emailChanged message (sidepanel may be closed)");
                });
              } else {
                console.log("[Content Script] Not viewing an email, skipping notification");
              }
            }, 300);
          }, 500);
        }
      } catch (error) {
        console.error("[Content Script] Error in navigation handler:", error);
      }
    };

    // Listen to history API changes
    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("hashchange", handleNavigation);

    // Intercept pushState and replaceState for Gmail SPA
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleNavigation();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleNavigation();
    };
  } catch (error) {
    console.error("[Content Script] Error setting up navigation detection:", error);
  }
}

/**
 * Check if user is viewing an open email (not inbox/list view)
 */
function isViewingEmail(): boolean {
  const url = window.location.href;
  
  // Gmail URL patterns:
  // Inbox: https://mail.google.com/mail/u/0/#inbox
  // Email: https://mail.google.com/mail/u/0/#inbox/FMfcgzQXJxGgKqkNPCncLMWXkblGHWsR
  // The email view has a message ID after the view name
  
  const hashPart = url.split('#')[1] || '';
  const parts = hashPart.split('/');
  
  // If there's a second part after the view (inbox, sent, etc.), it's likely an email ID
  const hasEmailId = parts.length >= 2 && parts[1].length > 10;
  
  // Also check for email-specific DOM elements
  // .h7 is the thread/conversation container
  // .a3s is the email body class
  const hasEmailBody = document.querySelector('.a3s') !== null;
  const hasThreadContainer = document.querySelector('.h7') !== null;
  
  console.log("[Content Script] isViewingEmail check:", {
    url: hashPart,
    hasEmailId,
    hasEmailBody,
    hasThreadContainer
  });
  
  return hasEmailId || hasEmailBody || hasThreadContainer;
}

/**
 * Extract email metadata (subject, sender, date)
 */
function extractEmailMetadata(): { subject: string; sender: string; date: string } | null {
  try {
    // Subject is in h2 with data-thread-perm-id or in the .hP class
    const subjectEl = document.querySelector('h2[data-thread-perm-id], .hP');
    const subject = subjectEl?.textContent?.trim() || '';
    
    // Sender info is in .gD class (sender name) or .go class (email address)
    const senderNameEl = document.querySelector('.gD');
    const senderEmailEl = document.querySelector('.go');
    const sender = senderNameEl?.textContent?.trim() || senderEmailEl?.textContent?.trim() || '';
    
    // Date is in .g3 class or .g2 class
    const dateEl = document.querySelector('.g3, .g2');
    const date = dateEl?.textContent?.trim() || '';
    
    if (subject || sender) {
      return { subject, sender, date };
    }
  } catch (error) {
    console.error("[Content Script] Error extracting metadata:", error);
  }
  return null;
}

function extractGmailEmail(): string {
  console.log("[Content Script] extractGmailEmail() called");
  console.log("[Content Script] Current URL:", window.location.href);
  
  // First, check if we're actually viewing an email
  if (!isViewingEmail()) {
    console.warn("[Content Script] Not viewing an email, user is on inbox/list view");
    throw new Error("Please open an email first. You're currently viewing the inbox or a list view.");
  }
  
  // Extract metadata for context
  const metadata = extractEmailMetadata();
  if (metadata) {
    console.log("[Content Script] Email metadata:", metadata);
  }
  
  // Method 1: Look for the actual email body (.a3s is Gmail's email body class)
  // This is the most reliable selector for the actual email content
  console.log("[Content Script] Method 1: Looking for .a3s email body...");
  const emailBodies = document.querySelectorAll('.a3s.aiL');
  console.log("[Content Script] Found", emailBodies.length, "email bodies with .a3s.aiL");
  
  if (emailBodies.length > 0) {
    // Get the last (most recent) email body in the thread
    const lastEmailBody = emailBodies[emailBodies.length - 1];
    const text = lastEmailBody.textContent?.trim() || "";
    console.log("[Content Script] Email body text length:", text.length);
    if (text.length > 10) {
      return text;
    }
  }
  
  // Method 2: Try .a3s without .aiL (sometimes Gmail uses just .a3s)
  console.log("[Content Script] Method 2: Looking for .a3s email body (without .aiL)...");
  const emailBodiesAlt = document.querySelectorAll('.a3s');
  console.log("[Content Script] Found", emailBodiesAlt.length, "email bodies with .a3s");
  
  if (emailBodiesAlt.length > 0) {
    const lastEmailBody = emailBodiesAlt[emailBodiesAlt.length - 1];
    const text = lastEmailBody.textContent?.trim() || "";
    console.log("[Content Script] Alt email body text length:", text.length);
    if (text.length > 10) {
      return text;
    }
  }
  
  // Method 3: Look for .ii.gt (another Gmail email content container)
  console.log("[Content Script] Method 3: Looking for .ii.gt container...");
  const iiContainers = document.querySelectorAll('.ii.gt');
  console.log("[Content Script] Found", iiContainers.length, ".ii.gt containers");
  
  if (iiContainers.length > 0) {
    const lastContainer = iiContainers[iiContainers.length - 1];
    const text = lastContainer.textContent?.trim() || "";
    console.log("[Content Script] .ii.gt container text length:", text.length);
    if (text.length > 10) {
      return text;
    }
  }
  
  // Method 4: Look for div[role="article"] which wraps individual emails in a thread
  console.log("[Content Script] Method 4: Looking for div[role='article']...");
  const emailArticles = document.querySelectorAll('div[role="article"]');
  console.log("[Content Script] Found", emailArticles.length, "email articles");
  
  if (emailArticles.length > 0) {
    const lastEmail = emailArticles[emailArticles.length - 1];
    // Try to get just the message body within the article
    const messageBody = lastEmail.querySelector('.a3s, .ii.gt');
    if (messageBody) {
      const text = messageBody.textContent?.trim() || "";
      if (text.length > 10) {
        console.log("[Content Script] Found message body in article, length:", text.length);
        return text;
      }
    }
  }
  
  // Method 5: Look in the thread container (.h7)
  console.log("[Content Script] Method 5: Looking in thread container .h7...");
  const threadContainer = document.querySelector('.h7');
  if (threadContainer) {
    const messageBody = threadContainer.querySelector('.a3s, .ii.gt');
    if (messageBody) {
      const text = messageBody.textContent?.trim() || "";
      if (text.length > 10) {
        console.log("[Content Script] Found message body in thread container, length:", text.length);
        return text;
      }
    }
  }

  console.error("[Content Script] All extraction methods failed");
  throw new Error("Could not extract email content. The email might still be loading, or Gmail's layout has changed. Please try refreshing the page.");
}
