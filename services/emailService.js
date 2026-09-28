import nodemailer from 'nodemailer';

let transporter = null;

const initializeTransporter = () => {
  if (transporter) return transporter;

  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'noreply@hubatrade.com',
        pass: process.env.SMTP_PASS || 'dummy_password'
      }
    });
    console.log('✅ Email service initialized');
  } catch (error) {
    console.warn('⚠️ Email service initialization failed:', error.message);
  }

  return transporter;
};

export const sendVerificationEmail = async (email, token) => {
  try {
    const transport = initializeTransporter();
    if (!transport) return console.warn('Email service not available');

    const verificationLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@hubatrade.com',
      to: email,
      subject: 'Hubatrade - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B35;">Welcome to Hubatrade!</h2>
          <p>Click the link below to verify your email address:</p>
          <a href="${verificationLink}" style="background-color: #FF6B35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p style="margin-top: 20px; color: #666;">Or copy this link: ${verificationLink}</p>
        </div>
      `
    };

    return await transport.sendMail(mailOptions);
  } catch (error) {
    console.warn('Email verification failed:', error.message);
  }
};

export const sendWelcomeEmail = async (email, firstName, role) => {
  try {
    const transport = initializeTransporter();
    if (!transport) return console.warn('Email service not available');

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@hubatrade.com',
      to: email,
      subject: 'Welcome to Hubatrade!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B35;">Welcome ${firstName}!</h2>
          <p>You've successfully registered as a <strong>${role}</strong> on Hubatrade.</p>
          <p>Get started by exploring our platform and setting up your profile.</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" style="background-color: #FF6B35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Go to Hubatrade
          </a>
        </div>
      `
    };

    return await transport.sendMail(mailOptions);
  } catch (error) {
    console.warn('Welcome email failed:', error.message);
  }
};

export const sendOrderConfirmation = async (email, orderId, items, totalAmount) => {
  try {
    const transport = initializeTransporter();
    if (!transport) return console.warn('Email service not available');

    const itemsList = items.map(item => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;">${item.name}</td>
        <td style="border: 1px solid #ddd; padding: 10px;">${item.quantity}</td>
        <td style="border: 1px solid #ddd; padding: 10px;">₦${item.price}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@hubatrade.com',
      to: email,
      subject: `Order Confirmation - ${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B35;">Order Confirmed!</h2>
          <p>Order ID: <strong>${orderId}</strong></p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Product</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Qty</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Price</th>
            </tr>
            ${itemsList}
          </table>
          <h3 style="text-align: right; color: #FF6B35;">Total: ₦${totalAmount}</h3>
        </div>
      `
    };

    return await transport.sendMail(mailOptions);
  } catch (error) {
    console.warn('Order confirmation email failed:', error.message);
  }
};
