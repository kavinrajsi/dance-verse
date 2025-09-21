// Option 2: Email Integration (using Resend or similar)
// Add to package.json: "resend": "^3.2.0"

// src/lib/email.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSubmissionNotification(submissionData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - email notifications disabled');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'DanceVerse <noreply@yourdomain.com>',
      to: [process.env.ADMIN_EMAIL || 'admin@yourdomain.com'],
      subject: `New Dance Submission: ${submissionData.title}`,
      html: `
        <h2>New Dance Video Submission</h2>
        <p><strong>Name:</strong> ${submissionData.name}</p>
        <p><strong>Email:</strong> ${submissionData.email}</p>
        <p><strong>Phone:</strong> ${submissionData.phone}</p>
        <p><strong>Title:</strong> ${submissionData.title}</p>
        <p><strong>File Size:</strong> ${(submissionData.file_size / 1024 / 1024).toFixed(2)} MB</p>
        <p><strong>Video URL:</strong> <a href="${submissionData.blob_url}">View Video</a></p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    console.log('Submission notification sent:', data.id);
    return data;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    throw error;
  }
}

// Update upload route to use email:
/*
import { sendSubmissionNotification } from "@/lib/email";

// In upload route after blob upload:
try {
  await sendSubmissionNotification(submissionData);
  console.log("Admin notified via email");
} catch (emailError) {
  console.error("Email notification failed:", emailError);
  // Continue anyway - upload was successful
}
*/