// utils/awsEmailSender.js
const nodemailer = require('nodemailer');

class AWSEmailSender {
    constructor(iam_username, smtp_username, smtp_password) {
        this.iam_username = iam_username;
        this.smtp_username = smtp_username;
        this.smtp_password = smtp_password;
        
        // Create transporter
        this.transporter = nodemailer.createTransport({
            host: "email-smtp.ap-southeast-1.amazonaws.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: this.smtp_username,
                pass: this.smtp_password
            }
        });
    }

    async send_email(from, to, subject, body) {
        try {
            const info = await this.transporter.sendMail({
                from: from,
                to: to,
                subject: subject,
                text: body,
            });

            console.log("Email sent: %s", info.messageId);
            return true;
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }
}

module.exports = AWSEmailSender;