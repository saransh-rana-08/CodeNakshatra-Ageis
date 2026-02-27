import axios from 'axios';
import * as SMS from 'expo-sms';
import { Config } from '../constants/Config';

const TWILIO_SMS_URL = Config.endpoints.TWILIO_SMS;

export const SMSService = {
    async sendTwilioSMS(recipients: string[], message: string): Promise<void> {
        console.log("🌐 Sending Twilio SMS to:", recipients);

        const promises = recipients.map(async (phone) => {
            let formattedPhone = phone.trim();
            if (!formattedPhone.startsWith("+")) {
                if (formattedPhone.startsWith("91") && formattedPhone.length === 12) {
                    formattedPhone = "+" + formattedPhone;
                } else {
                    formattedPhone = "+91" + formattedPhone;
                }
            }

            console.log(`🌐 sending to ${formattedPhone}...`);
            return axios.post(TWILIO_SMS_URL, {
                to: formattedPhone,
                message: message
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
        });

        try {
            await Promise.all(promises);
            console.log("✅ Twilio SMS sent (all).");
        } catch (error) {
            console.log("❌ Twilio SMS Failed, retrying...");
            // One-time retry after 2 seconds
            setTimeout(async () => {
                try {
                    await Promise.all(promises);
                    console.log("✅ Twilio SMS Retry Success.");
                } catch (retryError) {
                    console.log("❌ Twilio SMS Retry Failed.");
                }
            }, 2000);
        }
    },

    async sendNativeSMS(recipients: string[], message: string): Promise<boolean> {
        console.log("📩 Checking SMS availability...");
        const isAvailable = await SMS.isAvailableAsync();

        if (!isAvailable) {
            console.log("⚠️ SMS composer unavailable, relying on Twilio API.");
            return false;
        }

        try {
            const result = await SMS.sendSMSAsync(recipients, message);
            console.log("📩 Native SMS result:", result);
            return true;
        } catch (e: any) {
            console.log("📩 Native SMS error:", e?.message || e);
            return false;
        }
    }
};
