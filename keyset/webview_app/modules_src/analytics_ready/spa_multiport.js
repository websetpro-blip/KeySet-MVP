const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Порт из аргументов командной строки или 8080 по умолчанию
const port = process.argv.includes('--port') 
    ? parseInt(process.argv[process.argv.indexOf('--port') + 1]) 
    : 8080;

const publicDir = __dirname;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Логирование с указанием порта
    console.log(`📥 [${port}] ${new Date().toLocaleTimeString()} - ${req.method} ${pathname}`);
    
    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    // Специальная обработка /callback для OAuth
    if (pathname === '/callback') {
        console.log(`🔐 OAuth callback received on port ${port}`);
        console.log(`   Query params: ${parsedUrl.search || 'none'}`);
    }
    
    // Статические файлы (содержат точку или начинаются с /assets/)
    if (pathname.includes('.') || pathname.startsWith('/assets/')) {
        serveStaticFile(pathname, res);
    } else {
        // SPA роутинг - все неизвестные пути -> index.html
        console.log(`🔄 SPA route: ${pathname} -> index.html`);
        serveStaticFile('/index.html', res);
    }
});

function serveStaticFile(pathname, res) {
    const filePath = path.join(publicDir, pathname === '/' ? 'index.html' : pathname);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log(`❌ File not found: ${filePath}`);
            res.writeHead(404);
            res.end('File not found');
            return;
        }
        
        const ext = path.extname(filePath);
        const mimeType = mimeTypes[ext] || 'text/plain';
        
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
        
        console.log(`✅ Served: ${path.basename(filePath)} (${data.length} bytes)`);
    });
}

server.listen(port, '127.0.0.1', () => {
    console.log(`🚀 SPA сервер запущен на http://127.0.0.1:${port}`);
    console.log(`🔐 OAuth Callback URL: http://127.0.0.1:${port}/callback`);
    console.log(`✅ React Router поддержка активна`);
    console.log(`📋 Логи запросов:`);
    console.log('-'.repeat(60));
    
    // Автоматическое открытие браузера
    setTimeout(() => {
        const { exec } = require('child_process');
        console.log('🌐 Открытие браузера...');
        exec(`start http://127.0.0.1:${port}`);
        
        setTimeout(() => {
            exec(`start http://127.0.0.1:${port}/settings`);
        }, 2000);
    }, 3000);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(`\n🛑 Сервер на порту ${port} остановлен`);
    process.exit(0);
});

// Показываем доступные порты
console.log(`💡 Доступные команды:`);
console.log(`   node spa_server.js --port 5173  (для OAuth с localhost:5173/callback)`);
console.log(`   node spa_server.js --port 8000  (для OAuth с localhost:8000/callback)`);
console.log(`   node spa_server.js --port 8080  (текущий порт)`);
console.log(``);