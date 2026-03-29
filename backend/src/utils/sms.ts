// SMS service using Twilio or similar service

export const sendSMS = async (to: string, message: string) => {
  try {
    // Integrate with Twilio or other SMS service
    // For now, just log the message
    console.log(`[sms] would send to ${to}: ${message}`);

    // Uncomment and configure when SMS service is set up
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    */

    return { success: true };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

export const sendParentAlert = async (parentContact: string, studentName: string, message: string) => {
  try {
    const fullMessage = `Alert for ${studentName}: ${message}`;
    await sendSMS(parentContact, fullMessage);
    console.log(`Parent alert sent to ${parentContact}`);
  } catch (error) {
    console.error('Error sending parent alert:', error);
    throw error;
  }
};

export const sendEmergencyNotice = async (contacts: string[], message: string) => {
  try {
    const promises = contacts.map(contact => sendSMS(contact, `EMERGENCY: ${message}`));
    await Promise.all(promises);
    console.log(`Emergency notice sent to ${contacts.length} contacts`);
  } catch (error) {
    console.error('Error sending emergency notice:', error);
    throw error;
  }
};

export const sendAttendanceSMS = async (parentContact: string, studentName: string, date: string, status: string) => {
  try {
    const message = `${studentName}'s attendance for ${date}: ${status}`;
    await sendSMS(parentContact, message);
    console.log(`Attendance SMS sent to ${parentContact}`);
  } catch (error) {
    console.error('Error sending attendance SMS:', error);
    throw error;
  }
};

export const sendExamResultSMS = async (parentContact: string, studentName: string, subject: string, marks: number, maxMarks: number) => {
  try {
    const percentage = ((marks / maxMarks) * 100).toFixed(2);
    const message = `${studentName}'s ${subject} result: ${marks}/${maxMarks} (${percentage}%)`;
    await sendSMS(parentContact, message);
    console.log(`Exam result SMS sent to ${parentContact}`);
  } catch (error) {
    console.error('Error sending exam result SMS:', error);
    throw error;
  }
};
