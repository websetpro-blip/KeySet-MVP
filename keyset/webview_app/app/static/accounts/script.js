(() => {
  const state = {
    accounts: [],
    filtered: [],
    selectedId: null,
    selectedIds: new Set(),
    statusFilter: "",
    proxyOnly: false,
    search: "",
    loading: false,
  };

  const dom = {
    tableBody: document.getElementById("accountsTableBody"),
    selectAll: document.getElementById("selectAll"),
    searchInput: document.getElementById("searchInput"),
    statusFilter: document.getElementById("statusFilter"),
    accountInfo: document.getElementById("accountInfo"),
    accountEmail: document.getElementById("accountEmail"),
    accountPassword: document.getElementById("accountPassword"),
    chromeProfile: document.getElementById("chromeProfile"),
    proxyAddress: document.getElementById("proxyAddress"),
    proxyUsername: document.getElementById("proxyUsername"),
    proxyPassword: document.getElementById("proxyPassword"),
    proxyType: document.getElementById("proxyType"),
    proxyStatusInfo: document.getElementById("proxyStatusInfo"),
    proxyStatus: document.getElementById("proxyStatus"),
    proxySpeed: document.getElementById("proxySpeed"),
    proxyIP: document.getElementById("proxyIP"),
    saveAccountBtn: document.getElementById("saveAccountBtn"),
    testProxyBtn: document.getElementById("testProxyBtn"),
    applyProxyBtn: document.getElementById("applyProxyBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    launchBtn: document.getElementById("launchBtn"),
    massLaunchBtn: document.getElementById("massLaunchBtn"),
    addAccountBtn: document.getElementById("addAccountBtn"),
    editAccountBtn: document.getElementById("editAccountBtn"),
    deleteAccountBtn: document.getElementById("deleteAccountBtn"),
    proxyManagerBtn: document.getElementById("proxyManagerBtn"),
    browserLauncherBtn: document.getElementById("browserLauncherBtn"),
    consistencyCheckerBtn: document.getElementById("consistencyCheckerBtn"),
    toastContainer: document.getElementById("toastContainer"),
  };

  const ensureApi = () => {
    if (!window.api || typeof window.api.call !== "function") {
      throw new Error("PyWebView API недоступен");
    }
  };

  const showToast = (message, type = "info") => {
    if (!dom.toastContainer) {
      alert(message);
      return;
    }
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  };

  const setLoading = (flag) => {
    state.loading = flag;
    document.body.classList.toggle("is-loading", flag);
  };

  const apiCall = async (action, payload = {}) => {
    ensureApi();
    const result = await window.api.call(action, payload);
    if (result && result.ok === false && result.error) {
      throw new Error(result.error);
    }
    return result;
  };

  const getAccountById = (id) =>
    state.accounts.find((account) => account.id === id) || null;

  const normalizeEmail = (value) => (value || "").trim();

  const buildProxyUri = () => {
    const rawAddress = (dom.proxyAddress?.value || "").trim();
    const username = (dom.proxyUsername?.value || "").trim();
    const password = (dom.proxyPassword?.value || "").trim();
    const protocol = (dom.proxyType?.value || "http").trim();

    if (!rawAddress) {
      return "";
    }

    if (/^https?:\/\//i.test(rawAddress) || /^socks/i.test(rawAddress)) {
      return rawAddress;
    }

    if (username || password) {
      return `${protocol}://${encodeURIComponent(username)}:${encodeURIComponent(
        password
      )}@${rawAddress}`;
    }

    return `${protocol}://${rawAddress}`;
  };

  const parseProxyUri = (uri) => {
    if (!uri || typeof uri !== "string") {
      return { address: "", username: "", password: "", protocol: "http" };
    }
    const trimmed = uri.trim();
    const hasScheme = trimmed.includes("://");
    const [schemePart, remainder] = hasScheme
      ? trimmed.split("://", 2)
      : ["http", trimmed];
    let address = remainder;
    let username = "";
    let password = "";

    if (remainder.includes("@")) {
      const [creds, host] = remainder.split("@", 2);
      address = host;
      if (creds.includes(":")) {
        const [user, pass] = creds.split(":", 2);
        username = decodeURIComponent(user);
        password = decodeURIComponent(pass);
      } else {
        username = decodeURIComponent(creds);
      }
    }

    return {
      address,
      username,
      password,
      protocol: schemePart || "http",
    };
  };

  const renderEmptyState = () => {
    dom.tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">
          <div class="empty-state">
            <i class="fas fa-database"></i>
            <div class="empty-title">Нет сохранённых аккаунтов</div>
            <p class="empty-subtitle">Добавьте аккаунт, чтобы начать работу</p>
          </div>
        </td>
      </tr>
    `;
  };

  const renderAccountsTable = () => {
    const list = state.filtered;
    dom.tableBody.innerHTML = "";
    if (!list.length) {
      renderEmptyState();
      return;
    }

    const fragment = document.createDocumentFragment();

    list.forEach((account) => {
      const isSelected = state.selectedIds.has(account.id);

      const tr = document.createElement("tr");
      tr.dataset.accountId = account.id;
      tr.classList.toggle("row-selected", state.selectedId === account.id);

      const checkboxTd = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "row-select";
      checkbox.checked = isSelected;
      checkbox.addEventListener("change", (event) => {
        if (event.target.checked) {
          state.selectedIds.add(account.id);
        } else {
          state.selectedIds.delete(account.id);
        }
        updateBulkControls();
      });
      checkboxTd.appendChild(checkbox);
      tr.appendChild(checkboxTd);

      const emailTd = document.createElement("td");
      emailTd.innerHTML = `
        <div class="cell-primary">${normalizeEmail(account.email)}</div>
        <div class="cell-secondary">${account.profilePath || "—"}</div>
      `;
      tr.appendChild(emailTd);

      const statusTd = document.createElement("td");
      const status = (account.status || "unknown").toLowerCase();
      statusTd.innerHTML = `
        <span class="status-pill status-${status}">
          ${status || "unknown"}
        </span>
      `;
      tr.appendChild(statusTd);

      const proxyTd = document.createElement("td");
      proxyTd.textContent = account.proxy || "—";
      tr.appendChild(proxyTd);

      const fingerprintTd = document.createElement("td");
      fingerprintTd.textContent = account.proxyStrategy || "—";
      tr.appendChild(fingerprintTd);

      const lastLaunchTd = document.createElement("td");
      lastLaunchTd.textContent =
        account.lastUsedAt ? new Date(account.lastUsedAt).toLocaleString() : "—";
      tr.appendChild(lastLaunchTd);

      const actionsTd = document.createElement("td");
      actionsTd.className = "actions-cell";
      const launchBtn = document.createElement("button");
      launchBtn.className = "btn btn-ghost btn-small";
      launchBtn.innerHTML = '<i class="fas fa-play"></i>';
      launchBtn.title = "Запустить аккаунт";
      launchBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        launchAccount(account.id);
      });
      actionsTd.appendChild(launchBtn);
      tr.appendChild(actionsTd);

      tr.addEventListener("click", () => {
        setSelectedAccount(account.id);
      });

      fragment.appendChild(tr);
    });

    dom.tableBody.appendChild(fragment);
    if (dom.selectAll) {
      dom.selectAll.checked =
        state.filtered.length > 0 &&
        state.filtered.every((account) => state.selectedIds.has(account.id));
    }
  };

  const updateAccountInfoPanel = () => {
    const account = getAccountById(state.selectedId);
    if (!dom.accountInfo) return;

    if (!account) {
      dom.accountInfo.style.display = "none";
      return;
    }

    dom.accountInfo.style.display = "";
    if (dom.accountEmail) {
      dom.accountEmail.value = normalizeEmail(account.email);
    }
    if (dom.accountPassword) {
      dom.accountPassword.value = "";
    }
    if (dom.chromeProfile) {
      dom.chromeProfile.value = account.profilePath || "";
    }

    const proxyParts = parseProxyUri(account.proxy);
    if (dom.proxyAddress) dom.proxyAddress.value = proxyParts.address;
    if (dom.proxyUsername) dom.proxyUsername.value = proxyParts.username;
    if (dom.proxyPassword) dom.proxyPassword.value = proxyParts.password;
    if (dom.proxyType) dom.proxyType.value = proxyParts.protocol || "http";

    if (dom.proxyStatusInfo) {
      dom.proxyStatusInfo.style.display = "none";
    }
  };

  const updateBulkControls = () => {
    const hasSelection = state.selectedIds.size > 0;
    const firstId = state.selectedIds.values().next().value || null;
    state.selectedId = firstId;
    renderAccountsTable();
    updateAccountInfoPanel();
  };

  const setSelectedAccount = (accountId) => {
    if (!accountId) return;
    state.selectedId = accountId;
    if (!state.selectedIds.has(accountId)) {
      state.selectedIds.add(accountId);
    }
    renderAccountsTable();
    updateAccountInfoPanel();
  };

  const applyFilters = () => {
    let list = [...state.accounts];

    if (state.statusFilter) {
      const target = state.statusFilter.toLowerCase();
      list = list.filter(
        (account) => (account.status || "").toLowerCase() === target
      );
    }

    if (state.proxyOnly) {
      list = list.filter((account) => !!account.proxy);
    }

    if (state.search) {
      const q = state.search.toLowerCase();
      list = list.filter((account) => {
        return (
          normalizeEmail(account.email).toLowerCase().includes(q) ||
          (account.profilePath || "").toLowerCase().includes(q) ||
          (account.proxy || "").toLowerCase().includes(q)
        );
      });
    }

    state.filtered = list;
    const selectedStillExists = state.selectedId
      ? list.some((account) => account.id === state.selectedId)
      : false;

    if (!selectedStillExists) {
      state.selectedId = list.length ? list[0].id : null;
    }

    renderAccountsTable();
    updateAccountInfoPanel();
  };

  const refreshAccounts = async () => {
    try {
      setLoading(true);
      const result = await apiCall("accounts.list");
      const items = Array.isArray(result?.items) ? result.items : [];
      state.accounts = items;
      state.selectedIds.clear();
      if (items.length) {
        state.selectedId = items[0].id;
        state.selectedIds.add(state.selectedId);
      } else {
        state.selectedId = null;
      }
      applyFilters();
      showToast("Список аккаунтов обновлён", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Не удалось загрузить аккаунты", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentAccount = async () => {
    const account = getAccountById(state.selectedId);
    if (!account) {
      showToast("Выберите аккаунт для сохранения", "warning");
      return;
    }

    const email = normalizeEmail(dom.accountEmail?.value);
    const profilePath = dom.chromeProfile?.value.trim() || "";
    const proxyUri = buildProxyUri();

    try {
      setLoading(true);
      const payload = {
        id: account.id,
        patch: {
          email,
          profilePath,
          proxy: proxyUri,
        },
      };
      const result = await apiCall("accounts.update", payload);
      const updated = result?.account ? result.account : null;
      if (updated) {
        const index = state.accounts.findIndex((item) => item.id === account.id);
        if (index !== -1) {
          state.accounts[index] = { ...state.accounts[index], ...updated };
        }
        applyFilters();
        showToast("Изменения сохранены", "success");
      }
    } catch (error) {
      console.error(error);
      showToast(error.message || "Ошибка сохранения", "error");
    } finally {
      setLoading(false);
    }
  };

  const testProxy = async () => {
    const proxyUri = buildProxyUri();
    if (!proxyUri) {
      showToast("Заполните адрес прокси", "warning");
      return;
    }
    try {
      setLoading(true);
      const result = await apiCall("proxy.test", { proxy: proxyUri });
      if (dom.proxyStatusInfo) {
        dom.proxyStatusInfo.style.display = "";
      }
      if (dom.proxyStatus) {
        dom.proxyStatus.textContent = result.ok ? "✅ Прокси работает" : "❌ Не отвечает";
      }
      if (dom.proxySpeed) {
        dom.proxySpeed.textContent = result.latency_ms
          ? `${result.latency_ms} ms`
          : "—";
      }
      if (dom.proxyIP) {
        dom.proxyIP.textContent = result.ip || "—";
      }
      showToast(result.ok ? "Прокси работает" : "Прокси не отвечает", result.ok ? "success" : "error");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Ошибка проверки прокси", "error");
    } finally {
      setLoading(false);
    }
  };

  const assignProxy = async () => {
    const account = getAccountById(state.selectedId);
    if (!account) {
      showToast("Выберите аккаунт", "warning");
      return;
    }
    const proxyUri = buildProxyUri();
    if (!proxyUri) {
      showToast("Заполните адрес прокси", "warning");
      return;
    }
    try {
      setLoading(true);
      const result = await apiCall("proxy.assign", {
        accountId: account.id,
        proxy: proxyUri,
      });
      const updated = result?.account ? result.account : null;
      if (updated) {
        const index = state.accounts.findIndex((item) => item.id === account.id);
        if (index !== -1) {
          state.accounts[index] = { ...state.accounts[index], ...updated };
        }
        applyFilters();
      }
      showToast("Прокси обновлён", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Не удалось применить прокси", "error");
    } finally {
      setLoading(false);
    }
  };

  const launchAccount = async (accountId) => {
    const account = getAccountById(accountId);
    if (!account) {
      showToast("Аккаунт не найден", "error");
      return;
    }
    try {
      setLoading(true);
      await apiCall("accounts.launch", {
        accountId: account.id,
        regionId: 225,
        headless: false,
      });
      showToast(`Браузер запущен для ${normalizeEmail(account.email)}`, "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Не удалось запустить браузер", "error");
    } finally {
      setLoading(false);
    }
  };

  const launchAccountsBatch = (accountIds) => {
    if (!Array.isArray(accountIds) || !accountIds.length) {
      showToast("Нет аккаунтов для запуска", "warning");
      return;
    }

    accountIds.forEach((id, index) => {
      const account = getAccountById(id);
      if (!account) {
        return;
      }
      const delay = 250 + index * 350;
      setTimeout(() => {
        apiCall("accounts.launch", {
          accountId: account.id,
          regionId: null,
          headless: false,
        }).catch((error) => {
          console.error(error);
          showToast(
            `Ошибка запуска ${normalizeEmail(account.email)}: ${
              error.message || error
            }`,
            "error"
          );
        });
      }, delay);
    });
  };

  const deleteSelectedAccount = async () => {
    const account = getAccountById(state.selectedId);
    if (!account) {
      showToast("Выберите аккаунт", "warning");
      return;
    }
    if (!confirm(`Удалить аккаунт «${normalizeEmail(account.email)}»?`)) {
      return;
    }
    try {
      setLoading(true);
      await apiCall("accounts.delete", { id: account.id });
      state.accounts = state.accounts.filter((item) => item.id !== account.id);
      state.selectedIds.delete(account.id);
      state.selectedId = state.accounts.length ? state.accounts[0].id : null;
      applyFilters();
      showToast("Аккаунт удалён", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Не удалось удалить аккаунт", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = (event) => {
    const { checked } = event.target;
    state.selectedIds.clear();
    if (checked) {
      state.filtered.forEach((account) => state.selectedIds.add(account.id));
    }
    if (state.selectedIds.size) {
      state.selectedId = state.selectedIds.values().next().value;
    } else {
      state.selectedId = null;
    }
    renderAccountsTable();
    updateAccountInfoPanel();
  };

  const setStatusFilter = (value) => {
    state.statusFilter = value;
    applyFilters();
  };

  const toggleProxyOnly = () => {
    state.proxyOnly = !state.proxyOnly;
    applyFilters();
  };

  const clearAllFilters = () => {
    state.statusFilter = "";
    state.proxyOnly = false;
    state.search = "";
    if (dom.statusFilter) dom.statusFilter.value = "";
    if (dom.searchInput) dom.searchInput.value = "";
    applyFilters();
  };

  const wireEvents = () => {
    dom.selectAll?.addEventListener("change", toggleSelectAll);
    dom.searchInput?.addEventListener("input", (event) => {
      state.search = event.target.value.trim().toLowerCase();
      applyFilters();
    });
    dom.statusFilter?.addEventListener("change", (event) => {
      setStatusFilter(event.target.value);
    });
    dom.saveAccountBtn?.addEventListener("click", saveCurrentAccount);
    dom.testProxyBtn?.addEventListener("click", testProxy);
    dom.applyProxyBtn?.addEventListener("click", assignProxy);
    dom.refreshBtn?.addEventListener("click", refreshAccounts);
    dom.launchBtn?.addEventListener("click", () => {
      if (state.selectedId) {
        launchAccount(state.selectedId);
      } else {
        showToast("Выберите аккаунт", "warning");
      }
    });
    dom.massLaunchBtn?.addEventListener("click", () => {
      const ids = state.selectedIds.size
        ? Array.from(state.selectedIds)
        : state.filtered.map((account) => account.id);
      if (!ids.length) {
        showToast("Отметьте аккаунты для массового запуска", "warning");
        return;
      }
      showToast(`Запускаю ${ids.length} аккаунтов...`, "info");
      launchAccountsBatch(ids);
    });
    dom.browserLauncherBtn?.addEventListener("click", () => {
      if (state.selectedId) {
        launchAccount(state.selectedId);
      } else {
        showToast("Выберите аккаунт", "warning");
      }
    });
    const notImplemented = () =>
      showToast("Функция в разработке", "info");
    dom.addAccountBtn?.addEventListener("click", notImplemented);
    dom.editAccountBtn?.addEventListener("click", notImplemented);
    dom.proxyManagerBtn?.addEventListener("click", notImplemented);
    dom.consistencyCheckerBtn?.addEventListener("click", notImplemented);
    dom.deleteAccountBtn?.addEventListener("click", deleteSelectedAccount);
  };

  window.filterByStatus = (status) => {
    setStatusFilter(status);
    if (dom.statusFilter) {
      dom.statusFilter.value = status;
    }
  };

  window.filterByProxy = () => {
    toggleProxyOnly();
  };

  window.clearAllFilters = () => {
    clearAllFilters();
  };

  const init = async () => {
    try {
      wireEvents();
      await refreshAccounts();
    } catch (error) {
      console.error(error);
      showToast(error.message || "Не удалось инициализировать вкладку", "error");
    }
  };

  document.addEventListener("DOMContentLoaded", init);
})();
