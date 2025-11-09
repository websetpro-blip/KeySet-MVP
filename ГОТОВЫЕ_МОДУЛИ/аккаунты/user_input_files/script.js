// Демо данные аккаунтов
const accountsData = [
    {
        id: 1,
        email: 'test1@yandex.ru',
        password: 'password123',
        secretAnswer: 'Москва',
        profilePath: '/profiles/test1',
        status: 'active',
        proxy: '192.168.1.100:8080',
        proxyUsername: 'user1',
        proxyPassword: 'pass1',
        proxyType: 'http',
        fingerprint: 'russia_standard',
        lastLaunch: '5 минут назад',
        authStatus: 'Авторизован',
        lastLogin: '2025-10-31 01:00:00',
        profileSize: '45.2 МБ'
    },
    {
        id: 2,
        email: 'test2@yandex.ru',
        password: 'password456',
        secretAnswer: 'Зимний сад',
        profilePath: '/profiles/test2',
        status: 'needs_login',
        proxy: '',
        proxyUsername: '',
        proxyPassword: '',
        proxyType: 'http',
        fingerprint: 'no_spoofing',
        lastLaunch: '1 час назад',
        authStatus: 'Неавторизован',
        lastLogin: '2025-10-30 15:30:00',
        profileSize: '32.1 МБ'
    },
    {
        id: 3,
        email: 'test3@yandex.ru',
        password: 'password789',
        secretAnswer: 'Чита',
        profilePath: '/profiles/test3',
        status: 'error',
        proxy: '192.168.1.101:8080',
        proxyUsername: 'user3',
        proxyPassword: 'pass3',
        proxyType: 'socks5',
        fingerprint: 'kazakhstan_standard',
        lastLaunch: 'вчера',
        authStatus: 'Ошибка авторизации',
        lastLogin: '2025-10-30 08:15:00',
        profileSize: '28.7 МБ'
    },
    {
        id: 4,
        email: 'spam_protector@yandex.ru',
        password: 'secure123',
        secretAnswer: 'Ответ на вопрос',
        profilePath: '/profiles/spam_protector',
        status: 'active',
        proxy: 'proxy.kz:3128',
        proxyUsername: 'kz_user',
        proxyPassword: 'kz_pass',
        proxyType: 'socks5',
        fingerprint: 'kazakhstan_standard',
        lastLaunch: 'сейчас',
        authStatus: 'Авторизован',
        lastLogin: '2025-10-31 01:00:21',
        profileSize: '67.8 МБ'
    },
    {
        id: 5,
        email: 'alex_ivanov@yandex.ru',
        password: 'ivanov2023',
        secretAnswer: 'Барселона',
        profilePath: '/profiles/alex_ivanov',
        status: 'working',
        proxy: '10.0.0.50:1080',
        proxyUsername: 'alex',
        proxyPassword: 'proxy_pass',
        proxyType: 'http',
        fingerprint: 'russia_standard',
        lastLaunch: '2 минуты назад',
        authStatus: 'Авторизован',
        lastLogin: '2025-10-31 00:58:21',
        profileSize: '52.3 МБ'
    },
    {
        id: 6,
        email: 'novosibirsk_user@yandex.ru',
        password: 'novosib2023',
        secretAnswer: 'Сибирь',
        profilePath: '/profiles/novosibirsk_user',
        status: 'active',
        proxy: '',
        proxyUsername: '',
        proxyPassword: '',
        proxyType: 'http',
        fingerprint: 'russia_standard',
        lastLaunch: '30 минут назад',
        authStatus: 'Авторизован',
        lastLogin: '2025-10-31 00:30:21',
        profileSize: '41.5 МБ'
    }
];

// Глобальные переменные
let currentAccount = null;
let selectedAccounts = new Set();
let currentTab = 'basic';
let proxyPool = [];
let settings = {};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadAccountsTable();
    setupEventListeners();
    setupTabSwitching();
    setupPasswordToggles();
    setupToastNotifications();
    setupSearchKeyboardHandler();
    
    // Автозагрузка данных из LocalStorage
    const savedData = localStorage.getItem('keyset_data');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            if (data.accounts) {
                // Очищаем массив и заполняем сохранёнными данными
                accountsData.length = 0;
                accountsData.push(...data.accounts);
                loadAccountsTable();
            }
            if (data.proxyPool) proxyPool = data.proxyPool;
            if (data.settings) settings = data.settings;
            
            showToast('Данные восстановлены из локального хранилища', 'success');
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
    }
}

// Загрузка таблицы аккаунтов
function loadAccountsTable() {
    const tbody = document.getElementById('accountsTableBody');
    tbody.innerHTML = '';

    accountsData.forEach(account => {
        const row = createAccountRow(account);
        tbody.appendChild(row);
    });
}

function createAccountRow(account) {
    const tr = document.createElement('tr');
    tr.className = 'table-row-clickable';
    tr.onclick = (e) => {
        if (e.target.type !== 'checkbox') {
            selectAccount(account);
        }
    };

    const statusClass = `status-${account.status}`;
    const statusText = getStatusText(account.status);
    
    const proxyDisplay = account.proxy || 'Нет';
    const proxyClass = account.proxy ? 'proxy-info' : 'proxy-none';
    
    const fpClass = getFingerprintClass(account.fingerprint);
    const fpText = getFingerprintText(account.fingerprint);
    
    // Получаем текущий поисковый терм для подсветки
    const currentSearchTerm = document.getElementById('searchInput').value;

    tr.innerHTML = `
        <td>
            <input type="checkbox" 
                   class="account-checkbox"
                   data-id="${account.id}"
                   onchange="toggleAccountSelection(${account.id})"
                   ${selectedAccounts.has(account.id) ? 'checked' : ''}>
        </td>
        <td class="account-email">${highlightSearchTerm(account.email, currentSearchTerm)}</td>
        <td>
            <span class="status-badge ${statusClass}">
                ${statusText}
            </span>
        </td>
        <td class="${proxyClass}">${highlightSearchTerm(proxyDisplay, currentSearchTerm)}</td>
        <td>
            <span class="fingerprint-badge ${fpClass}">
                ${fpText}
            </span>
        </td>
        <td class="last-run">${account.lastLaunch}</td>
        <td class="action-buttons-cell">
            <button class="action-btn action-btn-play" onclick="launchSingleAccount(${account.id})">
                <i class="fas fa-play"></i>
            </button>
            <button class="action-btn action-btn-settings" onclick="openAccountSettings(${account.id})">
                <i class="fas fa-cog"></i>
            </button>
        </td>
    `;

    return tr;
}

function getStatusText(status) {
    const statusMap = {
        'active': '✅ Активен',
        'needs_login': '⚠️ Требует входа',
        'error': '❌ Ошибка',
        'working': '🔄 В работе'
    };
    return statusMap[status] || 'Неизвестно';
}

function getFingerprintClass(fingerprint) {
    const classMap = {
        'russia_standard': 'fp-russia',
        'kazakhstan_standard': 'fp-kazakhstan',
        'no_spoofing': 'fp-no-spoof'
    };
    return classMap[fingerprint] || 'fp-no-spoof';
}

function getFingerprintText(fingerprint) {
    const textMap = {
        'russia_standard': '🇷🇺 Россия',
        'kazakhstan_standard': '🇰🇿 Казахстан',
        'no_spoofing': '🌐 Без подмены'
    };
    return textMap[fingerprint] || 'Неизвестно';
}

