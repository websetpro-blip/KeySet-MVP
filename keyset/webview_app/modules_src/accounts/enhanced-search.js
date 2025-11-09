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

// Функции быстрых фильтров
function filterByStatus(status) {
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.value = status;
        // Вызываем существующую функцию фильтрации
        if (typeof filterAndDisplayAccounts === 'function') {
            filterAndDisplayAccounts();
        }
        // Показываем уведомление если функция showToast доступна
        if (typeof showToast === 'function') {
            const statusText = getStatusText ? getStatusText(status) : status;
            showToast(`Фильтр: ${statusText}`, 'info');
        }
    }
}

function filterByProxy() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = 'proxy';
        if (typeof filterAndDisplayAccounts === 'function') {
            filterAndDisplayAccounts();
        }
        if (typeof showToast === 'function') {
            showToast('Фильтр: аккаунты с прокси', 'info');
        }
    }
}

function clearAllFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    
    if (typeof filterAndDisplayAccounts === 'function') {
        filterAndDisplayAccounts();
    }
    
    if (typeof showToast === 'function') {
        showToast('Фильтры очищены', 'info');
    }
}

// Настройка обработчика клавиатуры для поиска
function setupSearchKeyboardHandler() {
    // Обработка поиска по клавише Enter
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.id === 'searchInput') {
            e.preventDefault();
            if (typeof filterAndDisplayAccounts === 'function') {
                filterAndDisplayAccounts();
                if (typeof showToast === 'function') {
                    showToast('Поиск выполнен', 'info');
                }
            }
        }
    });
}

// Переопределяем функцию фильтрации для улучшенного поиска
function enhanceSearch() {
    // Ждем загрузки основного скрипта
    if (typeof filterAndDisplayAccounts !== 'function') {
        setTimeout(enhanceSearch, 100);
        return;
    }
    
    // Переопределяем filterAndDisplayAccounts
    window.originalFilterFunction = filterAndDisplayAccounts;
    
    window.filterAndDisplayAccounts = function() {
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
        
        // Обновляем количество найденных
        updateSearchResultsCount(filteredAccounts.length, accountsData.length);
        
        const tbody = document.getElementById('accountsTableBody');
        tbody.innerHTML = '';
        
        filteredAccounts.forEach(account => {
            const row = createAccountRowEnhanced(account);
            tbody.appendChild(row);
        });
        
        updateSelectAllState();
    };
    
    // Переопределяем createAccountRow для подсветки
    if (typeof createAccountRow === 'function') {
        window.originalCreateAccountRow = createAccountRow;
        
        window.createAccountRowEnhanced = function(account) {
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
        };
    }
    
    // Инициализируем обработчик клавиатуры
    setupSearchKeyboardHandler();
    
    console.log('Enhanced search initialized');
}

// Автозапуск улучшенного поиска
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceSearch);
} else {
    enhanceSearch();
}
