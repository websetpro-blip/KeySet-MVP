// Basic stealth helpers (portable)
// WebRTC protection: disable direct leak APIs
if (typeof RTCPeerConnection !== 'undefined') {
  try { RTCPeerConnection = undefined; } catch (e) {}
}
if (typeof RTCSessionDescription !== 'undefined') {
  try { RTCSessionDescription = undefined; } catch (e) {}
}
if (typeof RTCIceCandidate !== 'undefined') {
  try { RTCIceCandidate = undefined; } catch (e) {}
}

// Canvas noise
(function() {
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function(...args) {
    try {
      const ctx = this.getContext('2d');
      const imageData = ctx.getImageData(0, 0, this.width, this.height);
      const noise = Math.random() * 0.001;
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = Math.min(255, imageData.data[i] + noise);
      }
      ctx.putImageData(imageData, 0, 0);
    } catch (e) {}
    return originalToDataURL.apply(this, args);
  };
})();

// WebGL spoof
(function() {
  const getParameter = WebGLRenderingContext && WebGLRenderingContext.prototype.getParameter;
  if (!getParameter) return;
  const override = function(param) {
    if (param === 37445 && window.__antidetect?.webgl_vendor) return window.__antidetect.webgl_vendor;
    if (param === 37446 && window.__antidetect?.webgl_renderer) return window.__antidetect.webgl_renderer;
    return getParameter.call(this, param);
  };
  WebGLRenderingContext.prototype.getParameter = override;
})();

// Hardware spoof
Object.defineProperty(navigator, 'hardwareConcurrency', {
  get: () => (window.__antidetect?.hardware_cores || navigator.hardwareConcurrency || 8),
});
Object.defineProperty(navigator, 'deviceMemory', {
  get: () => (window.__antidetect?.device_memory || navigator.deviceMemory || 8),
});

// Battery API block
if ('getBattery' in navigator) {
  navigator.getBattery = () => Promise.reject(new Error('Battery not available'));
}