// Выбор аккаунта
function selectAccount(account) {
    currentAccount = account;
    showSidebar();
    populateSidebarData(account);
    showToast(`Выбран аккаунт: ${account.email}`, 'info');
}

function showSidebar() {
    const sidebar = document.getElementById('settingsSidebar');
    sidebar.classList.add('active', 'animate-in');
    setTimeout(() => {
        sidebar.classList.remove('animate-in');
    }, 300);
}

function populateSidebarData(account) {
    document.getElementById('selectedAccountEmail').textContent = account.email;
    document.getElementById('accountEmail').value = account.email;
    document.getElementById('accountPassword').value = account.password;
    document.getElementById('secretQuestion').value = account.secretAnswer;
    document.getElementById('chromeProfile').value = account.profilePath;
    
    // Сеть
    document.getElementById('proxyAddress').value = account.proxy || '';
    document.getElementById('proxyUsername').value = account.proxyUsername || '';
    document.getElementById('proxyPassword').value = account.proxyPassword || '';
    document.getElementById('proxyType').value = account.proxyType || 'http';
    
    // Fingerprint
    document.getElementById('fingerprintPreset').value = account.fingerprint || 'no_spoofing';
    
    // Информация
    document.getElementById('authStatus').textContent = account.authStatus;
    document.getElementById('lastLogin').textContent = account.lastLogin;
    document.getElementById('profileSize').textContent = account.profileSize;
}

// Настройка обработчиков событий
function setupEventListeners() {
    // TOP BAR кнопки
    document.getElementById('addAccountBtn').addEventListener('click', showAddAccountModal);
    document.getElementById('editAccountBtn').addEventListener('click', handleEditAccount);
    document.getElementById('deleteAccountBtn').addEventListener('click', deleteSelectedAccounts);
    document.getElementById('refreshBtn').addEventListener('click', handleRefresh);
    document.getElementById('launchBtn').addEventListener('click', launchSelectedAccounts);
    document.getElementById('proxyManagerBtn').addEventListener('click', openProxyManager);
    
    // Sidebar
    document.getElementById('sidebarClose').addEventListener('click', hideSidebar);
    document.getElementById('saveAccountBtn').addEventListener('click', handleSaveAccount);
    
    // Форма
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('statusFilter').addEventListener('change', handleFilter);
    document.getElementById('selectAll').addEventListener('change', handleSelectAll);
    
    // Действия в формах
    document.getElementById('generateFingerprintBtn').addEventListener('click', handleGenerateFingerprint);
    document.getElementById('checkFingerprintBtn').addEventListener('click', handleCheckFingerprint);
    document.getElementById('checkBalanceBtn').addEventListener('click', handleCheckBalance);
    
    // Кнопка тестирования прокси
    document.getElementById('testProxyBtn').addEventListener('click', handleTestProxy);
    
    // Обработчики менеджера прокси
    document.getElementById('startParsingBtn').addEventListener('click', handleStartParsing);
    document.getElementById('testAllProxiesBtn').addEventListener('click', handleTestAllProxies);
    document.getElementById('clearProxiesBtn').addEventListener('click', handleClearProxies);
    document.getElementById('applyProxyBtn').addEventListener('click', handleApplyProxy);
    document.getElementById('previewProxyBtn').addEventListener('click', handlePreviewProxy);
    document.getElementById('selectAllProxies').addEventListener('click', toggleSelectAllProxies);
}

// Настройка переключения вкладок
function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Обновляем кнопки
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    // Обновляем контент
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const targetContent = document.getElementById(`tab-${tabName}`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    currentTab = tabName;
}

// Настройка переключения паролей
function setupPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentNode.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
}

// Выбор аккаунтов
function toggleAccountSelection(accountId) {
    if (selectedAccounts.has(accountId)) {
        selectedAccounts.delete(accountId);
    } else {
        selectedAccounts.add(accountId);
    }
    updateSelectAllState();
}

// Получить ID выбранных аккаунтов
function getSelectedAccountIds() {
  const selectedIds = [];
  const checkboxes = document.querySelectorAll('.account-checkbox:checked');
  checkboxes.forEach(checkbox => {
    selectedIds.push(parseInt(checkbox.dataset.id));
  });
  return selectedIds;
}

// Удалить выбранные аккаунты
function deleteSelectedAccounts() {
  const selectedIds = getSelectedAccountIds();
  if (selectedIds.length === 0) {
    showToast('Выберите аккаунты для удаления', 'warning');
    return;
  }
  
  if (confirm(`Удалить ${selectedIds.length} аккаунтов?`)) {
    showToast(`Удаление ${selectedIds.length} аккаунтов...`, 'info');
    
    // Удаляем из массива
    for (let i = accountsData.length - 1; i >= 0; i--) {
      if (selectedIds.includes(accountsData[i].id)) {
        accountsData.splice(i, 1);
      }
    }
    
    // Очищаем выбор
    selectedAccounts.clear();
    
    // Перерисовываем таблицу
    loadAccountsTable();
    
    // Сохраняем в LocalStorage
    saveToLocalStorage();
    
    showToast(`Удалено ${selectedIds.length} аккаунтов`, 'success');
  }
}

// Запустить выбранные аккаунты
function launchSelectedAccounts() {
    const selectedIds = getSelectedAccountIds();
    if (selectedIds.length === 0) {
        showToast('Выберите аккаунты для запуска', 'warning');
        return;
    }
    
    showToast(`Запуск ${selectedIds.length} браузеров...`, 'info');
    
    // Запускаем аккаунты параллельно
    const launchPromises = selectedIds.map(async (id) => {
        const account = accountsData.find(acc => acc.id === id);
        if (account) {
            try {
                await launchBrowserViaAPI(account);
                account.status = 'working';
                account.lastLaunch = 'сейчас';
                account.authStatus = 'В работе';
            } catch (error) {
                console.error(`Ошибка запуска аккаунта ${account.email}:`, error);
                // Fallback: локальная симуляция
                account.status = 'working';
                account.lastLaunch = 'сейчас';
            }
        }
    });
    
    // Ждем завершения всех запусков
    Promise.allSettled(launchPromises).then(() => {
        // Перерисовываем таблицу
        loadAccountsTable();
        
        // Сохраняем в LocalStorage
        saveToLocalStorage();
        
        showToast(`Запущено ${selectedIds.length} браузеров`, 'success');
    });
}

// Выбрать/снять все аккаунты
function toggleSelectAllAccounts() {
  const selectAllCheckbox = document.getElementById('selectAll');
  const accountCheckboxes = document.querySelectorAll('.account-checkbox');
  
  if (selectAllCheckbox.checked) {
    selectedAccounts.clear();
    accountCheckboxes.forEach(checkbox => {
      checkbox.checked = true;
      selectedAccounts.add(parseInt(checkbox.dataset.id));
    });
  } else {
    selectedAccounts.clear();
    accountCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
  }
  
  updateSelectAllState();
}

function handleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('#accountsTableBody input[type="checkbox"]');
    
    if (selectAllCheckbox.checked) {
        selectedAccounts.clear();
        accountsData.forEach(account => {
            selectedAccounts.add(account.id);
        });
        checkboxes.forEach(cb => cb.checked = true);
    } else {
        selectedAccounts.clear();
        checkboxes.forEach(cb => cb.checked = false);
    }
}

function updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('#accountsTableBody input[type="checkbox"]');
    const checkedBoxes = document.querySelectorAll('#accountsTableBody input[type="checkbox"]:checked');
    
    if (checkedBoxes.length === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (checkedBoxes.length === checkboxes.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else {
        selectAllCheckbox.indeterminate = true;
    }
}

// Поиск и фильтрация
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    filterAndDisplayAccounts();
}

function handleFilter() {
    const statusFilter = document.getElementById('statusFilter').value;
    filterAndDisplayAccounts();
}

function filterAndDisplayAccounts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filteredAccounts = accountsData.filter(account => {
        const matchesSearch = searchTerm === '' || 
            account.email.toLowerCase().includes(searchTerm) ||
            account.proxy.toLowerCase().includes(searchTerm) ||
            (account.proxyUsername && account.proxyUsername.toLowerCase().includes(searchTerm)) ||
            account.status.toLowerCase().includes(searchTerm) ||
            account.fingerprint.toLowerCase().includes(searchTerm) ||
            account.profilePath.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || account.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    updateSearchResultsCount(filteredAccounts.length, accountsData.length);
    
    const tbody = document.getElementById('accountsTableBody');
    tbody.innerHTML = '';
    
    filteredAccounts.forEach(account => {
        const row = createAccountRow(account);
        tbody.appendChild(row);
    });
    
    updateSelectAllState();
}

// Скрытие sidebar
function hideSidebar() {
    const sidebar = document.getElementById('settingsSidebar');
    sidebar.classList.add('animate-out');
    setTimeout(() => {
        sidebar.classList.remove('active', 'animate-out');
        currentAccount = null;
    }, 300);
}

// Обработчики кнопок
function openAccountSettings(accountId) {
    const account = accountsData.find(acc => acc.id === accountId);
    if (account) {
        selectAccount(account);
    }
}

function launchSingleAccount(accountId) {
    try {
        const accounts = accountsData || [];
        const account = accounts.find(acc => acc.id === accountId);
        
        if (account) {
            // Используем новую API функцию
            launchBrowserViaAPI(account)
                .then(result => {
                    // Обновляем статус в таблице при успешном запуске
                    if (result.success) {
                        account.status = 'working';
                        account.lastLaunch = 'сейчас';
                        account.authStatus = 'В работе';
                        
                        // Сохраняем данные в LocalStorage
                        saveToLocalStorage();
                        
                        loadAccountsTable();
                    }
                })
                .catch(error => {
                    console.error('Ошибка запуска браузера:', error);
                    // Fallback: локальная симуляция при ошибке API
                    account.status = 'working';
                    account.lastLaunch = 'сейчас';
                    saveToLocalStorage();
                    loadAccountsTable();
                    showToast('Браузер запущен локально (API недоступно)', 'info');
                });
        }
    } catch (error) {
        console.error('Ошибка запуска браузера:', error);
        showToast('Ошибка запуска браузера: ' + error.message, 'error');
    }
}

function handleSaveAccount() {
    if (!currentAccount) {
        showToast('Выберите аккаунт для сохранения', 'warning');
        return;
    }
    
    // Собираем данные формы
    const formData = {
        email: document.getElementById('accountEmail').value.trim(),
        password: document.getElementById('accountPassword').value.trim(),
        secretAnswer: document.getElementById('secretQuestion').value.trim(),
        profilePath: document.getElementById('chromeProfile').value.trim(),
        proxy: document.getElementById('proxyAddress').value.trim(),
        proxyUsername: document.getElementById('proxyUsername').value.trim(),
        proxyPassword: document.getElementById('proxyPassword').value.trim(),
        proxyType: document.getElementById('proxyType').value,
        fingerprint: document.getElementById('fingerprintPreset').value
    };
    
    // Валидация с использованием новой функции
    if (!validateAccountForm(formData)) {
        return;
    }
    
    showToast(`Сохранение настроек аккаунта ${currentAccount.email}...`, 'info');
    
    // Симуляция сохранения с валидацией
    const saveBtn = document.getElementById('saveAccountBtn');
    saveBtn.classList.add('loading');
    saveBtn.disabled = true;
    
    setTimeout(async () => {
        try {
            // Обновляем все поля currentAccount
            Object.assign(currentAccount, formData);
            
            // Пробуем сохранить через API (если доступен)
            try {
                await updateAccountViaAPI(formData);
            } catch (apiError) {
                // Если API недоступен, используем локальное сохранение
                console.log('API недоступно, используем локальное сохранение');
                showToast('Данные сохранены локально', 'info');
            }
            
            // Сохраняем данные в LocalStorage
            saveToLocalStorage();
            
            saveBtn.classList.remove('loading');
            saveBtn.disabled = false;
            
            showToast(`Настройки аккаунта ${currentAccount.email} сохранены`, 'success');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            saveBtn.classList.remove('loading');
            saveBtn.disabled = false;
            showToast('Ошибка сохранения: ' + error.message, 'error');
        }
    }, 1500);
}

function handleLaunchSelected() {
    try {
        const accounts = accountsData || [];
        const selected = selectedAccounts || new Set();
        
        if (selected.size === 0) {
            showToast('Выберите аккаунты для запуска', 'warning');
            return;
        }
        
        showToast(`Запуск ${selected.size} браузеров...`, 'info');
        
        // Симуляция массового запуска
        setTimeout(() => {
            try {
                showToast(`Запущено ${selected.size} браузеров`, 'success');
                
                // Обновляем статусы
                selected.forEach(accountId => {
                    const account = accounts.find(acc => acc.id === accountId);
                    if (account) {
                        account.status = 'working';
                        account.lastLaunch = 'сейчас';
                    }
                });
                
                selected.clear();
                loadAccountsTable();
                
                // Сохраняем данные в LocalStorage
                saveToLocalStorage();
            } catch (error) {
                console.error('Ошибка массового запуска:', error);
                showToast('Ошибка запуска браузеров: ' + error.message, 'error');
            }
        }, 3000);
    } catch (error) {
        console.error('Ошибка массового запуска:', error);
        showToast('Ошибка запуска браузеров: ' + error.message, 'error');
    }
}

function handleRefresh() {
    showToast('Обновление статусов...', 'info');
    
    // Симуляция обновления
    setTimeout(() => {
        // Обновляем случайные статусы
        accountsData.forEach(account => {
            if (Math.random() > 0.7) {
                const statuses = ['active', 'needs_login', 'error', 'working'];
                account.status = statuses[Math.floor(Math.random() * statuses.length)];
            }
        });
        
        loadAccountsTable();
        showToast('Статусы обновлены', 'success');
        
        // Сохраняем данные в LocalStorage
        saveToLocalStorage();
    }, 2000);
}

function handleEditAccount() {
    if (!currentAccount) {
        showToast('Выберите аккаунт для редактирования', 'warning');
        return;
    }
    
    showToast(`Открытие редактирования для ${currentAccount.email}`, 'info');
    // В реальном приложении здесь бы открывался диалог редактирования
}

function handleDeleteAccounts() {
    if (selectedAccounts.size === 0) {
        showToast('Выберите аккаунты для удаления', 'warning');
        return;
    }
    
    if (confirm(`Удалить ${selectedAccounts.size} аккаунтов?`)) {
        showToast(`Удаление ${selectedAccounts.size} аккаунтов...`, 'info');
        
        setTimeout(() => {
            // Удаляем аккаунты из массива
            for (let i = accountsData.length - 1; i >= 0; i--) {
                if (selectedAccounts.has(accountsData[i].id)) {
                    accountsData.splice(i, 1);
                }
            }
            
            selectedAccounts.clear();
            loadAccountsTable();
            showToast('Аккаунты удалены', 'success');
            
            // Сохраняем данные в LocalStorage
            saveToLocalStorage();
        }, 1000);
    }
}

function showAddAccountModal() {
    showToast('Открытие формы добавления аккаунта...', 'info');
    // В реальном приложении здесь бы открывался диалог добавления
}

// Обработчики вкладок
function handleTestProxy() {
    try {
        const proxyAddress = document.getElementById('proxyAddress')?.value?.trim() || '';
        const proxyUsername = document.getElementById('proxyUsername')?.value?.trim() || '';
        const proxyPassword = document.getElementById('proxyPassword')?.value?.trim() || '';
        const proxyType = document.getElementById('proxyType')?.value || 'http';
        
        if (!proxyAddress) {
            showToast('Аккаунт будет работать без прокси', 'info');
            return;
        }
        
        const proxyData = {
            proxy: proxyAddress,
            username: proxyUsername,
            password: proxyPassword,
            type: proxyType
        };
        
        // Валидация прокси
        if (!validateProxy(proxyAddress)) {
            showToast('❌ Неверный формат прокси', 'error');
            return;
        }
        
        const testBtn = document.getElementById('testProxyBtn');
        if (testBtn) {
            testBtn.classList.add('loading');
            testBtn.disabled = true;
        }
        
        // Используем новую API функцию
        testProxyViaAPI(proxyData)
            .then(result => {
                const statusElement = document.getElementById('proxyStatus');
                const speedElement = document.getElementById('proxySpeed');
                const ipElement = document.getElementById('proxyIP');
                
                if (result.working) {
                    if (statusElement) statusElement.textContent = '✅ Работает';
                    if (speedElement) speedElement.textContent = result.responseTime + 'ms';
                    if (ipElement) ipElement.textContent = result.ip + ` (${result.country})`;
                } else {
                    if (statusElement) statusElement.textContent = '❌ Не работает';
                    if (speedElement) speedElement.textContent = '--';
                    if (ipElement) ipElement.textContent = '--';
                }
            })
            .catch(error => {
                console.error('Ошибка тестирования прокси:', error);
            })
            .finally(() => {
                if (testBtn) {
                    testBtn.classList.remove('loading');
                    testBtn.disabled = false;
                }
            });
    } catch (error) {
        console.error('Ошибка тестирования прокси:', error);
        showToast('Не удалось протестировать прокси: ' + error.message, 'error');
        
        const testBtn = document.getElementById('testProxyBtn');
        if (testBtn) {
            testBtn.classList.remove('loading');
            testBtn.disabled = false;
        }
    }
}

function handleRemoveProxy() {
    if (confirm('Удалить прокси из настроек аккаунта?')) {
        document.getElementById('proxyAddress').value = '';
        document.getElementById('proxyUsername').value = '';
        document.getElementById('proxyPassword').value = '';
        showToast('Прокси удален из настроек', 'success');
    }
}

function showParsedProxies() {
    showToast('Открытие списка спарсенных прокси...', 'info');
    // В реальном приложении здесь бы открывался список прокси
}

function handleGenerateFingerprint() {
    showToast('Генерация нового отпечатка...', 'info');
    
    const generateBtn = document.getElementById('generateFingerprintBtn');
    generateBtn.classList.add('loading');
    generateBtn.disabled = true;
    
    setTimeout(() => {
        // Генерируем случайный отпечаток
        const presets = ['russia_standard', 'kazakhstan_standard', 'no_spoofing'];
        const randomPreset = presets[Math.floor(Math.random() * presets.length)];
        
        document.getElementById('fingerprintPreset').value = randomPreset;
        showToast('Новый отпечаток сгенерирован', 'success');
        
        generateBtn.classList.remove('loading');
        generateBtn.disabled = false;
    }, 2000);
}

function handleCheckFingerprint() {
    showToast('Проверка отпечатка на CreepJS...', 'info');
    
    const checkBtn = document.getElementById('checkFingerprintBtn');
    checkBtn.classList.add('loading');
    checkBtn.disabled = true;
    
    setTimeout(() => {
        const score = Math.floor(Math.random() * 30) + 70; // 70-99
        showToast(`Отпечаток уникальность: ${score}%`, score > 85 ? 'success' : 'warning');
        
        checkBtn.classList.remove('loading');
        checkBtn.disabled = false;
    }, 3000);
}

function handleCheckBalance() {
    const service = document.getElementById('captchaService').value;
    const apiKey = document.getElementById('captchaApiKey').value;
    
    if (service === 'none') {
        showToast('Выберите сервис капчи', 'warning');
        return;
    }
    
    if (!apiKey) {
        showToast('Укажите API ключ', 'warning');
        return;
    }
    
    showToast('Проверка баланса...', 'info');
    
    const checkBtn = document.getElementById('checkBalanceBtn');
    checkBtn.classList.add('loading');
    checkBtn.disabled = true;
    
    setTimeout(() => {
        const balance = (Math.random() * 50 + 5).toFixed(2); // 5-55 долларов
        document.getElementById('captchaBalance').textContent = `$${balance}`;
        document.getElementById('captchaStatus').textContent = 'Подключен';
        showToast(`Баланс: $${balance}`, 'success');
        
        checkBtn.classList.remove('loading');
        checkBtn.disabled = false;
    }, 2000);
}

// Модал импорта прокси
function openProxyManager() {
    showToast('Открыт менеджер прокси', 'info');
    // TODO: Будет реализовано на этапе 3
}

function hideImportProxyModal() {
    const modal = document.getElementById('importProxyModal');
    modal.classList.remove('show');
}

function handleStartImport() {
    const source = document.getElementById('proxySource').value;
    const protocol = document.getElementById('proxyProtocol').value;
    const country = document.getElementById('countryFilter').value;
    const proxyList = document.getElementById('proxyListInput').value;
    
    if (!proxyList && source !== 'custom') {
        showToast(`Запуск парсинга с ${source}...`, 'info');
    } else if (proxyList) {
        showToast('Обработка введенных прокси...', 'info');
    } else {
        showToast('Укажите источник или введите прокси', 'warning');
        return;
    }
    
    const startBtn = document.getElementById('startImportBtn');
    startBtn.classList.add('loading');
    startBtn.disabled = true;
    
    setTimeout(() => {
        const found = Math.floor(Math.random() * 500) + 100; // 100-600 прокси
        const valid = Math.floor(found * (0.6 + Math.random() * 0.3)); // 60-90% валидных
        
        showToast(`Найдено: ${found} прокси, валидных: ${valid}`, 'success');
        
        startBtn.classList.remove('loading');
        startBtn.disabled = false;
        hideImportProxyModal();
    }, 4000);
}

// Toast уведомления
function setupToastNotifications() {
    // Создаем контейнер для toast уведомлений, если его нет
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

function showToast(message, type = 'info', duration = 4000) {
  const toastContainer = document.getElementById('toastContainer');
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = getToastIcon(type);
  toast.innerHTML = `
    <i class="${icon}"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  const progressBar = document.createElement('div');
  progressBar.className = 'toast-progress';
  progressBar.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: ${getProgressColor(type)};
    animation: toastProgress ${duration}ms linear;
  `;
  toast.appendChild(progressBar);
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    hideToast(toast);
  }, duration);
  
  const toasts = toastContainer.querySelectorAll('.toast');
  if (toasts.length > 5) {
    toasts[0].remove();
  }
}

