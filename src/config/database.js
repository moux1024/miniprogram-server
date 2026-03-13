const mysql = require('mysql2/promise');
require('dotenv').config();

// 启动时检查：避免未配置 DB 密码导致 ER_ACCESS_DENIED_NO_PASSWORD_ERROR
if (!process.env.DB_PASSWORD && process.env.DB_USER) {
  console.error(
    '[database] 警告: DB_PASSWORD 未设置，连接 MySQL 可能报 Access denied。请在 .env 中配置 DB_PASSWORD。'
  );
}

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 测试数据库连接
pool.getConnection()
  .then(connection => {
    console.log('数据库连接成功');
    connection.release();
  })
  .catch(error => {
    console.error('数据库连接失败:', error.message);
  });

module.exports = pool;
