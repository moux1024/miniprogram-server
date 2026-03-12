const pool = require('../config/database');
const { sendOrderNotification } = require('../utils/email');

const SERVICE_NAMES = { zichan: '资产管理', ai: 'AI 服云', rongzi: '融资服务', zixun: '企业咨询' };

// 创建订单（山高服务：多服务类型 + 需求信息）
async function createOrder(req, res) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      openid,
      userInfo,
      selectedServices,
      userName,
      userPhone,
      userCompany,
      userNeed,
      expectTime
    } = req.body;

    if (!openid || !selectedServices || !Array.isArray(selectedServices) || selectedServices.length === 0) {
      throw new Error('缺少必要参数：openid、selectedServices');
    }
    if (!userName || !userPhone || !userNeed) {
      throw new Error('请填写姓名、联系电话和需求描述');
    }
    if (!/^1[3-9]\d{9}$/.test(userPhone)) {
      throw new Error('请输入正确的手机号码');
    }

    let userId;
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE wechat_openid = ?',
      [openid]
    );

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      await connection.query(
        'UPDATE users SET nickname = ?, avatar_url = ?, phone = ? WHERE id = ?',
        [
          userInfo?.nickName || userName,
          userInfo?.avatarUrl,
          userPhone,
          userId
        ]
      );
    } else {
      const [result] = await connection.query(
        'INSERT INTO users (wechat_openid, nickname, avatar_url, phone) VALUES (?, ?, ?, ?)',
        [
          openid,
          userInfo?.nickName || userName,
          userInfo?.avatarUrl,
          userPhone
        ]
      );
      userId = result.insertId;
    }

    const contactInfo = {
      userName,
      userPhone,
      userCompany: userCompany || '',
      userNeed,
      expectTime: expectTime || ''
    };

    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, service_types, contact_info, status) VALUES (?, ?, ?, ?)',
      [
        userId,
        JSON.stringify(selectedServices),
        JSON.stringify(contactInfo),
        'pending'
      ]
    );

    await connection.commit();

    const orderId = orderResult.insertId;
    sendOrderNotification({
      user: {
        id: userId,
        nickname: userInfo?.nickName || userName,
        phone: userPhone
      },
      order: {
        id: orderId,
        contactInfo
      },
      serviceTypes: selectedServices
    }).catch(err => {
      console.error('发送邮件通知失败:', err);
    });

    res.json({
      success: true,
      data: { orderId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('创建订单失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '创建订单失败'
    });
  } finally {
    connection.release();
  }
}

// 获取当前用户订单列表（按 openid）
async function getMyOrders(req, res) {
  try {
    const { openid } = req.query;
    if (!openid) {
      return res.status(400).json({
        success: false,
        message: '缺少 openid'
      });
    }

    const [users] = await pool.query(
      'SELECT id FROM users WHERE wechat_openid = ?',
      [openid]
    );
    if (users.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const userId = users[0].id;
    const [rows] = await pool.query(
      'SELECT id, service_types, contact_info, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const list = rows.map(row => ({
      id: row.id,
      service_types: typeof row.service_types === 'string' ? JSON.parse(row.service_types || '[]') : (row.service_types || []),
      contact_info: typeof row.contact_info === 'string' ? JSON.parse(row.contact_info || '{}') : (row.contact_info || {}),
      status: row.status,
      created_at: row.created_at
    }));

    res.json({
      success: true,
      data: list
    });
  } catch (error) {
    console.error('获取我的订单失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单失败'
    });
  }
}

module.exports = {
  createOrder,
  getMyOrders
};