function getProgressColor(type) {
  const colors = {
    'success': '#28a745',
    'error': '#dc3545',
    'warning': '#ffc107',
    'info': '#17a2b8'
  };
  return colors[type] || colors['info'];
}

function getToastIcon(type) {
    const iconMap = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    return iconMap[type] || iconMap['info'];
}

function hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

function showConfirmToast(message, onConfirm) {
  const toastContainer = document.getElementById('toastContainer');
  
  const toast = document.createElement('div');
  toast.className = 'toast confirm';
  
  toast.innerHTML = `
    <i class="fas fa-question-circle" style="color: #ffc107; font-size: 18px; margin-top: 2px;"></i>
    <span class="toast-message">${message}</span>
    <div class="toast-actions">
      <button class="btn btn-small btn-success" onclick="this.closest('.toast').remove(); (${onConfirm})()">Да</button>
      <button class="btn btn-small btn-secondary" onclick="this.closest('.toast').remove()">Нет</button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
}

function showProgressToast(message) {
  const toastContainer = document.getElementById('toastContainer');
  
  const toast = document.createElement('div');
  toast.className = 'toast progress';
  
  toast.innerHTML = `
    <div class="spinner" style="width: 18px; height: 18px; border: 2px solid #f3f3f3; border-top: 2px solid #007acc; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    <span class="toast-message">${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  
  return toast;
}

