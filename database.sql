-- 创建数据库
CREATE DATABASE IF NOT EXISTS wechat_mall DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wechat_mall;

-- 功能展示表
CREATE TABLE IF NOT EXISTS functions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL COMMENT '功能标题',
  description TEXT COMMENT '功能描述',
  image_url VARCHAR(500) NOT NULL COMMENT '封面图片URL',
  detail_images JSON COMMENT '详情图片，JSON数组',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='功能展示表';

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wechat_openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信OpenID',
  nickname VARCHAR(100) COMMENT '昵称',
  avatar_url VARCHAR(500) COMMENT '头像URL',
  phone VARCHAR(20) COMMENT '联系电话',
  email VARCHAR(100) COMMENT '邮箱',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_openid (wechat_openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 订单/咨询记录表（山高服务：多服务类型 + 需求信息）
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  service_types JSON COMMENT '服务类型数组，如 ["zichan","ai"]',
  function_id INT NULL COMMENT '功能ID(可选，兼容旧数据)',
  contact_info JSON COMMENT '需求与联系方式，含 userName, userPhone, userCompany, userNeed, expectTime 等',
  status ENUM('pending', 'processed', 'completed') DEFAULT 'pending' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_function_id (function_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单/咨询记录表';

-- 配置表
CREATE TABLE IF NOT EXISTS config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
  `value` TEXT COMMENT '配置值',
  description VARCHAR(200) COMMENT '配置说明',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配置表';

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 插入默认管理员账号（密码：admin123，将在首次运行时通过bcrypt加密）
-- 注意：请在首次运行后修改默认密码
INSERT INTO admins (username, password) VALUES
('admin', 'admin123_temp')
ON DUPLICATE KEY UPDATE username=username;

-- 插入默认配置
INSERT INTO config (`key`, `value`, description) VALUES
('notification_emails', 'admin@example.com', '通知邮箱列表，多个邮箱用逗号分隔'),
('email_smtp_host', 'smtp.qq.com', 'SMTP服务器地址'),
('email_smtp_port', '587', 'SMTP服务器端口'),
('email_smtp_user', '', 'SMTP用户名'),
('email_smtp_password', '', 'SMTP密码'),
('email_from', '', '发件人邮箱')
ON DUPLICATE KEY UPDATE `key`=`key`;

-- 插入示例功能数据
INSERT INTO functions (title, description, image_url, detail_images, sort_order) VALUES
('智能办公系统', '基于AI的智能办公解决方案，提高工作效率', '/uploads/placeholder1.jpg', '["/uploads/placeholder1-1.jpg", "/uploads/placeholder1-2.jpg"]', 1),
('数据分析平台', '专业的数据分析和可视化平台', '/uploads/placeholder2.jpg', '["/uploads/placeholder2-1.jpg", "/uploads/placeholder2-2.jpg"]', 2),
('移动端应用', '跨平台移动应用开发服务', '/uploads/placeholder3.jpg', '["/uploads/placeholder3-1.jpg", "/uploads/placeholder3-2.jpg"]', 3)
ON DUPLICATE KEY UPDATE title=title;
