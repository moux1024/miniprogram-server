-- 订单表增加 service_types，function_id 改为可选（兼容旧数据）
-- 执行前请确认数据库为 wechat_mall
USE wechat_mall;

-- 删除 function_id 外键（MySQL 自动生成的名称多为 orders_ibfk_2）
ALTER TABLE orders DROP FOREIGN KEY orders_ibfk_2;

-- 新增 service_types 列
ALTER TABLE orders ADD COLUMN service_types JSON COMMENT '服务类型数组，如 ["zichan","ai"]' AFTER user_id;

-- 将 function_id 改为可空
ALTER TABLE orders MODIFY COLUMN function_id INT NULL COMMENT '功能ID(可选，兼容旧数据)';