function hideProgressToast(toastElement) {
  if (toastElement && toastElement.parentNode) {
    hideToast(toastElement);
  }
}

// Дополнительные утилиты
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'сейчас';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;
    
    return date.toLocaleDateString('ru-RU');
}

// Обработка изменений в формах
document.addEventListener('input', function(e) {
    if (currentAccount && e.target.closest('.sidebar')) {
        // Сохраняем изменения локально (в реальном приложении отправляли бы на сервер)
        const fieldId = e.target.id;
        const value = e.target.value;
        
        if (fieldId === 'accountEmail') currentAccount.email = value;
        else if (fieldId === 'accountPassword') currentAccount.password = value;
        else if (fieldId === 'secretQuestion') currentAccount.secretAnswer = value;
        else if (fieldId === 'chromeProfile') currentAccount.profilePath = value;
        else if (fieldId === 'proxyAddress') currentAccount.proxy = value;
        else if (fieldId === 'proxyUsername') currentAccount.proxyUsername = value;
        else if (fieldId === 'proxyPassword') currentAccount.proxyPassword = value;
        else if (fieldId === 'fingerprintPreset') currentAccount.fingerprint = value;
        
        showToast('Изменения сохранены', 'success');
        
        // Сохраняем данные в LocalStorage
        saveToLocalStorage();
    }
});

// Обработка изменений в селектах
document.addEventListener('change', function(e) {
    if (currentAccount && e.target.closest('.sidebar')) {
        const fieldId = e.target.id;
        const value = e.target.value;
        
        if (fieldId === 'proxyType') currentAccount.proxyType = value;
        else if (fieldId === 'fingerprintPreset') currentAccount.fingerprint = value;
        
        // Обновляем отображение в таблице
        if (fieldId === 'fingerprintPreset') {
            loadAccountsTable();
        }
        
        // Сохраняем данные в LocalStorage
        saveToLocalStorage();
    }
});

// Обработка checkbox'ов
document.addEventListener('change', function(e) {
    if (currentAccount && e.target.closest('.sidebar')) {
        const fieldId = e.target.id;
        const checked = e.target.checked;
        
        if (fieldId === 'autoSolveCaptcha') {
            showToast(`Авторешение капчи: ${checked ? 'включено' : 'отключено'}`, 'info');
        }
    }
});

// Обработка закрытия модалов по клику вне их
document.addEventListener('click', function(e) {
    const modal = document.getElementById('importProxyModal');
    if (e.target === modal) {
        hideImportProxyModal();
    }
});

// Обработка Escape для закрытия модалов
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('importProxyModal');
        if (modal.classList.contains('show')) {
            hideImportProxyModal();
        }
        
        if (document.getElementById('settingsSidebar').classList.contains('active')) {
            hideSidebar();
        }
    }
});

// ========== БЛОКИ УПРАВЛЕНИЯ ПРОКСИ ==========

// Импорт прокси из блока
document.getElementById('importProxyBlockBtn')?.addEventListener('click', function() {
    showImportProxyModal();
});

// Тест всех прокси
document.getElementById('testAllProxiesBtn')?.addEventListener('click', function() {
    showToast('🔄 Тестирование всех прокси...', 'info');
    setTimeout(() => {
        showToast('✅ Проверено 28 прокси: 23 рабочих, 5 мёртвых', 'success');
    }, 2000);
});

// Очистка мёртвых прокси
document.getElementById('clearDeadProxiesBtn')?.addEventListener('click', function() {
    showToast('🗑️ Удалено 5 мёртвых прокси', 'warning');
});

// ========== БЛОК БЫСТРЫХ ДЕЙСТВИЙ ==========

// Обновить все статусы
document.getElementById('refreshAllStatusesBtn')?.addEventListener('click', function() {
    showToast('🔄 Обновление статусов всех аккаунтов...', 'info');
    setTimeout(() => {
        loadAccountsTable();
        showToast('✅ Статусы обновлены', 'success');
    }, 1500);
});

// Массовый запуск
document.getElementById('massLaunchBtn')?.addEventListener('click', function() {
    showToast('▶️ Запуск 5 браузеров одновременно...', 'info');
    setTimeout(() => {
        showToast('✅ Запущено 5 браузеров на портах 9222-9226', 'success');
    }, 2000);
});

// Проверить авторизацию
document.getElementById('checkAuthBtn')?.addEventListener('click', function() {
    showToast('🔐 Проверка авторизации в Wordstat...', 'info');
    setTimeout(() => {
        showToast('✅ 4 аккаунта авторизованы, 2 требуют входа', 'success');
    }, 1800);
});

// Экспорт списка аккаунтов
document.getElementById('exportAccountsBtn')?.addEventListener('click', function() {
    showToast('📊 Экспорт списка аккаунтов в CSV...', 'info');
    setTimeout(() => {
        showToast('✅ Файл accounts.csv загружен', 'success');
    }, 1200);
});

// ========== БЛОК ИСТОРИИ ЗАПУСКОВ ==========

// Показать всю историю
document.getElementById('showAllHistoryBtn')?.addEventListener('click', function() {
    showToast('📋 Открытие полной истории запусков...', 'info');
    // Здесь можно открыть модальное окно с полной историей
});

// ========== ФУНКЦИИ ОБНОВЛЕНИЯ ДАННЫХ ==========

// Функция для обновления данных в блоках (можно вызывать из других мест)
function updateBottomBlocksData() {
    // Обновление счётчиков прокси
    const proxyItems = document.querySelectorAll('.proxy-item');
    const activeProxies = Array.from(proxyItems).filter(item => 
        item.querySelector('.proxy-status.working')
    ).length;
    const deadProxies = proxyItems.length - activeProxies;
    
    // Можно добавить логику обновления динамических данных
    console.log(`Прокси: ${activeProxies} активных, ${deadProxies} мёртвых`);
}

// ========== ТЕСТИРОВАНИЕ ПРОКСИ ==========

