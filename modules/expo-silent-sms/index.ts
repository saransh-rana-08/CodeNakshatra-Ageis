import { requireNativeModule } from 'expo';

interface ExpoSilentSmsModule {
  isAvailableAsync(): Promise<boolean>;
  requestPermissionsAsync(): Promise<boolean>;
  sendSMSAsync(phoneNumber: string, message: string): Promise<boolean>;
}

const ExpoSilentSms = requireNativeModule<ExpoSilentSmsModule>('ExpoSilentSms');

export default ExpoSilentSms;
