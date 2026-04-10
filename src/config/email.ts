import nodemailer from "nodemailer";
import { db } from "../db";
import { emailLogs } from "../db/schema";
import { eq } from "drizzle-orm";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

transporter.verify((error, success) => {
    if(error){
        console.error('Email service not ready:', error);
    } else {
        console.log('Email service is ready to send messages');
    }
});

export const emailTemplates = {
    taskAssigned: (taskTitle: string, projectName: string, taskUrl: string) => ({
        subject: `📋 New Task Assigned: ${taskTitle}`,
         html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #002d74; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .task-box { background: white; padding: 15px; border-left: 4px solid #002d74; margin: 15px 0; }
          .button { display: inline-block; background: #002d74; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📋 New Task Assigned</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have been assigned a new task in project <strong>${projectName}</strong>:</p>
            <div class="task-box">
              <strong>${taskTitle}</strong>
            </div>
            <p style="text-align: center;">
              <a href="${taskUrl}" class="button">View Task Details</a>
            </p>
          </div>
          <div class="footer">
            <p>Project Management System | This is an automated notification</p>
          </div>
        </div>
      </body>
      </html>
    `,
    }),

      taskStatusChanged: (taskTitle: string, oldStatus: string, newStatus: string, taskUrl: string) => ({
    subject: `🔄 Task Status Updated: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #002d74; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status-box { background: white; padding: 15px; text-align: center; margin: 15px 0; }
          .old-status { color: #e67e22; text-decoration: line-through; }
          .new-status { color: #27ae60; font-weight: bold; font-size: 18px; }
          .button { display: inline-block; background: #002d74; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔄 Task Status Updated</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Task <strong>${taskTitle}</strong> status has been changed:</p>
            <div class="status-box">
              <span class="old-status">${oldStatus}</span> → <span class="new-status">${newStatus}</span>
            </div>
            <p style="text-align: center;">
              <a href="${taskUrl}" class="button">View Task</a>
            </p>
          </div>
          <div class="footer">
            <p>Project Management System</p>
          </div>
        </div>
      </body>
      </html>
    `,
    }),

     projectInvite: (projectName: string, role: string, projectUrl: string, invitedBy: string) => ({
    subject: `🏢 Project Invitation: ${projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #002d74; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .invite-box { background: white; padding: 15px; text-align: center; margin: 15px 0; }
          .role-badge { background: #e8f4f8; color: #002d74; padding: 5px 10px; border-radius: 5px; display: inline-block; }
          .button { display: inline-block; background: #002d74; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🏢 Project Invitation</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><strong>${invitedBy}</strong> has invited you to join project <strong>${projectName}</strong>.</p>
            <div class="invite-box">
              <p>Your role: <span class="role-badge">${role}</span></p>
            </div>
            <p style="text-align: center;">
              <a href="${projectUrl}" class="button">View Project</a>
            </p>
          </div>
          <div class="footer">
            <p>Project Management System</p>
          </div>
        </div>
      </body>
      </html>
    `,
    }),

    newMessage: (threadTopic: string, messageContent: string, threadUrl: string, senderName: string) => ({
    subject: `💬 New Message: ${threadTopic}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #002d74; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .message-box { background: white; padding: 15px; margin: 15px 0; border-radius: 10px; }
          .sender { color: #002d74; font-weight: bold; }
          .message-text { color: #555; margin-top: 10px; }
          .button { display: inline-block; background: #002d74; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>💬 New Message</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><span class="sender">${senderName}</span> posted in thread <strong>${threadTopic}</strong>:</p>
            <div class="message-box">
              <p class="message-text">${messageContent.substring(0, 300)}${messageContent.length > 300 ? '...' : ''}</p>
            </div>
            <p style="text-align: center;">
              <a href="${threadUrl}" class="button">View Thread</a>
            </p>
          </div>
          <div class="footer">
            <p>Project Management System</p>
          </div>
        </div>
      </body>
      </html>
    `,
    }),

     taskDueReminder: (taskTitle: string, dueDate: string, projectName: string, taskUrl: string) => ({
    subject: `⏰ Task Due Tomorrow: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e67e22; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .warning-box { background: #fff3e0; padding: 15px; border-left: 4px solid #e67e22; margin: 15px 0; }
          .due-date { color: #e67e22; font-weight: bold; }
          .button { display: inline-block; background: #e67e22; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⏰ Task Due Reminder</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>This is a reminder that the following task is due tomorrow:</p>
            <div class="warning-box">
              <strong>${taskTitle}</strong><br/>
              <small>Project: ${projectName}</small><br/>
              <small>Due date: <span class="due-date">${dueDate}</span></small>
            </div>
            <p style="text-align: center;">
              <a href="${taskUrl}" class="button">View Task</a>
            </p>
          </div>
          <div class="footer">
            <p>Project Management System</p>
          </div>
        </div>
      </body>
      </html>
    `,
    }),
}

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"PMS System" <noreply@pms.com>',
            to: to,
            subject: subject,
            html: html,
        });

        console.log(`Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId};
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error);
    return { success: false, error: error };
    }
}

export const sendEmailWithLogging = async (
    to: string,
    subject: string,
    html: string,
    type?: string
) => {

     const [log] = await db.insert(emailLogs).values({
        recipientEmail: to,
        subject: subject,
        type: type,
        status: 'pending',
       }).returning();

    try {
      
        const result = await sendEmail(to, subject,html);

        await db.update(emailLogs)
         .set({
            status: result.success ? 'sent' : 'failed',
            sentAt: result.success ? new Date() : undefined,
            errorMessage: result.success ? undefined : JSON.stringify(result.error),
         }).where(eq(emailLogs.id, log.id));

         return result;

    } catch (error) {
         await db.update(emailLogs)
      .set({
        status: 'failed',
        errorMessage: String(error),
      })
      .where(eq(emailLogs.id, log.id));
    
    return { success: false, error };
    }
}

export default transporter;