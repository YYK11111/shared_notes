// 邮件服务工具

const nodemailer = require('nodemailer');
const { config } = require('dotenv');
const { serverErrorResponse, successResponse } = require('./responseFormatter');
const { formatError } = require('./responseFormatter');

config();

// 邮件配置
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASS || 'password'
  },
  from: process.env.EMAIL_FROM || '"个人笔记分享平台" <noreply@example.com>'
};

// 创建邮件传输器
let transporter = null;

// 初始化邮件传输器
const initTransporter = () => {
  try {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
      tls: {
        rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false'
      }
    });
    return true;
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
    return false;
  }
};

// 测试邮件连接
const testEmailConnection = async () => {
  try {
    if (!transporter) {
      initTransporter();
    }
    
    const info = await transporter.verify();
    console.log('Email server is ready to take our messages');
    return {
      success: true,
      message: '邮件服务器连接成功'
    };
  } catch (error) {
    console.error('Email server connection test failed:', error);
    return {
      success: false,
      message: `邮件服务器连接失败: ${formatError(error)}`
    };
  }
};

// 基础发送邮件函数
const sendEmail = async (mailOptions) => {
  try {
    if (!transporter) {
      initTransporter();
    }
    
    // 确保有发件人
    if (!mailOptions.from) {
      mailOptions.from = emailConfig.from;
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: formatError(error)
    };
  }
};

