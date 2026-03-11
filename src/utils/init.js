const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// 初始化管理员密码（加密）
async function initAdminPassword() {
  try {
    const [admins] = await pool.query(
      "SELECT * FROM admins WHERE username = 'admin'"
    );

    if (admins.length > 0) {
      const admin = admins[0];

      // 检查密码是否需要加密（如果密码是明文，说明是初始密码）
      if (!admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$')) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);

        await pool.query(
          "UPDATE admins SET password = ? WHERE username = 'admin'",
          [hashedPassword]
        );

        console.log('管理员密码已加密');
      }
    }
  } catch (error) {
    console.error('初始化管理员密码失败:', error);
  }
}

module.exports = {
  initAdminPassword
};
