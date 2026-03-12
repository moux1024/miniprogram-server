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

// 服务类型中文名映射
const SERVICE_NAMES = { zichan: '资产管理', ai: 'AI 服云', rongzi: '融资服务', zixun: '企业咨询' };

// 发送邮件通知（支持山高服务多选服务 + 需求信息，或旧版单功能）
async function sendOrderNotification({ user, function: func, order, serviceTypes }) {
  try {
    const emailConfig = await getEmailConfig();

    const transporter = nodemailer.createTransporter({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.port === 465,
      auth: {
        user: emailConfig.smtp.user,
        pass: emailConfig.smtp.password
      }
    });

    const contact = order.contactInfo || {};
    const title = serviceTypes && serviceTypes.length
      ? serviceTypes.map(k => SERVICE_NAMES[k] || k).join('、')
      : (func && func.title) || '新需求';

    const mailOptions = {
      from: `"微信小程序" <${emailConfig.from}>`,
      to: emailConfig.notificationEmails,
      subject: `新订单通知 - ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #004ea2; border-bottom: 2px solid #004ea2; padding-bottom: 10px;">新订单通知</h2>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">订单信息</h3>
            <p><strong>订单ID:</strong> #${order.id}</p>
            <p><strong>服务类型:</strong> ${title}</p>
            <p><strong>下单时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3>用户信息</h3>
            <p><strong>姓名:</strong> ${contact.userName || contact.name || '未填写'}</p>
            <p><strong>昵称:</strong> ${user.nickname || '未授权'}</p>
            <p><strong>手机号:</strong> ${contact.userPhone || contact.phone || '未填写'}</p>
            <p><strong>公司:</strong> ${contact.userCompany || '未填写'}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3>需求描述</h3>
            <p style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
              ${contact.userNeed || contact.remark || '无'}
            </p>
            ${contact.expectTime ? `<p><strong>期望服务时间:</strong> ${contact.expectTime}</p>` : ''}
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
