const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to,subject,text)=> {
    try{
        await transporter.sendMail({
            fom: `"KalyanaMalai" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        });
        console.log("✅ Email sent to", to);
        res.status(200).send("Email sent successfully");
    }catch(err){
        console.error("❌ Error sending email to", to, ":", err);
        res.status(500).send("Error sending email");
    }

};
module.exports = sendEmail;