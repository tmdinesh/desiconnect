import nodemailer from 'nodemailer';

// Configure transporter for development (logs to console) or production
const createTransporter = () => {
  // In production, you would use actual email service credentials
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // Use console logging for development
  return {
    sendMail: async (mailOptions: any) => {
      console.log('===============================');
      console.log('Email notification would be sent:');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Text:', mailOptions.text);
      console.log('HTML:', mailOptions.html);
      console.log('===============================');
      return { messageId: 'dev-mode' };
    },
  };
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  password: string,
  userType: 'customer' | 'seller' | 'admin'
) => {
  const transporter = createTransporter();

  const portalName = 
    userType === 'customer' ? 'Customer Account' :
    userType === 'seller' ? 'Seller Dashboard' : 'Admin Dashboard';

  await transporter.sendMail({
    from: `"DesiConnect" <${process.env.EMAIL_FROM || 'noreply@desiconnect.com'}>`,
    to: email,
    subject: 'Your DesiConnect Password Reset',
    text: `Hello ${name},

We received a request to reset your password for your DesiConnect ${portalName}.

Your new temporary password is: ${password}

Please use this password to log in and update your password immediately.

If you did not request this password reset, please contact our support team.

Thank you,
DesiConnect Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B35;">DesiConnect Password Reset</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password for your DesiConnect ${portalName}.</p>
        <p>Your new temporary password is: <strong>${password}</strong></p>
        <p>Please use this password to log in and update your password immediately.</p>
        <p>If you did not request this password reset, please contact our support team.</p>
        <p>Thank you,<br>DesiConnect Team</p>
      </div>
    `,
  });
};

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  userType: 'customer' | 'seller' | 'admin'
) => {
  const transporter = createTransporter();

  const portalName = 
    userType === 'customer' ? 'Customer Account' :
    userType === 'seller' ? 'Seller Dashboard' : 'Admin Dashboard';

  await transporter.sendMail({
    from: `"DesiConnect" <${process.env.EMAIL_FROM || 'noreply@desiconnect.com'}>`,
    to: email,
    subject: 'Welcome to DesiConnect',
    text: `Hello ${name},

Welcome to DesiConnect! Your ${portalName} has been successfully created.

Thank you for joining our platform. We're excited to have you as part of our community.

If you have any questions, please contact our support team.

Thank you,
DesiConnect Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B35;">Welcome to DesiConnect</h2>
        <p>Hello ${name},</p>
        <p>Welcome to DesiConnect! Your ${portalName} has been successfully created.</p>
        <p>Thank you for joining our platform. We're excited to have you as part of our community.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Thank you,<br>DesiConnect Team</p>
      </div>
    `,
  });
};

export const sendSellerApprovalEmail = async (
  email: string,
  businessName: string
) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"DesiConnect" <${process.env.EMAIL_FROM || 'noreply@desiconnect.com'}>`,
    to: email,
    subject: 'Your Seller Account Has Been Approved!',
    text: `Hello ${businessName},

Congratulations! Your seller account on DesiConnect has been approved.

You can now log in to your Seller Dashboard and begin listing your products. Our platform connects you with customers looking for authentic South Asian products.

Next steps:
1. Log in to your Seller Dashboard
2. Complete your business profile
3. Add your products
4. Start selling!

If you have any questions about getting started, please contact our seller support team.

Thank you for choosing DesiConnect!

Best regards,
DesiConnect Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B35;">Your Seller Account Has Been Approved!</h2>
        <p>Hello ${businessName},</p>
        <p><strong>Congratulations!</strong> Your seller account on DesiConnect has been approved.</p>
        <p>You can now log in to your Seller Dashboard and begin listing your products. Our platform connects you with customers looking for authentic South Asian products.</p>
        
        <h3 style="color: #404040;">Next steps:</h3>
        <ol>
          <li>Log in to your Seller Dashboard</li>
          <li>Complete your business profile</li>
          <li>Add your products</li>
          <li>Start selling!</li>
        </ol>
        
        <p>If you have any questions about getting started, please contact our seller support team.</p>
        <p>Thank you for choosing DesiConnect!</p>
        <p>Best regards,<br>DesiConnect Team</p>
      </div>
    `,
  });
};

export const sendSellerRejectionEmail = async (
  email: string,
  businessName: string
) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"DesiConnect" <${process.env.EMAIL_FROM || 'noreply@desiconnect.com'}>`,
    to: email,
    subject: 'Update on Your DesiConnect Seller Application',
    text: `Hello ${businessName},

Thank you for your interest in becoming a seller on DesiConnect.

After reviewing your application, we regret to inform you that we are unable to approve your seller account at this time.

Common reasons for this decision may include:
- Incomplete business information
- Unable to verify business credentials
- Business category does not align with our current marketplace focus

If you believe there's been a mistake or would like to provide additional information, please contact our seller support team.

Thank you for your understanding.

Regards,
DesiConnect Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B35;">Update on Your DesiConnect Seller Application</h2>
        <p>Hello ${businessName},</p>
        <p>Thank you for your interest in becoming a seller on DesiConnect.</p>
        <p>After reviewing your application, we regret to inform you that we are unable to approve your seller account at this time.</p>
        
        <p>Common reasons for this decision may include:</p>
        <ul>
          <li>Incomplete business information</li>
          <li>Unable to verify business credentials</li>
          <li>Business category does not align with our current marketplace focus</li>
        </ul>
        
        <p>If you believe there's been a mistake or would like to provide additional information, please contact our seller support team.</p>
        <p>Thank you for your understanding.</p>
        <p>Regards,<br>DesiConnect Team</p>
      </div>
    `,
  });
};
