# Resend Email Setup for BodyMax Feedback

## Overview
The feedback feature now uses Resend API to send feedback emails directly to `support@odanta.com`. Users can submit bug reports, feature requests, improvements, and general feedback through the app.

## Features Implemented
- ✅ Send feedback emails via Resend API
- ✅ Beautifully formatted HTML emails with BodyMax branding
- ✅ Optional user confirmation emails
- ✅ Reply-to user email for easy follow-up
- ✅ Categorized feedback types (Bug, Feature, Improvement, Other)
- ✅ Error handling with fallback to mailto: links

## Resend Dashboard Setup

### 1. Verify Your Domain
Before sending emails from `noreply@odanta.com`, you need to verify your domain:

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter `odanta.com`
4. Add the DNS records Resend provides to your domain registrar
5. Wait for verification (usually takes a few minutes)

### 2. Get Your API Key
1. Go to [API Keys](https://resend.com/api-keys)
2. Create a new API key (if you haven't already)
3. Copy the key and add it to your `.env` file:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   ```

### 3. Update Email Addresses (if needed)
If you want to use a different email address, update these files:

**src/services/feedback.js:**
```javascript
const FEEDBACK_EMAIL = 'your-support@yourdomain.com';
```

**From email address:**
```javascript
from: 'BodyMax Feedback <noreply@yourdomain.com>'
```

## Testing the Integration

### 1. Restart Metro Bundler
After adding the RESEND_API_KEY to .env, restart your development server:
```bash
# Stop current server (Ctrl+C)
npm start
```

### 2. Clear Cache (if needed)
If the env variable isn't loading:
```bash
npx expo start --clear
```

### 3. Test Feedback Submission
1. Open the app and navigate to Feedback tab
2. Select a feedback type (Bug Report, Feature Request, etc.)
3. Enter feedback message
4. Optionally add email for follow-up
5. Submit
6. Check your inbox at `support@odanta.com`

## Email Templates

### Feedback Email (to support@odanta.com)
- **From:** BodyMax Feedback <noreply@odanta.com>
- **To:** support@odanta.com
- **Reply-To:** User's email (if provided)
- **Subject:** [BodyMax] {Feedback Type} - {First 50 chars of message}
- **Body:** HTML-formatted with:
  - BodyMax branded header
  - Feedback type badge
  - Full message
  - User email (if provided)
  - Timestamp

### Confirmation Email (to user)
- **From:** BodyMax <noreply@odanta.com>
- **To:** User's email
- **Subject:** Thank you for your feedback!
- **Body:** Friendly confirmation message

## Error Handling

If Resend API fails:
- User sees an alert with options:
  - **Try Again** - Retries the submission
  - **Email Instead** - Opens mailto: link
  - **Cancel** - Dismisses the alert
- Error is logged to console for debugging

## Environment Variables Required

```env
# Required
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Already configured
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
```

## Files Modified/Created

### Created:
- `src/services/feedback.js` - Resend API integration
- `babel.config.js` - Environment variable configuration
- `RESEND_SETUP.md` - This setup guide

### Modified:
- `src/screens/FeedbackScreen.js` - Integrated Resend service
- `package.json` - Added react-native-dotenv

## Common Issues

### 1. "Resend API key is not configured"
- Make sure `.env` file exists with `RESEND_API_KEY`
- Restart Metro bundler
- Try clearing cache: `npx expo start --clear`

### 2. "Failed to send feedback email"
- Check Resend API key is valid
- Verify domain in Resend dashboard
- Check Resend API status at https://status.resend.com

### 3. Emails not arriving
- Check spam folder
- Verify domain DNS records are correct
- Check Resend dashboard logs for delivery status

### 4. "From" email address error
- Make sure the domain in the `from` field matches your verified domain
- Format: `Name <email@verified-domain.com>`

## API Rate Limits

Resend free tier includes:
- 100 emails/day
- 3,000 emails/month

For production, consider upgrading to a paid plan.

## Security Notes

- ✅ `.env` is in `.gitignore` - API key won't be committed
- ✅ API key loaded via environment variables
- ✅ Never expose API key in client code
- ✅ Error messages don't leak sensitive info

## Next Steps

1. ✅ Add RESEND_API_KEY to .env
2. ⏳ Verify odanta.com domain in Resend dashboard
3. ⏳ Test feedback submission
4. ⏳ Check email delivery
5. ⏳ Customize email templates if needed

## Support

If you have issues with Resend:
- Docs: https://resend.com/docs
- Support: support@resend.com
- Status: https://status.resend.com
