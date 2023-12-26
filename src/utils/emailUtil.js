const nodemailer = require("nodemailer");

async function sendEmail(subject, htmlContent, email, companyName) {
    const sender = "stockxmarketemails@gmail.com"
    const password = "ysainzcansessyyv"
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: sender,
            pass: password,
        },
    });

    const mailOptions = {
        from: `"${companyName}" <${sender}>`,
        to: email,
        subject: subject,
        html: htmlContent,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return 'Email sent successfully!';
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending email. Please check your credentials.');
    }
}
module.exports = {
    sendEmail,
};