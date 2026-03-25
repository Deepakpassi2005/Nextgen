import dotenv from 'dotenv';
dotenv.config();

import { sendStudentWelcomeEmail } from './services/emailService';

async function test() {
  try {
    console.log('Attempting to send an email to deepakpassi086@gmail.com...');
    await sendStudentWelcomeEmail('deepakpassi086@gmail.com', 'Om');
    console.log('Test email sent successfully!');
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

test();
