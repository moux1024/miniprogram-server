const pool = require('../config/database');
const { sendOrderNotification } = require('../utils/email');

// 创建订单
async function createOrder(req, res) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { openid, functionId, userInfo, contactInfo } = req.body;

    if (!openid || !functionId || !contactInfo) {
      throw new Error('缺少必要参数');
    }

    // 验证功能是否存在
    const [functions] = await connection.query(
      'SELECT * FROM functions WHERE id = ?',
      [functionId]
    );

    if (functions.length === 0) {
      throw new Error('功能不存在');
    }

    // 创建或获取用户
    let userId;
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE wechat_openid = ?',
      [openid]
    );

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;

      // 更新用户联系方式
      await connection.query(
        'UPDATE users SET nickname = ?, avatar_url = ?, phone = ?, email = ? WHERE id = ?',
        [
          userInfo?.nickName,
          userInfo?.avatarUrl,
          contactInfo.phone,
          contactInfo.email,
          userId
        ]
      );
    } else {
      // 创建新用户
      const [result] = await connection.query(
        'INSERT INTO users (wechat_openid, nickname, avatar_url, phone, email) VALUES (?, ?, ?, ?, ?)',
        [
          openid,
          userInfo?.nickName,
          userInfo?.avatarUrl,
          contactInfo.phone,
          contactInfo.email
        ]
      );

      userId = result.insertId;
    }

    // 创建订单
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, function_id, contact_info, status) VALUES (?, ?, ?, ?)',
      [
        userId,
        functionId,
        JSON.stringify({
          ...contactInfo,
          userName: contactInfo.name,
          userRemark: contactInfo.remark
        }),
        'pending'
      ]
    );

    await connection.commit();

    // 发送邮件通知（异步，不影响主流程）
    sendOrderNotification({
      user: {
        id: userId,
        nickname: userInfo?.nickName || contactInfo.name,
        phone: contactInfo.phone,
        email: contactInfo.email
      },
      function: functions[0],
      order: {
        id: orderResult.insertId,
        contactInfo: contactInfo
      }
    }).catch(err => {
      console.error('发送邮件通知失败:', err);
    });

    res.json({
      success: true,
      data: {
        orderId: orderResult.insertId
      }
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

module.exports = {
  createOrder
};
