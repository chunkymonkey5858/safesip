import { Linking, Alert, Platform } from 'react-native';

export interface ContactInfo {
  name: string;
  phoneNumber?: string;
  email?: string;
}

/**
 * Opens the default SMS app with a pre-filled message
 */
export const sendSMS = async (phoneNumber: string, message?: string) => {
  try {
    const url = Platform.select({
      ios: `sms:${phoneNumber}${message ? `&body=${encodeURIComponent(message)}` : ''}`,
      android: `sms:${phoneNumber}${message ? `?body=${encodeURIComponent(message)}` : ''}`,
    });

    if (url) {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'SMS is not available on this device.');
      }
    }
  } catch (error) {
    console.error('Error opening SMS:', error);
    Alert.alert('Error', 'Failed to open SMS app. Please try again.');
  }
};

/**
 * Opens the default Email app with a pre-filled email
 */
export const sendEmail = async (email: string, subject?: string, body?: string) => {
  try {
    let url = `mailto:${email}`;
    const params: string[] = [];
    
    if (subject) {
      params.push(`subject=${encodeURIComponent(subject)}`);
    }
    if (body) {
      params.push(`body=${encodeURIComponent(body)}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Email is not available on this device.');
    }
  } catch (error) {
    console.error('Error opening Email:', error);
    Alert.alert('Error', 'Failed to open email app. Please try again.');
  }
};

/**
 * Shows an action sheet to choose between SMS or Email
 */
export const showContactOptions = (
  contact: ContactInfo,
  defaultMessage?: string
) => {
  const options: string[] = [];
  const actions: (() => void)[] = [];

  if (contact.phoneNumber) {
    options.push(`Text (${contact.phoneNumber})`);
    actions.push(() => {
      const message = defaultMessage || `Hey ${contact.name}, just checking in!`;
      sendSMS(contact.phoneNumber!, message);
    });
  }

  if (contact.email) {
    options.push(`Email (${contact.email})`);
    actions.push(() => {
      const subject = `Hey ${contact.name}!`;
      const body = defaultMessage || `Hey ${contact.name},\n\nJust checking in!`;
      sendEmail(contact.email!, subject, body);
    });
  }

  if (options.length === 0) {
    Alert.alert(
      'No Contact Info',
      `${contact.name} doesn't have email or phone number saved.`
    );
    return;
  }

  if (options.length === 1) {
    // If only one option, execute it directly
    actions[0]();
    return;
  }

  // Show action sheet with options
  options.push('Cancel');
  Alert.alert(
    `Contact ${contact.name}`,
    'Choose how you want to reach out:',
    [
      ...options.slice(0, -1).map((option, index) => ({
        text: option,
        onPress: actions[index],
      })),
      { text: 'Cancel', style: 'cancel' },
    ]
  );
};

