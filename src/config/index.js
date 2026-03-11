module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  wechat: {
    appId: process.env.WECHAT_APPID,
    appSecret: process.env.WECHAT_APPSECRET
  },

  email: {
    smtp: {
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT) || 587,
      user: process.env.EMAIL_SMTP_USER,
      password: process.env.EMAIL_SMTP_PASSWORD
    },
    from: process.env.EMAIL_FROM
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_key',
    expiresIn: '7d'
  }
};
