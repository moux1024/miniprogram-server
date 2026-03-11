const axios = require('axios');
const config = require('../config');

// 微信登录code换取session
async function code2session(req, res) {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少code参数'
      });
    }

    // 调用微信接口
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: config.wechat.appId,
        secret: config.wechat.appSecret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { openid, session_key, errcode, errmsg } = response.data;

    if (errcode) {
      return res.status(400).json({
        success: false,
        message: errmsg || '微信登录失败'
      });
    }

    res.json({
      success: true,
      openid: openid,
      session_key: session_key
    });
  } catch (error) {
    console.error('微信登录失败:', error);
    res.status(500).json({
      success: false,
      message: '微信登录失败'
    });
  }
}

module.exports = {
  code2session
};