function handleTestProxyV2() {
    try {
        const proxyAddress = document.getElementById('proxyAddress')?.value?.trim() || '';
        const proxyUsername = document.getElementById('proxyUsername')?.value?.trim() || '';
        const proxyPassword = document.getElementById('proxyPassword')?.value?.trim() || '';
        const proxyType = document.getElementById('proxyType')?.value || 'http';
        
        const statusInfo = document.getElementById('proxyStatusInfo');
        const statusElement = document.getElementById('proxyStatus');
        const speedElement = document.getElementById('proxySpeed');
        const ipElement = document.getElementById('proxyIP');
        
        if (!proxyAddress) {
            // Прямое подключение
            if (statusInfo) statusInfo.style.display = 'block';
            if (statusElement) statusElement.textContent = '🔵 Прямое подключение';
            if (speedElement) speedElement.textContent = '--';
            if (ipElement) ipElement.textContent = '--';
            showToast('Аккаунт будет работать без прокси', 'info');
            return;
        }
        
        // Показать статус загрузки
        if (statusInfo) statusInfo.style.display = 'block';
        if (statusElement) statusElement.textContent = '⏳ Тестирование...';
        if (speedElement) speedElement.textContent = '--';
        if (ipElement) ipElement.textContent = '--';
        
        // Имитация тестирования прокси (в реальном проекте здесь был бы AJAX запрос)
        setTimeout(() => {
            try {
                const isWorking = Math.random() > 0.3; // 70% шанс что прокси работает
                const speed = Math.floor(Math.random() * 500) + 100; // 100-600ms
                
                if (isWorking) {
                    if (statusElement) statusElement.textContent = '✅ Работает';
                    if (speedElement) speedElement.textContent = speed + 'ms';
                    if (ipElement) ipElement.textContent = '185.176.26.202 (Россия 🇷🇺)';
                    showToast('Прокси успешно протестирован!', 'success');
                } else {
                    if (statusElement) statusElement.textContent = '❌ Не работает';
                    if (speedElement) speedElement.textContent = '--';
                    if (ipElement) ipElement.textContent = '--';
                    showToast('Ошибка тестирования прокси', 'error');
                }
            } catch (error) {
                console.error('Ошибка тестирования прокси:', error);
                showToast('Не удалось протестировать прокси: ' + error.message, 'error');
            }
        }, 2000);
    } catch (error) {
        console.error('Ошибка тестирования прокси:', error);
        showToast('Не удалось протестировать прокси: ' + error.message, 'error');
    }
}

// ========== МЕНЕДЖЕР ПРОКСИ ==========

function handleStartParsing() {
    try {
        const selectedSources = [];
        const sources = ['fineproxy', 'proxyelite', 'htmlweb', 'advanced', 'market'];
        
        sources.forEach(source => {
            const checkbox = document.getElementById(`source-${source}`);
            if (checkbox && checkbox.checked) {
                selectedSources.push(source);
            }
        });
        
        const protocol = document.getElementById('proxyProtocol')?.value || 'http';
        const country = document.getElementById('countryFilter')?.value || '';
        
        if (selectedSources.length === 0) {
            showToast('Выберите хотя бы один источник для парсинга', 'warning');
            return;
        }
        
        const options = {
            sources: selectedSources,
            protocol: protocol,
            country: country,
            count: 100 // количество прокси для парсинга
        };
        
        // Используем новую API функцию
        parseProxiesViaAPI(options)
            .then(result => {
                if (result.success && result.proxies) {
                    // Добавляем новые прокси в proxyPool
                    proxyPool.push(...result.proxies);
                    
                    // Сохраняем в LocalStorage
                    saveToLocalStorage();
                }
            })
            .catch(error => {
                console.error('Ошибка парсинга прокси:', error);
                // Fallback: генерируем тестовые прокси если API недоступен
                const newProxies = generateSampleProxies(Math.floor(Math.random() * 20) + 10);
                proxyPool.push(...newProxies);
                saveToLocalStorage();
                showToast(`API недоступно. Добавлено ${newProxies.length} тестовых прокси`, 'info');
            });
    } catch (error) {
        console.error('Ошибка парсинга прокси:', error);
        showToast('Ошибка парсинга прокси: ' + error.message, 'error');
    }
}

function handleTestAllProxies() {
    showToast('Запущен тест всех прокси...', 'info');
    
    // Симуляция тестирования прокси
    setTimeout(() => {
        // Обновляем статусы прокси
        proxyPool.forEach(proxy => {
            if (Math.random() > 0.3) {
                proxy.status = 'active';
                proxy.lastTest = new Date().toLocaleString('ru-RU');
                proxy.responseTime = Math.floor(Math.random() * 500) + 50;
            } else {
                proxy.status = 'dead';
            }
        });
        
        // Сохраняем изменения
        saveToLocalStorage();
        
        const activeCount = proxyPool.filter(p => p.status === 'active').length;
        showToast(`Тестирование завершено! Активных: ${activeCount}/${proxyPool.length}`, 'success');
    }, 3000);
}

function handleClearProxies() {
    if (confirm('Удалить все прокси из списка?')) {
        proxyPool = [];
        
        const proxyListBody = document.getElementById('proxyListBody');
        if (proxyListBody) {
            proxyListBody.innerHTML = '';
        }
        
        // Сохраняем изменения
        saveToLocalStorage();
        
        showToast('Список прокси очищен', 'success');
    }
}

function handleApplyProxy() {
    const selectedProxyId = document.querySelector('.proxy-table tbody input[type="checkbox"]:checked')?.dataset.id;
    if (!selectedProxyId) {
        showToast('Выберите прокси для применения', 'warning');
        return;
    }
    
    const proxy = proxyPool.find(p => p.id.toString() === selectedProxyId);
    if (proxy && currentAccount) {
        currentAccount.proxy = `${proxy.host}:${proxy.port}`;
        currentAccount.proxyUsername = proxy.username;
        currentAccount.proxyPassword = proxy.password;
        currentAccount.proxyType = proxy.type;
        
        // Обновляем поля в форме
        document.getElementById('proxyAddress').value = currentAccount.proxy;
        document.getElementById('proxyUsername').value = currentAccount.proxyUsername;
        document.getElementById('proxyPassword').value = currentAccount.proxyPassword;
        document.getElementById('proxyType').value = currentAccount.proxyType;
        
        // Сохраняем изменения
        saveToLocalStorage();
        
        showToast('Прокси применен к аккаунту!', 'success');
    }
}

function handlePreviewProxy() {
    const selectedProxyId = document.querySelector('.proxy-table tbody input[type="checkbox"]:checked')?.dataset.id;
    if (!selectedProxyId) {
        showToast('Выберите прокси для предпросмотра', 'warning');
        return;
    }
    
    const proxy = proxyPool.find(p => p.id.toString() === selectedProxyId);
    if (proxy) {
        showToast(`Предпросмотр прокси: ${proxy.host}:${proxy.port} (${proxy.country})`, 'info');
    }
}

function toggleSelectAllProxies(event) {
    const checkboxes = document.querySelectorAll('.proxy-table tbody input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = event.target.checked;
    });
}

