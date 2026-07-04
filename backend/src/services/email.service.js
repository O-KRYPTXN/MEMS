/**
 * Mock email service for development.
 * In a real application, this would use Nodemailer, SendGrid, Resend, etc.
 */

export const sendActivationEmail = async (email, token) => {
  const activationUrl = `http://localhost:5173/activate/${token}`;
  
  console.log('\n========================================================');
  console.log('📧 MOCK EMAIL SENT');
  console.log('========================================================');
  console.log(`To:      ${email}`);
  console.log(`Subject: Your hospital account has been approved`);
  console.log(`Body:`);
  console.log(`Hello,`);
  console.log(`Your account request has been approved by the System Administrator.`);
  console.log(`Please click the link below to set your password and activate your account:\n`);
  console.log(activationUrl);
  console.log('\nThis link will expire in 48 hours.');
  console.log('========================================================\n');
  
  // Return true to indicate successful "send"
  return true;
};

/**
 * Mock email for registration rejection
 */
export const sendRejectionEmail = async (email, reason = "Does not meet access criteria") => {
  console.log('\n========================================================');
  console.log('📧 MOCK EMAIL SENT (REJECTION)');
  console.log('========================================================');
  console.log(`To:      ${email}`);
  console.log(`Subject: Update on your hospital account request`);
  console.log(`Body:`);
  console.log(`Hello,`);
  console.log(`Your account request has been reviewed by the System Administrator and was denied.`);
  console.log(`Reason: ${reason}`);
  console.log(`If you believe this is a mistake, please contact IT support.`);
  console.log('========================================================\n');
  
  return true;
};
