# 服务器部署指南

本文档说明如何在 Linux 服务器上部署微信小程序商城后端（Node.js + MySQL），并使用 PM2 管理进程。

## 一、环境要求

- Node.js（建议 18+）
- MySQL 8.0 或 5.7
- 系统：Ubuntu / Debian 或 CentOS / RHEL

## 二、安装 MySQL

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### CentOS / RHEL

```bash
sudo yum install -y mysql-server   # 或 dnf install -y mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

可选：执行 `sudo mysql_secure_installation` 设置 root 密码、移除匿名用户等。

## 三、创建数据库与用户

登录 MySQL（按你实际认证方式）：

```bash
sudo mysql -u root -p
# 或: mysql -u root -p
```

在 MySQL 中执行（密码请替换为强密码）：

```sql
CREATE DATABASE IF NOT EXISTS wechat_mall DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wechat_mall'@'localhost' IDENTIFIED BY '你的强密码';
GRANT ALL PRIVILEGES ON wechat_mall.* TO 'wechat_mall'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 四、初始化表结构

在项目根目录（backend 目录）下执行：

```bash
mysql -u wechat_mall -p wechat_mall < database.sql
```

或使用 root 用户：

```bash
mysql -u root -p wechat_mall < database.sql
```

按提示输入对应用户的密码。

## 五、配置环境变量

复制示例配置并编辑：

```bash
cp .env.example .env
vim .env   # 或 nano .env
```

必须填写的数据库相关变量（与上面建库、建用户一致）：

| 变量名       | 说明     | 示例          |
| ------------ | -------- | ------------- |
| DB_HOST      | MySQL 地址 | localhost     |
| DB_PORT      | 端口     | 3306          |
| DB_USER      | 用户名   | wechat_mall   |
| DB_PASSWORD  | 密码     | 上一步设置的密码 |
| DB_DATABASE  | 数据库名 | wechat_mall   |

同时填写微信小程序（WECHAT_APPID、WECHAT_APPSECRET）和 JWT_SECRET（生产环境请使用随机长字符串）。邮件相关变量为可选。

## 六、安装依赖与 PM2

在项目根目录执行：

```bash
npm install
npm install -g pm2
```

## 七、使用 PM2 启动

为脚本添加执行权限并启动：

```bash
chmod +x scripts/pm2-*.sh
./scripts/pm2-start.sh
```

生产环境可指定环境：

```bash
./scripts/pm2-start.sh --env production
```

常用命令：

- 查看状态：`pm2 status`
- 查看日志：`pm2 logs wechat-mall-backend`
- 停止：`./scripts/pm2-stop.sh`
- 重启：`./scripts/pm2-restart.sh`

## 八、开机自启（可选）

```bash
pm2 save
pm2 startup
```

按终端提示执行生成的 `sudo env PATH=...` 命令，即可在服务器重启后自动拉起应用。

## 九、部署顺序小结

1. 安装 Node.js、MySQL
2. 创建数据库 `wechat_mall` 和用户，执行 `database.sql`
3. `cp .env.example .env`，填写 DB_*、WECHAT_*、JWT_SECRET 等
4. `npm install`、`npm install -g pm2`
5. `chmod +x scripts/pm2-*.sh`，执行 `./scripts/pm2-start.sh`
6. 需要开机自启时执行 `pm2 save` 与 `pm2 startup`
