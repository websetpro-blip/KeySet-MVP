# 🎨 Краткий справочник стилей CARDVANCE

## 🎯 Основная цветовая палитра
```css
/* Базовые цвета */
--pure-white: #FFFFFF
--off-white: #FAFAFA  
--soft-gray: #F8F9FA
--light-gray: #E5E7EB
--medium-gray: #9CA3AF
--dark-gray: #374151
--charcoal: #1F2937

/* Акценты */
--accent-blue: #3B82F6
--accent-blue-light: #EFF6FF
--accent-blue-hover: #2563EB

/* Тени */
--subtle-shadow: 0 1px 3px rgba(0, 0, 0, 0.08)
--medium-shadow: 0 4px 6px rgba(0, 0, 0, 0.07)
```

## 📝 Типографика
```css
/* Шрифт */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif
line-height: 1.5

/* Размеры */
.logo-text: 28px / weight: 700
h3: 18px / weight: 600
th: 13px / weight: 600 / uppercase
body: 14px / weight: 400
small: 12px
```

## 📐 Отступы и размеры
```css
/* Контейнеры */
top-bar: padding: 16px 24px / min-height: 72px
table-container: padding: 24px
card: padding: 24px
sidebar-header: padding: 20px 24px

/* Элементы */
btn: padding: 10px 20px / min-width: 100px
action-btn: padding: 8px 16px
form-input: padding: 12px 16px
theme-btn: min-width: 80px / padding: 8px 16px
```

## 🔄 Анимации
```css
/* Переходы */
--transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1)
--transition-medium: 0.3s cubic-bezier(0.4, 0, 0.2, 1)

/* Hover эффекты */
hover: transform: translateY(-1px)
hover: box-shadow: var(--medium-shadow)
```

## 🏷️ Статусы
```css
status-active: background: #D1FAE5 / color: #065F46
status-error: background: #FEE2E2 / color: #991B1B
status-working: background: #DBEAFE / color: #1E40AF
status-needs-login: background: #FEF3C7 / color: #92400E
```

## 🎪 Скругления
```css
card: border-radius: 12px
btn: border-radius: 8px
action-btn: border-radius: 6px
form-input: border-radius: 8px
theme-switcher: border-radius: 12px
```

## 📱 Адаптивность
```css
@media (max-width: 768px) {
    sidebar: width: 100% / height: 50vh
    top-bar: padding: 12px 16px
    logo-text: font-size: 24px
}
```

## ⚡ Ключевые CSS классы
```css
.app-container       /* Основной контейнер */
.top-bar            /* Верхняя панель */
.main-content       /* Основной контент */
.table-container    /* Контейнер таблицы */
.table-wrapper      /* Обертка таблицы */
.card              /* Карточка */
.btn               /* Кнопка */
.action-btn        /* Кнопка действия */
.stat-card         /* Статистическая карточка */
.info-block        /* Информационный блок */
.sidebar           /* Боковая панель */
```

## 🔗 Иконки
- Font Awesome 6.0.0
- Основные: fa-plus, fa-edit, fa-trash, fa-sync-alt, fa-play, fa-cogs
- UI: fa-search, fa-globe

## 📊 URL удачного дизайна
**https://hcfymgjsofg7.space.minimax.io/**

Этот дизайн - эталон минималистичного премиального интерфейса с идеальным балансом эстетики и функциональности.
