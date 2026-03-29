import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendStudentWelcomeEmail = async (email: string, studentName: string, password?: string) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to MES Vasant Joshi College',
      html: `
        <h2>Welcome ${studentName}!</h2>
        <p>Your student account has been created successfully at <strong>MES Vasant Joshi College</strong>.</p>
        <p>You can now log in to access your student dashboard using the credentials below:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0 0 5px 0;"><strong>Username / Email:</strong> ${email}</p>
          ${password ? `<p style="margin: 0;"><strong>Password:</strong> ${password}</p>` : ''}
        </div>
        <p>We recommend changing your password after your first login.</p>
        <br>
        <p>Best regards,<br>MES Vasant Joshi College Administration</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

export const sendAttendanceAlert = async (email: string, studentName: string, date: string, status: string) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: `Attendance Alert - ${date} | MES Vasant Joshi College`,
      html: `
        <h2>Attendance Notification</h2>
        <p>Dear ${studentName},</p>
        <p>Your attendance for ${date} at <strong>MES Vasant Joshi College</strong> has been marked as: <strong style="color: ${status === 'absent' ? 'red' : 'green'};">${status.toUpperCase()}</strong></p>
        <p>Please contact your teacher or the administration if you believe this is an error.</p>
        <br>
        <p>Best regards,<br>MES Vasant Joshi College Administration</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Attendance alert sent to ${email}`);
  } catch (error) {
    console.error('Error sending attendance alert:', error);
    throw error;
  }
};

export const sendExamResults = async (email: string, studentName: string, subject: string, marks: number, maxMarks: number) => {
  try {
    const percentage = (marks / maxMarks * 100).toFixed(2);
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: `Exam Results: ${subject} | MES Vasant Joshi College`,
      html: `
        <h2>Exam Results Notification</h2>
        <p>Dear ${studentName},</p>
        <p>Your results for <strong>${subject}</strong> are now available.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0 0 5px 0;"><strong>Marks Obtained:</strong> ${marks} / ${maxMarks}</p>
          <p style="margin: 0;"><strong>Percentage:</strong> ${percentage}%</p>
        </div>
        <p>Please log in to your student dashboard to view detailed insights.</p>
        <br>
        <p>Best regards,<br>MES Vasant Joshi College Administration</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Exam results sent to ${email}`);
  } catch (error) {
    console.error('Error sending exam results:', error);
    throw error;
  }
};

export const sendResultNotificationEmail = async (email: string, studentName: string, examType: string, grade: string) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: `Result Published - ${examType} | MES Vasant Joshi College`,
      html: `
        <h2>Result Notification</h2>
        <p>Dear Parent/Student,</p>
        <p>The official ${examType} results for <strong>${studentName}</strong> have been published.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0;"><strong>Overall Grade:</strong> ${grade}</p>
        </div>
        <p>Please log in to the portal to view the detailed academic report and download the official copy.</p>
        <br>
        <p>Best regards,<br>MES Vasant Joshi College Administration</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Result notification sent to ${email}`);
  } catch (error) {
    console.error('Error sending result notification:', error);
    throw error;
  }
};

// Placeholder for SMS - email notifications are primary
// To enable SMS in future, integrate with services like:
// - MSG91 (India)
// - AWS SNS
// - Twilio
// For now, just log the notification
export const sendResultNotification = async (
  phone: string,
  studentName: string,
  examType: string,
  grade: string
) => {
  // Placeholder - SMS integration can be added later
  console.log(`[SMS Placeholder] ${examType} results for ${studentName} - Grade: ${grade} (To: ${phone})`);
  return { success: true, method: 'placeholder' };
};

export const sendAttendanceNotification = async (
  phone: string,
  studentName: string,
  date: string,
  status: string
) => {
  // Placeholder - SMS integration can be added later
  console.log(`[SMS Placeholder] Attendance for ${studentName} on ${date} - Status: ${status} (To: ${phone})`);
  return { success: true, method: 'placeholder' };
};

export const sendGeneralNotification = async (email: string, subject: string, message: string) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: `${subject} | MES Vasant Joshi College`,
      html: `
        <h2>Official Institution Notice</h2>
        <p>${message}</p>
        <br>
        <p>Best regards,<br>MES Vasant Joshi College Administration</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`General notification sent to ${email}`);
  } catch (error) {
    console.error('Error sending general notification:', error);
    throw error;
  }
};

export const sendAssignmentNotification = async (
  email: string,
  studentName: string,
  teacherName: string,
  subjectName: string,
  assignmentTitle: string,
  dueDate: Date
) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: `New Assignment Posted - ${subjectName} | MES Vasant Joshi College`,
      html: `
        <h2>📚 New Assignment Alert</h2>
        <p>Dear ${studentName},</p>
        <p>A new academic assignment has been posted by <strong>${teacherName}</strong> for the subject <strong>${subjectName}</strong>.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0 0 5px 0;"><strong>Title:</strong> ${assignmentTitle}</p>
          <p style="margin: 0;"><strong>Due Date:</strong> <span style="color: red;">${dueDate.toLocaleDateString()}</span></p>
        </div>
        <p>Please log in to your student panel to view reference materials and submit your work.</p>
        <br>
        <p>Best regards,<br>MES Vasant Joshi College</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Assignment notification sent to ${email}`);
  } catch (error) {
    console.error('Error sending assignment notification:', error);
  }
};

export const sendTeacherWelcomeEmail = async (email: string, teacherName: string, password?: string) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to MES Vasant Joshi College - Connect Portal',
      html: `
        <h2>Welcome ${teacherName}!</h2>
        <p>Your faculty account has been officially registered at <strong>MES Vasant Joshi College</strong>.</p>
        <p>You can securely log in to the Teacher Dashboard using your organizational credentials below:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0 0 5px 0;"><strong>Username / Email:</strong> ${email}</p>
          ${password ? `<p style="margin: 0;"><strong>Temporary Password:</strong> ${password}</p>` : ''}
        </div>
        <p>Please log in from the portal to manage your classes, assignments, and attendance.</p>
        <br>
        <p>Best regards,<br>MES Vasant Joshi College Administration</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending teacher welcome email:', error);
  }
};