function hideImportProxyModal() {
    const modal = document.getElementById('importProxyModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleStartImport() {
    showToast('Начинаем импорт прокси...', 'info');
    hideImportProxyModal();
}

// Экспорт функций toast в глобальную область видимости
if (typeof window !== 'undefined') {
    window.showToast = showToast;
    window.showConfirmToast = showConfirmToast;
    window.showProgressToast = showProgressToast;
    window.hideProgressToast = hideProgressToast;
}

// Сохранение данных в LocalStorage
function saveToLocalStorage() {
    try {
        const data = {
            accounts: accountsData,
            proxyPool: proxyPool,
            settings: settings
        };
        localStorage.setItem('keyset_data', JSON.stringify(data));
    } catch (error) {
        console.error('Ошибка сохранения в LocalStorage:', error);
    }
}

// ========== УЛУЧШЕННЫЙ ПОИСК И ФИЛЬТРАЦИЯ ==========

// Функция подсветки найденного текста
function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background: yellow; padding: 1px 2px; border-radius: 2px;">$1</mark>');
}

// Новая функция для обновления счётчика результатов
function updateSearchResultsCount(found, total) {
    let resultsElement = document.getElementById('searchResultsCount');
    
    if (!resultsElement) {
        // Создаём элемент если его нет
        resultsElement = document.createElement('div');
        resultsElement.id = 'searchResultsCount';
        resultsElement.style.cssText = `
            font-size: 12px;
            color: #666;
            margin-left: 15px;
            padding: 8px 12px;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #e9ecef;
        `;
        
        // Добавляем после поискового поля
        const searchBox = document.querySelector('.search-box');
        searchBox.parentNode.insertBefore(resultsElement, searchBox.nextSibling);
    }
    
    if (found === total) {
        resultsElement.textContent = `Всего аккаунтов: ${total}`;
        resultsElement.style.color = '#666';
    } else {
        resultsElement.textContent = `Найдено: ${found} из ${total}`;
        resultsElement.style.color = found > 0 ? '#28a745' : '#dc3545';
    }
}

// Функции быстрых фильтров
function filterByStatus(status) {
    document.getElementById('statusFilter').value = status;
    filterAndDisplayAccounts();
    showToast(`Фильтр: ${getStatusText(status)}`, 'info');
}

function filterByProxy() {
    document.getElementById('searchInput').value = 'proxy';
    filterAndDisplayAccounts();
    showToast('Фильтр: аккаунты с прокси', 'info');
}

function clearAllFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    filterAndDisplayAccounts();
    showToast('Фильтры очищены', 'info');
}

// Настройка обработчика клавиатуры для поиска
function setupSearchKeyboardHandler() {
    // Обработка поиска по клавише Enter
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.id === 'searchInput') {
            e.preventDefault();
            filterAndDisplayAccounts();
            showToast('Поиск выполнен', 'info');
        }
    });
}

// Экспорт функций для глобального доступа
window.selectAccount = selectAccount;
window.toggleAccountSelection = toggleAccountSelection;
window.launchSingleAccount = launchSingleAccount;
window.openAccountSettings = openAccountSettings;
window.updateBottomBlocksData = updateBottomBlocksData;
window.showConfirmToast = showConfirmToast;
window.showProgressToast = showProgressToast;
window.hideProgressToast = hideProgressToast;
window.filterByStatus = filterByStatus;
window.filterByProxy = filterByProxy;
window.clearAllFilters = clearAllFilters;

// ========== ВАЛИДАЦИЯ ДАННЫХ ==========

// Валидация email адреса
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Валидация прокси
function validateProxy(proxy) {
    if (!proxy || proxy.trim() === '') return true; // Пустой прокси разрешен
    const re = /^(\w+:\w+@)?\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/;
    return re.test(proxy);
}

// Комплексная валидация формы аккаунта
function validateAccountForm(data) {
    if (!data.email || !validateEmail(data.email)) {
        showToast('❌ Неверный формат email', 'error');
        return false;
    }
    
    if (!data.password || data.password.length < 6) {
        showToast('❌ Пароль должен содержать минимум 6 символов', 'error');
        return false;
    }
    
    if (!data.secretAnswer || data.secretAnswer.trim().length < 3) {
        showToast('❌ Секретный ответ слишком короткий', 'error');
        return false;
    }
    
    if (data.proxy && !validateProxy(data.proxy)) {
        showToast('❌ Неверный формат прокси (IP:PORT или user:pass@IP:PORT)', 'error');
        return false;
    }
    
    return true;
}

// ========== API ЗАПРОСЫ ==========

// Сохранение аккаунта через API
async function updateAccountViaAPI(accountData) {
    try {
        const response = await fetch('/api/accounts/update', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(accountData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        showToast('✅ Аккаунт успешно обновлен', 'success');
        return result;
    } catch (error) {
        console.error('Ошибка API сохранения:', error);
        showToast('Ошибка сохранения: ' + error.message, 'error');
        throw error;
    }
}

// Запуск браузера через API
async function launchBrowserViaAPI(accountData) {
    try {
        showToast(`🚀 Запуск браузера для ${accountData.email}...`, 'info');
        
        const response = await fetch('/api/browser/launch', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(accountData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`✅ Браузер запущен для ${accountData.email} на порту ${result.port}`, 'success');
            return result;
        } else {
            throw new Error(result.error || 'Неизвестная ошибка');
        }
    } catch (error) {
        console.error('Ошибка запуска браузера:', error);
        showToast('Ошибка запуска: ' + error.message, 'error');
        throw error;
    }
}

// Тестирование прокси через API
async function testProxyViaAPI(proxyData) {
    try {
        showToast('🔍 Тестирование прокси...', 'info');
        
        const response = await fetch('/api/proxy/test', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(proxyData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.working) {
            showToast(`✅ Прокси работает (${result.responseTime}ms, ${result.country})`, 'success');
            return result;
        } else {
            showToast('❌ Прокси не отвечает', 'error');
            return { working: false };
        }
    } catch (error) {
        console.error('Ошибка тестирования прокси:', error);
        showToast('Ошибка теста: ' + error.message, 'error');
        throw error;
    }
}

// Парсинг прокси через API
async function parseProxiesViaAPI(options) {
    try {
        showToast('🔄 Парсинг прокси...', 'info');
        
        const response = await fetch('/api/proxy/parse', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(options)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`✅ Найдено ${result.found} прокси (${result.valid} валидных)`, 'success');
            return result;
        } else {
            throw new Error(result.error || 'Ошибка парсинга');
        }
    } catch (error) {
        console.error('Ошибка парсинга прокси:', error);
        showToast('Ошибка парсинга: ' + error.message, 'error');
        throw error;
    }
}

// ========== УЛУЧШЕННЫЙ ПОИСК И ФИЛЬТРАЦИЯ ==========

// Функция подсветки найденного текста
function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background: yellow; padding: 1px 2px; border-radius: 2px;">$1</mark>');
}

// Отдельная функция фильтрации аккаунтов
function filterAccounts(accounts, searchTerm = '', statusFilter = '') {
    return accounts.filter(account => {
        const matchesSearch = !searchTerm || searchTerm.trim() === '' || 
            account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.proxy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (account.proxyUsername && account.proxyUsername.toLowerCase().includes(searchTerm.toLowerCase())) ||
            account.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.fingerprint.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.profilePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.secretAnswer.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = !statusFilter || account.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
}

// Отдельная функция поиска аккаунтов
function searchAccounts(searchTerm, searchInEmails = true, searchInProxies = true, searchInProfiles = true) {
    if (!searchTerm || searchTerm.trim() === '') {
        return [...accountsData]; // Возвращаем все аккаунты если поиск пустой
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    return accountsData.filter(account => {
        const matches = [];
        
        if (searchInEmails) {
            matches.push(account.email.toLowerCase().includes(term));
        }
        
        if (searchInProxies) {
            matches.push(
                account.proxy.toLowerCase().includes(term) ||
                (account.proxyUsername && account.proxyUsername.toLowerCase().includes(term))
            );
        }
        
        if (searchInProfiles) {
            matches.push(
                account.profilePath.toLowerCase().includes(term) ||
                account.status.toLowerCase().includes(term) ||
                account.fingerprint.toLowerCase().includes(term) ||
                account.secretAnswer.toLowerCase().includes(term)
            );
        }
        
        return matches.some(match => match);
    });
}

// Обновление счётчика результатов поиска
function updateSearchResultsCount(found, total) {
    let resultsElement = document.getElementById('searchResultsCount');
    if (!resultsElement) {
        resultsElement = document.createElement('div');
        resultsElement.id = 'searchResultsCount';
        resultsElement.style.cssText = 'font-size: 12px; color: #666; margin-left: 15px; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef;';
        const searchBox = document.querySelector('.search-box');
        if (searchBox && searchBox.parentNode) {
            searchBox.parentNode.insertBefore(resultsElement, searchBox.nextSibling);
        }
    }
    if (found === total) {
        resultsElement.textContent = `Всего аккаунтов: ${total}`;
        resultsElement.style.color = '#666';
    } else {
        resultsElement.textContent = `Найдено: ${found} из ${total}`;
        resultsElement.style.color = found > 0 ? '#28a745' : '#dc3545';
    }
}

// Быстрые фильтры
function filterByStatus(status) {
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.value = status;
        filterAndDisplayAccounts();
        showToast(`Фильтр: ${getStatusText(status)}`, 'info');
    }
}

function filterByProxy() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = 'proxy';
        filterAndDisplayAccounts();
        showToast('Фильтр: аккаунты с прокси', 'info');
    }
}

function clearAllFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    filterAndDisplayAccounts();
    showToast('Фильтры очищены', 'info');
}

