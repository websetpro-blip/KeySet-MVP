/**
 * TypeScript declarations for PyWebView API
 */

interface PyWebViewAPI {
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  close(): Promise<void>;
}

interface Window {
  pywebview?: {
    api: PyWebViewAPI;
  };
}
