const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 8080;
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
    
    // Логирование
    console.log(`📥 ${new Date().toLocaleTimeString()} - ${req.method} ${pathname}`);
    
    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
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
        
        console.log(`✅ Served: ${filePath} (${data.length} bytes)`);
    });
}

server.listen(port, '127.0.0.1', () => {
    console.log(`🚀 SPA server running at http://127.0.0.1:${port}`);
    console.log(`✅ React Router support enabled`);
    console.log(`📋 Request logs:`);
    console.log('-'.repeat(50));
    
    // Автоматическое открытие браузера
    setTimeout(() => {
        const { exec } = require('child_process');
        console.log('🌐 Opening browser...');
        exec(`start http://127.0.0.1:${port}`);
        
        setTimeout(() => {
            exec(`start http://127.0.0.1:${port}/settings`);
        }, 2000);
        
        setTimeout(() => {
            exec(`start http://127.0.0.1:${port}/analytics`);
        }, 4000);
    }, 3000);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Server stopped');
    process.exit(0);
});