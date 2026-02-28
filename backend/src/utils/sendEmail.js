const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter object using standard SMTP transport
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    // Setup email data
    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        // Add html support for better-looking notifications if needed later
        // html: options.html 
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
    } catch (err) {
        console.error(`Error sending email to ${options.email}: `, err.message);
    }
};

module.exports = sendEmail;
