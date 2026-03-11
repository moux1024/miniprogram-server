const pool = require('../config/database');

// 创建或获取用户
async function createOrUpdateUser(req, res) {
  try {
    const { openid, userInfo } = req.body;

    if (!openid) {
      return res.status(400).json({
        success: false,
        message: '缺少openid'
      });
    }

    // 检查用户是否已存在
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE wechat_openid = ?',
      [openid]
    );

    let user;

    if (existingUsers.length > 0) {
      // 更新用户信息
      await pool.query(
        'UPDATE users SET nickname = ?, avatar_url = ? WHERE id = ?',
        [userInfo?.nickName, userInfo?.avatarUrl, existingUsers[0].id]
      );

      user = existingUsers[0];
    } else {
      // 创建新用户
      const [result] = await pool.query(
        'INSERT INTO users (wechat_openid, nickname, avatar_url) VALUES (?, ?, ?)',
        [openid, userInfo?.nickName, userInfo?.avatarUrl]
      );

      const [newUsers] = await pool.query(
        'SELECT * FROM users WHERE id = ?',
        [result.insertId]
      );

      user = newUsers[0];
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败'
    });
  }
}

module.exports = {
  createOrUpdateUser
};
