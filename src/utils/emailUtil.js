const nodemailer = require("nodemailer");

function sendEmail(subject, htmlContent, email, companyName) {
    console.log("dick");
    const sender = "ddcgt680@gmail.com"
    const password = "jwufaidmgmgmjsvl "
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
        const info = transporter.sendMail(mailOptions);
        console.log(info)
        return 'Email sent successfully!';
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending email. Please check your credentials.');
    }
}
module.exports = {
    sendEmail,
};