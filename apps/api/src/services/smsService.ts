/**
 * MetriCheck Legal Metrology - SMS Gateway Dispatch Service
 * 
 * Supports:
 * 1. Fast2SMS (Instant real SMS delivery to Indian mobile numbers)
 * 2. Twilio (International/Global SMS delivery)
 * 3. Government Simulator / NIC Kavach Console Dispatch (Development & Evaluation mode)
 */

export interface SendSmsParams {
  toPhone: string;
  officerName: string;
  otpCode: string;
  expiresInMinutes?: number;
}

export interface SmsDispatchResult {
  success: boolean;
  provider: 'FAST2SMS' | 'TWILIO' | 'NIC_SIMULATOR';
  messageId?: string;
  error?: string;
}

export async function sendOtpSms(params: SendSmsParams): Promise<SmsDispatchResult> {
  const { toPhone, officerName, otpCode, expiresInMinutes = 5 } = params;
  const cleanPhone = (toPhone || '').replace(/\D/g, '').slice(-10);

  const messageText = `[MetriCheck] Legal Metrology Portal: Your 2FA inspection login verification OTP is ${otpCode}. Valid for ${expiresInMinutes} minutes. Do not share this code with anyone. - Dept of Consumer Affairs`;

  // 1. Check for Fast2SMS (Indian SMS Gateway)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey && cleanPhone.length === 10) {
    try {
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otpCode,
          numbers: cleanPhone
        })
      });

      const data: any = await res.json();
      if (data.return === true || data.status_code === 200) {
        console.log(`[REAL SMS DISPATCH - Fast2SMS] 📱 OTP ${otpCode} successfully sent to +91 ${cleanPhone}`);
        return {
          success: true,
          provider: 'FAST2SMS',
          messageId: data.request_id || 'sent'
        };
      } else {
        console.warn(`[Fast2SMS Warning] Failed:`, data.message);
      }
    } catch (err: any) {
      console.error(`[Fast2SMS Error]`, err.message);
    }
  }

  // 2. Check for Twilio
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuthToken && twilioFrom && cleanPhone.length === 10) {
    try {
      const basicAuth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
      const body = new URLSearchParams({
        To: `+91${cleanPhone}`,
        From: twilioFrom,
        Body: messageText
      });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      const data: any = await res.json();
      if (res.ok) {
        console.log(`[REAL SMS DISPATCH - Twilio] 📱 OTP ${otpCode} successfully sent to +91 ${cleanPhone}`);
        return {
          success: true,
          provider: 'TWILIO',
          messageId: data.sid
        };
      } else {
        console.warn(`[Twilio Warning]`, data.message);
      }
    } catch (err: any) {
      console.error(`[Twilio Error]`, err.message);
    }
  }

  // 3. Fallback to Government NIC Kavach Simulator
  console.log(`\n===============================================================`);
  console.log(`[GOV SMS GATEWAY / NIC Kavach Dispatch Simulator]`);
  console.log(`📨 Verification OTP Code: ${otpCode}`);
  console.log(`👤 Officer: ${officerName}`);
  console.log(`📱 Destination Mobile: +91 ${cleanPhone || '9876543210'}`);
  console.log(`💬 Message: "${messageText}"`);
  console.log(`⏳ Expiration: ${expiresInMinutes} minutes`);
  console.log(`ℹ️ To deliver to physical phone: Add FAST2SMS_API_KEY or TWILIO credentials in .env`);
  console.log(`===============================================================\n`);

  return {
    success: true,
    provider: 'NIC_SIMULATOR'
  };
}
