import { RESEND_API_KEY } from '@env';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FEEDBACK_EMAIL = 'oduduabasiav@gmail.com'; // Your support email

/**
 * Send feedback email using Resend API
 * @param {Object} feedbackData - The feedback data
 * @param {string} feedbackData.type - Feedback type (bug, feature, improvement, other)
 * @param {string} feedbackData.message - Feedback message
 * @param {string} feedbackData.userEmail - Optional user email for follow-up
 * @returns {Promise<Object>} - Response from Resend API
 */
export const sendFeedbackEmail = async ({ type, message, userEmail }) => {
  try {
    if (!RESEND_API_KEY) {
      throw new Error('Resend API key is not configured');
    }

    // Map feedback type to readable labels
    const typeLabels = {
      bug: 'Bug Report',
      feature: 'Feature Request',
      improvement: 'Improvement',
      other: 'Other',
    };

    const typeLabel = typeLabels[type] || type;
    const timestamp = new Date().toLocaleString();

    // Create HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #F26419 0%, #E85D04 100%);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .label {
              font-weight: 600;
              color: #666;
              margin-top: 15px;
              margin-bottom: 5px;
            }
            .value {
              background: white;
              padding: 12px;
              border-radius: 6px;
              border-left: 3px solid #F26419;
            }
            .badge {
              display: inline-block;
              background: #F26419;
              color: white;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #999;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">BodyMaxx Feedback</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">New ${typeLabel} Received</p>
          </div>
          <div class="content">
            <div class="label">Feedback Type:</div>
            <div class="value">
              <span class="badge">${typeLabel}</span>
            </div>

            <div class="label">Message:</div>
            <div class="value">
              ${message.replace(/\n/g, '<br>')}
            </div>

            ${userEmail ? `
              <div class="label">User Email:</div>
              <div class="value">
                <a href="mailto:${userEmail}" style="color: #F26419; text-decoration: none;">${userEmail}</a>
              </div>
            ` : ''}

            <div class="label">Submitted:</div>
            <div class="value">${timestamp}</div>
          </div>
          <div class="footer">
            Sent from BodyMaxx Mobile App
          </div>
        </body>
      </html>
    `;

    // Plain text version for email clients that don't support HTML
    const textContent = `
BodyMaxx Feedback - ${typeLabel}

Type: ${typeLabel}

Message:
${message}

${userEmail ? `User Email: ${userEmail}\n` : ''}
Submitted: ${timestamp}

---
Sent from BodyMaxx Mobile App
    `.trim();

    const emailPayload = {
      from: 'BodyMaxx Feedback <onboarding@resend.dev>', // Resend's default test domain
      to: [FEEDBACK_EMAIL], // Goes to oduduabasiav@gmail.com
      subject: `[BodyMaxx] ${typeLabel} - ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
      html: htmlContent,
      text: textContent,
      ...(userEmail && {
        reply_to: userEmail, // You can reply directly to the user from your Gmail
      }),
    };

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      throw new Error(data.message || 'Failed to send feedback email');
    }

    console.log('Feedback email sent successfully:', data.id);
    return {
      success: true,
      emailId: data.id,
    };

  } catch (error) {
    console.error('Error sending feedback email:', error);
    throw error;
  }
};

/**
 * Send a confirmation email to the user (optional)
 * @param {string} userEmail - User's email address
 * @param {string} feedbackType - Type of feedback submitted
 */
export const sendConfirmationEmail = async (userEmail, feedbackType) => {
  try {
    if (!RESEND_API_KEY || !userEmail) {
      return;
    }

    const typeLabels = {
      bug: 'Bug Report',
      feature: 'Feature Request',
      improvement: 'Improvement',
      other: 'Feedback',
    };

    const typeLabel = typeLabels[feedbackType] || feedbackType;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #F26419 0%, #E85D04 100%);
              color: white;
              padding: 30px;
              border-radius: 8px;
              text-align: center;
            }
            .content {
              padding: 30px 0;
            }
            .button {
              display: inline-block;
              background: #F26419;
              color: white;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: 600;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Thank You! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi there!</p>
            <p>We've received your ${typeLabel.toLowerCase()} and wanted to say thank you for taking the time to help us improve BodyMaxx.</p>
            <p>Your feedback is incredibly valuable to us and helps make BodyMaxx better for everyone. Our team will review it carefully.</p>
            <p>If we need any clarification or have updates, we'll reach out to this email address.</p>
            <p>Keep crushing your fitness goals! 💪</p>
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The BodyMaxx Team</strong>
            </p>
          </div>
        </body>
      </html>
    `;

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BodyMaxx <oduduabasiav@gmail.com>',
        to: [userEmail],
        subject: 'Thank you for your feedback!',
        html: htmlContent,
      }),
    });

    if (response.ok) {
      console.log('Confirmation email sent to user');
    }

  } catch (error) {
    // Don't throw error for confirmation emails - it's not critical
    console.error('Error sending confirmation email:', error);
  }
};