// 邮件模板管理器
const emailTemplates = {
  // 反馈回复邮件模板
  feedbackReply: (recipient, feedbackContent, replyContent, adminName) => {
    return {
      to: recipient,
      subject: '您的反馈已有回复 - 个人笔记分享平台',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>反馈回复通知</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: #fff; border: 1px solid #e9ecef; }
            .footer { padding: 20px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            .highlight { background-color: #f1f3f4; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>个人笔记分享平台</h2>
          </div>
          <div class="content">
            <h3>亲爱的用户，您好！</h3>
            <p>您之前提交的反馈已有回复，详情如下：</p>
            
            <div class="highlight">
              <strong>您的反馈：</strong><br>
              ${feedbackContent}
            </div>
            
            <div class="highlight">
              <strong>管理员回复：</strong><br>
              ${replyContent}
            </div>
            
            <p>感谢您对我们平台的支持和反馈！如有其他问题，请随时联系我们。</p>
            
            <p>此致<br> ${adminName}</p>
          </div>
          <div class="footer">
            <p>© 2023 个人笔记分享平台 版权所有</p>
            <p>请勿直接回复此邮件，这是一封自动发送的通知邮件。</p>
          </div>
        </body>
        </html>
      `,
      text: `亲爱的用户，您好！

您之前提交的反馈已有回复，详情如下：

您的反馈：
${feedbackContent}

管理员回复：
${replyContent}

感谢您对我们平台的支持和反馈！如有其他问题，请随时联系我们。

此致
${adminName}

© 2023 个人笔记分享平台 版权所有
请勿直接回复此邮件，这是一封自动发送的通知邮件。`
    };
  },
  
  // 管理员账户创建通知
  adminAccountCreated: (recipient, username, temporaryPassword) => {
    return {
      to: recipient,
      subject: '您的管理员账户已创建 - 个人笔记分享平台',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>管理员账户创建通知</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: #fff; border: 1px solid #e9ecef; }
            .footer { padding: 20px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            .highlight { background-color: #f1f3f4; padding: 15px; border-radius: 4px; margin: 15px 0; font-family: monospace; }
            .button { display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>个人笔记分享平台</h2>
          </div>
          <div class="content">
            <h3>尊敬的管理员，您好！</h3>
            <p>您的管理员账户已成功创建，账户信息如下：</p>
            
            <div class="highlight">
              <strong>用户名：</strong>${username}<br>
              <strong>临时密码：</strong>${temporaryPassword}
            </div>
            
            <p>为了您的账户安全，请在首次登录后立即修改密码。</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login" class="button">立即登录</a>
            
            <p>如果您没有申请此账户，请忽略此邮件或联系系统管理员。</p>
          </div>
          <div class="footer">
            <p>© 2023 个人笔记分享平台 版权所有</p>
            <p>请勿直接回复此邮件，这是一封自动发送的通知邮件。</p>
          </div>
        </body>
        </html>
      `,
      text: `尊敬的管理员，您好！

您的管理员账户已成功创建，账户信息如下：

用户名：${username}
临时密码：${temporaryPassword}

为了您的账户安全，请在首次登录后立即修改密码。

您可以通过以下链接登录：
${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login

如果您没有申请此账户，请忽略此邮件或联系系统管理员。

© 2023 个人笔记分享平台 版权所有
请勿直接回复此邮件，这是一封自动发送的通知邮件。`
    };
  },
  
  // 管理员密码重置通知
  adminPasswordReset: (recipient, username, temporaryPassword) => {
    return {
      to: recipient,
      subject: '您的管理员密码已重置 - 个人笔记分享平台',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>管理员密码重置通知</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: #fff; border: 1px solid #e9ecef; }
            .footer { padding: 20px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            .highlight { background-color: #f1f3f4; padding: 15px; border-radius: 4px; margin: 15px 0; font-family: monospace; }
            .button { display: inline-block; background-color: #ffc107; color: #212529; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>个人笔记分享平台</h2>
          </div>
          <div class="content">
            <h3>尊敬的管理员，您好！</h3>
            <p>您的管理员账户密码已被重置，新的临时密码如下：</p>
            
            <div class="highlight">
              <strong>用户名：</strong>${username}<br>
              <strong>临时密码：</strong>${temporaryPassword}
            </div>
            
            <p>为了您的账户安全，请在登录后立即修改密码。</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login" class="button">立即登录</a>
            
            <p><strong>注意：</strong>如果您没有申请重置密码，请立即联系系统管理员，您的账户可能存在安全风险。</p>
          </div>
          <div class="footer">
            <p>© 2023 个人笔记分享平台 版权所有</p>
            <p>请勿直接回复此邮件，这是一封自动发送的通知邮件。</p>
          </div>
        </body>
        </html>
      `,
      text: `尊敬的管理员，您好！

您的管理员账户密码已被重置，新的临时密码如下：

用户名：${username}
临时密码：${temporaryPassword}

为了您的账户安全，请在登录后立即修改密码。

您可以通过以下链接登录：
${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login

注意：如果您没有申请重置密码，请立即联系系统管理员，您的账户可能存在安全风险。

© 2023 个人笔记分享平台 版权所有
请勿直接回复此邮件，这是一封自动发送的通知邮件。`
    };
  },
  
  // 系统错误通知邮件
  systemErrorNotification: (errorDetails, adminEmail) => {
    return {
      to: adminEmail || process.env.ADMIN_EMAIL || 'admin@example.com',
      subject: '[紧急] 系统发生错误 - 个人笔记分享平台',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>系统错误通知</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8d7da; padding: 20px; border-radius: 8px 8px 0 0; border-left: 4px solid #721c24; }
            .content { padding: 20px; background-color: #fff; border: 1px solid #f5c6cb; }
            .footer { padding: 20px; background-color: #f8d7da; text-align: center; font-size: 12px; color: #721c24; border-radius: 0 0 8px 8px; }
            .error-details { background-color: #f1f3f4; padding: 15px; border-radius: 4px; margin: 15px 0; font-family: monospace; white-space: pre-wrap; }
            .timestamp { font-style: italic; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="color: #721c24;">系统错误通知</h2>
          </div>
          <div class="content">
            <p>系统检测到一个错误，详情如下：</p>
            
            <div class="error-details">
              ${errorDetails}
            </div>
            
            <p class="timestamp">时间：${new Date().toLocaleString('zh-CN')}</p>
            
            <p><strong>请尽快处理此问题以确保系统正常运行！</strong></p>
          </div>
          <div class="footer">
            <p>© 2023 个人笔记分享平台 技术支持</p>
          </div>
        </body>
        </html>
      `,
      text: `系统错误通知

系统检测到一个错误，详情如下：

${errorDetails}

时间：${new Date().toLocaleString('zh-CN')}

请尽快处理此问题以确保系统正常运行！

© 2023 个人笔记分享平台 技术支持`
    };
  },
  
  // 自定义邮件模板
  customEmail: (to, subject, htmlContent, textContent) => {
    return {
      to,
      subject,
      html: htmlContent,
      text: textContent
    };
  }
};

// 发送反馈回复邮件
const sendFeedbackReplyEmail = async (recipient, feedbackContent, replyContent, adminName) => {
  try {
    const mailOptions = emailTemplates.feedbackReply(recipient, feedbackContent, replyContent, adminName);
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending feedback reply email:', error);
    return {
      success: false,
      error: formatError(error)
    };
  }
};

// 发送管理员账户创建通知
const sendAdminAccountCreatedEmail = async (recipient, username, temporaryPassword) => {
  try {
    const mailOptions = emailTemplates.adminAccountCreated(recipient, username, temporaryPassword);
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending admin account created email:', error);
    return {
      success: false,
      error: formatError(error)
    };
  }
};

// 发送管理员密码重置通知
const sendAdminPasswordResetEmail = async (recipient, username, temporaryPassword) => {
  try {
    const mailOptions = emailTemplates.adminPasswordReset(recipient, username, temporaryPassword);
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending admin password reset email:', error);
    return {
      success: false,
      error: formatError(error)
    };
  }
};

// 发送系统错误通知
const sendSystemErrorNotification = async (errorDetails, adminEmail) => {
  try {
    const mailOptions = emailTemplates.systemErrorNotification(errorDetails, adminEmail);
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending system error notification:', error);
    return {
      success: false,
      error: formatError(error)
    };
  }
};

// 发送自定义邮件
const sendCustomEmail = async (to, subject, htmlContent, textContent) => {
  try {
    const mailOptions = emailTemplates.customEmail(to, subject, htmlContent, textContent);
    return await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending custom email:', error);
    return {
      success: false,
      error: formatError(error)
    };
  }
};

// 检查邮件配置是否完整
const isEmailConfigComplete = () => {
  return emailConfig.host && 
         emailConfig.port && 
         emailConfig.auth && 
         emailConfig.auth.user && 
         emailConfig.auth.pass && 
         emailConfig.from;
};

// 获取邮件配置信息（不包含敏感信息）
const getEmailConfigInfo = () => {
  return {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    from: emailConfig.from,
    hasAuth: !!emailConfig.auth.user && !!emailConfig.auth.pass
  };
};

// 导出邮件服务函数
module.exports = {
  initTransporter,
  testEmailConnection,
  sendEmail,
  emailTemplates,
  sendFeedbackReplyEmail,
  sendAdminAccountCreatedEmail,
  sendAdminPasswordResetEmail,
  sendSystemErrorNotification,
  sendCustomEmail,
  isEmailConfigComplete,
  getEmailConfigInfo
};