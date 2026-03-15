const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
require('dotenv').config();

const config = require('./config');
const { initAdminPassword } = require('./utils/init');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// API路由
app.use('/api', require('./routes'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 启动服务器
const PORT = config.port;
const SSL_CERT_DIR = process.env.SSL_CERT_DIR || '/etc/cloudflare';
const SSL_CERT = process.env.SSL_CERT || path.join(SSL_CERT_DIR, 'cert.pem');
const SSL_KEY = process.env.SSL_KEY || path.join(SSL_CERT_DIR, 'key.pem');

// 初始化管理员密码
initAdminPassword();

function createServer() {
  try {
    const cert = fs.readFileSync(SSL_CERT);
    const key = fs.readFileSync(SSL_KEY);
    const httpsOptions = { cert, key };
    return https.createServer(httpsOptions, app);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn('未找到 HTTPS 证书，使用 HTTP。证书路径:', SSL_CERT, SSL_KEY);
      return http.createServer(app);
    }
    throw err;
  }
}

const server = createServer();
server.listen(PORT, () => {
  const protocol = server instanceof https.Server ? 'https' : 'http';
  console.log(`服务器运行在 ${protocol}://localhost:${PORT}`);
  console.log(`环境: ${config.nodeEnv}`);
});