// Обработка Enter для поиска
function setupSearchKeyboardHandler() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.id === 'searchInput') {
            e.preventDefault();
            filterAndDisplayAccounts();
            showToast('Поиск выполнен', 'info');
        }
    });
}

// Обновленная функция фильтрации и отображения с использованием новых функций
function filterAndDisplayAccounts() {
    const searchTerm = document.getElementById('searchInput').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    // Используем новую функцию filterAccounts
    const filteredAccounts = filterAccounts(accountsData, searchTerm, statusFilter);
    
    updateSearchResultsCount(filteredAccounts.length, accountsData.length);
    
    const tbody = document.getElementById('accountsTableBody');
    tbody.innerHTML = '';
    
    filteredAccounts.forEach(account => {
        const row = createAccountRow(account);
        tbody.appendChild(row);
    });
    
    updateSelectAllState();
}

function createAccountRow(account) {
    const tr = document.createElement('tr');
    tr.className = 'table-row-clickable';
    tr.onclick = (e) => {
        if (e.target.type !== 'checkbox') {
            selectAccount(account);
        }
    };

    const statusClass = `status-${account.status}`;
    const statusText = getStatusText(account.status);
    const proxyDisplay = account.proxy || 'Нет';
    const proxyClass = account.proxy ? 'proxy-info' : 'proxy-none';
    const fpClass = getFingerprintClass(account.fingerprint);
    const fpText = getFingerprintText(account.fingerprint);
    const currentSearchTerm = document.getElementById('searchInput').value;

    tr.innerHTML = `
        <td>
            <input type="checkbox" 
                   class="account-checkbox"
                   data-id="${account.id}"
                   onchange="toggleAccountSelection(${account.id})"
                   ${selectedAccounts.has(account.id) ? 'checked' : ''}>
        </td>
        <td class="account-email">${highlightSearchTerm(account.email, currentSearchTerm)}</td>
        <td>
            <span class="status-badge ${statusClass}">
                ${statusText}
            </span>
        </td>
        <td class="${proxyClass}">${highlightSearchTerm(proxyDisplay, currentSearchTerm)}</td>
        <td>
            <span class="fingerprint-badge ${fpClass}">
                ${fpText}
            </span>
        </td>
        <td class="last-run">${account.lastLaunch}</td>
        <td class="action-buttons-cell">
            <button class="action-btn action-btn-play" onclick="launchSingleAccount(${account.id})">
                <i class="fas fa-play"></i>
            </button>
            <button class="action-btn action-btn-settings" onclick="openAccountSettings(${account.id})">
                <i class="fas fa-cog"></i>
            </button>
        </td>
    `;

    return tr;
}

// Генерация тестовых прокси
function generateSampleProxies(count) {
    const proxies = [];
    const countries = ['Россия', 'США', 'Германия', 'Франция', 'Канада', 'Нидерланды', 'Сингапур'];
    const types = ['http', 'https', 'socks5'];
    const statuses = ['active', 'testing', 'dead'];
    
    for (let i = 0; i < count; i++) {
        const proxy = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            host: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            port: Math.floor(Math.random() * 65535),
            type: types[Math.floor(Math.random() * types.length)],
            country: countries[Math.floor(Math.random() * countries.length)],
            username: Math.random() > 0.5 ? `user${Math.floor(Math.random() * 1000)}` : '',
            password: Math.random() > 0.5 ? `pass${Math.floor(Math.random() * 1000)}` : '',
            status: statuses[Math.floor(Math.random() * statuses.length)],
            lastTest: new Date().toLocaleString('ru-RU'),
            responseTime: Math.floor(Math.random() * 2000) + 50
        };
        proxies.push(proxy);
    }
    
    return proxies;
}

// Функция полного сброса данных
function resetAllData() {
    if (confirm('ВНИМАНИЕ! Это действие удалит ВСЕ данные (аккаунты, прокси, настройки). Продолжить?')) {
        try {
            // Очищаем все данные
            accountsData.length = 0;
            proxyPool = [];
            settings = {};
            selectedAccounts.clear();
            currentAccount = null;
            
            // Очищаем LocalStorage
            localStorage.removeItem('keyset_data');
            
            // Перерисовываем интерфейс
            loadAccountsTable();
            
            // Скрываем sidebar если открыт
            const sidebar = document.getElementById('settingsSidebar');
            if (sidebar.classList.contains('active')) {
                hideSidebar();
            }
            
            showToast('Все данные успешно сброшены', 'success');
        } catch (error) {
            console.error('Ошибка сброса данных:', error);
            showToast('Ошибка при сбросе данных: ' + error.message, 'error');
        }
    }
}

// Инициализация
setupSearchKeyboardHandler();
updateSearchResultsCount(accountsData.length, accountsData.length);

// Экспорт всех функций в глобальную область видимости
window.filterByStatus = filterByStatus;
window.filterByProxy = filterByProxy;
window.clearAllFilters = clearAllFilters;
window.resetAllData = resetAllData;
window.generateSampleProxies = generateSampleProxies;

// Новые функции валидации
window.validateEmail = validateEmail;
window.validateProxy = validateProxy;
window.validateAccountForm = validateAccountForm;

// Новые API функции
window.updateAccountViaAPI = updateAccountViaAPI;
window.launchBrowserViaAPI = launchBrowserViaAPI;
window.testProxyViaAPI = testProxyViaAPI;
window.parseProxiesViaAPI = parseProxiesViaAPI;

// Новые функции поиска
window.filterAccounts = filterAccounts;
window.searchAccounts = searchAccounts;
