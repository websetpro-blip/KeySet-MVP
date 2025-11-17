chrome.webRequest.onAuthRequired.addListener(
  async () => ({ authCredentials: { username: 'nDRYz5', password: 'EP0wPC' } }),
  { urls: ['<all_urls>'] },
  ['blocking']
);

console.log('[ProxyAuth] service worker registered');
