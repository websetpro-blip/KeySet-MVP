// QWebChannel bridge для связи Python ↔ React
window.pythonBridge = {
  call: async function(action, data) {
    return new Promise((resolve) => {
      if (window.qt && window.qt.webChannelTransport) {
        new QWebChannel(window.qt.webChannelTransport, function(channel) {
          const bridge = channel.objects.pythonBridge;
          const result = bridge.call_python(JSON.stringify({ action, ...data }));
          resolve(JSON.parse(result));
        });
      } else {
        // Fallback для dev режима без Qt
        console.log('[Python Bridge]', action, data);
        resolve({ status: 'dev_mode', message: 'Running without Qt' });
      }
    });
  }
};
