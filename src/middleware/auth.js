const jwt = require('jsonwebtoken');
const config = require('../config');

// 管理员认证中间件
function adminAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    if (!decoded.username) {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error('认证失败:', error);
    res.status(401).json({
      success: false,
      message: '认证失败'
    });
  }
}

module.exports = {
  adminAuth
};
