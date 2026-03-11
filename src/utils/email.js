const nodemailer = require('nodemailer');
const pool = require('../config/database');

// 获取邮件配置
async function getEmailConfig() {
  const [config] = await pool.query(
    "SELECT `key`, value FROM config WHERE `key` LIKE 'email_%'"
  );

  const configMap = {};
  config.forEach(item => {
    configMap[item.key] = item.value;
  });

  return {
    smtp: {
      host: configMap.email_smtp_host || process.env.EMAIL_SMTP_HOST,
      port: parseInt(configMap.email_smtp_port) || parseInt(process.env.EMAIL_SMTP_PORT) || 587,
      user: configMap.email_smtp_user || process.env.EMAIL_SMTP_USER,
      password: configMap.email_smtp_password || process.env.EMAIL_SMTP_PASSWORD
    },
    from: configMap.email_from || process.env.EMAIL_FROM,
    notificationEmails: (await getNotificationEmails()).split(',').map(e => e.trim())
  };
}

// 获取通知邮箱列表
async function getNotificationEmails() {
  const [config] = await pool.query(
    "SELECT value FROM config WHERE `key` = 'notification_emails'"
  );

  return config.length > 0 ? config[0].value : process.env.EMAIL_FROM || 'admin@example.com';
}

// 发送邮件通知
async function sendOrderNotification({ user, function: func, order }) {
  try {
    const emailConfig = await getEmailConfig();

    // 创建邮件传输器
    const transporter = nodemailer.createTransporter({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.port === 465,
      auth: {
        user: emailConfig.smtp.user,
        pass: emailConfig.smtp.password
      }
    });

    // 邮件内容
    const mailOptions = {
      from: `"微信小程序" <${emailConfig.from}>`,
      to: emailConfig.notificationEmails,
      subject: `新订单通知 - ${func.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1890ff; border-bottom: 2px solid #1890ff; padding-bottom: 10px;">新订单通知</h2>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">订单信息</h3>
            <p><strong>订单ID:</strong> #${order.id}</p>
            <p><strong>咨询功能:</strong> ${func.title}</p>
            <p><strong>下单时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3>用户信息</h3>
            <p><strong>姓名:</strong> ${order.contactInfo.name}</p>
            <p><strong>昵称:</strong> ${user.nickname || '未授权'}</p>
            <p><strong>手机号:</strong> ${order.contactInfo.phone}</p>
            <p><strong>邮箱:</strong> ${order.contactInfo.email || '未填写'}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3>备注信息</h3>
            <p style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
              ${order.contactInfo.remark || '无'}
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999;">
            <p>此邮件由系统自动发送，请勿回复</p>
          </div>
        </div>
      `
    };

    // 发送邮件
    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', info.messageId);

    return true;
  } catch (error) {
    console.error('发送邮件失败:', error);
    return false;
  }
}

module.exports = {
  sendOrderNotification,
  getEmailConfig
};
