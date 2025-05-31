import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Transporter untuk mengirim email via SMTP.
 * Disini contoh pakai Gmail SMTP. 
 * Sesuaikan host/port/security sesuai provider.
 */
export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // false = STARTTLS; true = SSL/TLS (port 465)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Verifikasi koneksi SMTP (opsional, tapi direkomendasikan)
transporter.verify((err, success) => {
    if (err) {
        console.error('❌ [Mailer] SMTP connection failed:', err);
    } else {
        console.log('✅ [Mailer] SMTP connection successful');
    }
});
