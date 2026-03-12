const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

// 管理员登录
async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '缺少用户名或密码'
      });
    }

    // 查询管理员
    const [admins] = await pool.query(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, admins[0].password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      { id: admins[0].id, username: admins[0].username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admins[0].id,
        username: admins[0].username
      }
    });
  } catch (error) {
    console.error('管理员登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
}

// 创建功能
async function createFunction(req, res) {
  try {
    const { title, description, image_url, detail_images, sort_order, status } = req.body;

    if (!title || !image_url) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const [result] = await pool.query(
      'INSERT INTO functions (title, description, image_url, detail_images, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        title,
        description || '',
        image_url,
        JSON.stringify(detail_images || []),
        sort_order || 0,
        status !== undefined ? status : 1
      ]
    );

    const [functions] = await pool.query(
      'SELECT * FROM functions WHERE id = ?',
      [result.insertId]
    );

    res.json({
      success: true,
      data: functions[0]
    });
  } catch (error) {
    console.error('创建功能失败:', error);
    res.status(500).json({
      success: false,
      message: '创建功能失败'
    });
  }
}

// 更新功能
async function updateFunction(req, res) {
  try {
    const { id } = req.params;
    const { title, description, image_url, detail_images, sort_order, status } = req.body;

    // 检查功能是否存在
    const [functions] = await pool.query(
      'SELECT * FROM functions WHERE id = ?',
      [id]
    );

    if (functions.length === 0) {
      return res.status(404).json({
        success: false,
        message: '功能不存在'
      });
    }

    // 更新功能
    await pool.query(
      'UPDATE functions SET title = ?, description = ?, image_url = ?, detail_images = ?, sort_order = ?, status = ? WHERE id = ?',
      [
        title || functions[0].title,
        description !== undefined ? description : functions[0].description,
        image_url !== undefined ? image_url : functions[0].image_url,
        detail_images !== undefined ? JSON.stringify(detail_images) : functions[0].detail_images,
        sort_order !== undefined ? sort_order : functions[0].sort_order,
        status !== undefined ? status : functions[0].status,
        id
      ]
    );

    const [updatedFunctions] = await pool.query(
      'SELECT * FROM functions WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updatedFunctions[0]
    });
  } catch (error) {
    console.error('更新功能失败:', error);
    res.status(500).json({
      success: false,
      message: '更新功能失败'
    });
  }
}

// 删除功能
async function deleteFunction(req, res) {
  try {
    const { id } = req.params;

    // 检查功能是否存在
    const [functions] = await pool.query(
      'SELECT * FROM functions WHERE id = ?',
      [id]
    );

    if (functions.length === 0) {
      return res.status(404).json({
        success: false,
        message: '功能不存在'
      });
    }

    // 删除功能
    await pool.query('DELETE FROM functions WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除功能失败:', error);
    res.status(500).json({
      success: false,
      message: '删除功能失败'
    });
  }
}

// 获取所有功能（包括禁用的）
async function getAllFunctions(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM functions ORDER BY sort_order ASC, id DESC'
    );

    res.json({
      success: true,
      data: rows.map(row => ({
        ...row,
        detail_images: JSON.parse(row.detail_images || '[]')
      }))
    });
  } catch (error) {
    console.error('获取功能列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取功能列表失败'
    });
  }
}

// 获取订单列表
async function getOrders(req, res) {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT
        o.*,
        u.nickname,
        u.phone,
        u.email,
        f.title as function_title
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN functions f ON o.function_id = f.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const [rows] = await pool.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        list: rows.map(row => ({
          ...row,
          contact_info: JSON.parse(row.contact_info || '{}'),
          service_types: typeof row.service_types === 'string' ? JSON.parse(row.service_types || '[]') : (row.service_types || [])
        })),
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    });
  }
}

// 更新订单状态
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '缺少状态参数'
      });
    }

    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新订单状态失败'
    });
  }
}

// 获取配置
async function getConfig(req, res) {
  try {
    const [config] = await pool.query('SELECT * FROM config ORDER BY `key`');

    const configMap = {};
    config.forEach(item => {
      configMap[item.key] = {
        value: item.value,
        description: item.description
      };
    });

    res.json({
      success: true,
      data: configMap
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败'
    });
  }
}

// 更新配置
async function updateConfig(req, res) {
  try {
    const { configs } = req.body;

    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({
        success: false,
        message: '配置格式错误'
      });
    }

    // 批量更新配置
    for (const [key, value] of Object.entries(configs)) {
      await pool.query(
        'UPDATE config SET value = ? WHERE `key` = ?',
        [value, key]
      );
    }

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新配置失败'
    });
  }
}

module.exports = {
  adminLogin,
  createFunction,
  updateFunction,
  deleteFunction,
  getAllFunctions,
  getOrders,
  updateOrderStatus,
  getConfig,
  updateConfig
};
