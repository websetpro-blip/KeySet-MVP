(function () {
  const routes = [
    { prefix: "/api/accounts/list", action: "accounts.list" },
    { prefix: "/api/accounts/add", action: "accounts.add" },
    { prefix: "/api/accounts/update", action: "accounts.update" },
    { prefix: "/api/accounts/delete", action: "accounts.delete" },
    { prefix: "/api/proxy/test", action: "proxy.test" },
    { prefix: "/api/proxy/assign", action: "proxy.assign" },
    { prefix: "/api/proxy/parse", action: "proxy.parse" },
    { prefix: "/api/regions/list", action: "regions.list" },
    { prefix: "/api/sessions/list", action: "sessions.list" },
    { prefix: "/api/sessions/close", action: "sessions.close" },
    { prefix: "/api/browser/launch", action: "accounts.launch" },
    { prefix: "/api/ws/run", action: "ws.run" },
    { prefix: "/api/ws/left", action: "ws.left" },
  ];

  const getApi = () => {
    const host = window.top || window.parent || window;
    if (!host.pywebview || !host.pywebview.api) {
      throw new Error("PyWebView API недоступен в родительском окне");
    }
    return host.pywebview.api;
  };

  const waitForApi = () =>
    new Promise((resolve) => {
      const poll = () => {
        const host = window.top || window.parent || window;
        const api = host.pywebview && host.pywebview.api;
        if (api) {
          resolve(api);
        } else {
          setTimeout(poll, 50);
        }
      };
      poll();
    });

  const callPython = (action, payload) =>
    waitForApi().then((api) => api.call(action, payload ?? {}));

  window.api = window.api || {
    call: callPython,
  };

  window.electronAPI = window.electronAPI || {
    call: (...args) => callPython(...args),
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url ?? "";
    const match = routes.find((item) => url.startsWith(item.prefix));
    if (!match) {
      return originalFetch(input, init);
    }

    try {
      const payload =
        init && typeof init.body === "string" && init.body.length
          ? JSON.parse(init.body)
          : {};
      const data = await callPython(match.action, payload);
      return new Response(JSON.stringify(data ?? {}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[KeySet][bridge] fetch error", error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };

  console.info("[KeySet] analytics bridge ready");
})();
