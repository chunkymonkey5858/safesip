import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';

const OnboardingScreen = () => {
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    name: '',
    heightFeet: '',
    heightInches: '',
    weightPounds: '',
    age: '',
    sex: 'male' as 'male' | 'female',
    mealState: 'light' as 'fasted' | 'light' | 'heavy',
  });

  // Convert feet and inches to cm
  const convertHeightToCm = (feet: string, inches: string): number => {
    const feetNum = parseFloat(feet) || 0;
    const inchesNum = parseFloat(inches) || 0;
    const totalInches = feetNum * 12 + inchesNum;
    return totalInches * 2.54; // 1 inch = 2.54 cm
  };

  // Convert pounds to kg
  const convertWeightToKg = (pounds: string): number => {
    const poundsNum = parseFloat(pounds) || 0;
    return poundsNum * 0.453592; // 1 pound = 0.453592 kg
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const heightCm = convertHeightToCm(formData.heightFeet, formData.heightInches);
      const weightKg = convertWeightToKg(formData.weightPounds);

      const userProfile: Omit<UserProfile, 'id'> = {
        name: formData.name,
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        height: heightCm,
        weight: weightKg,
        age: parseInt(formData.age),
        sex: formData.sex,
        mealState: 'light', // Default to light meal, can be updated daily
      };

      await signUp(formData.email.trim(), formData.password, userProfile);
      // Navigation will be handled by AppNavigator based on auth state
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          formData.email.trim().length > 0 &&
          formData.password.trim().length >= 6 &&
          formData.confirmPassword.trim().length >= 6 &&
          formData.password === formData.confirmPassword &&
          formData.phoneNumber.trim().length > 0
        );
      case 2:
        return formData.name.trim().length > 0;
      case 3:
        return (
          formData.heightFeet.trim().length > 0 &&
          formData.heightInches.trim().length > 0 &&
          formData.weightPounds.trim().length > 0 &&
          formData.age.trim().length > 0 &&
          !isNaN(parseFloat(formData.heightFeet)) &&
          !isNaN(parseFloat(formData.heightInches)) &&
          !isNaN(parseFloat(formData.weightPounds)) &&
          !isNaN(parseInt(formData.age))
        );
      default:
        return false;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>safe</Text>
            <View style={styles.logoIconContainer}>
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <View style={styles.beerGlass}>
                <View style={styles.beerLiquid} />
                <View style={styles.beerFoam}>
                  <View style={styles.bubble} />
                  <View style={styles.bubble} />
                  <View style={styles.bubble} />
                </View>
              </View>
            </View>
            <Text style={styles.logoText}>p</Text>
          </View>
          <Text style={styles.subtitle}>Know Your Limit, Drink Smarter Socially</Text>
        </View>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Create Account</Text>
            <Text style={styles.description}>
              Let's get you started with your account
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="(555) 123-4567"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              keyboardType="phone-pad"
              autoComplete="tel"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tell us about yourself</Text>

            <Text style={styles.label}>Height</Text>
            <View style={styles.heightContainer}>
              <View style={styles.heightInputWrapper}>
                <TextInput
                  style={[styles.input, styles.heightInput]}
                  placeholder="Feet"
                  keyboardType="numeric"
                  value={formData.heightFeet}
                  onChangeText={(text) => setFormData({ ...formData, heightFeet: text })}
                />
                <Text style={styles.heightUnit}>ft</Text>
              </View>
              <View style={styles.heightInputWrapper}>
                <TextInput
                  style={[styles.input, styles.heightInput]}
                  placeholder="Inches"
                  keyboardType="numeric"
                  value={formData.heightInches}
                  onChangeText={(text) => setFormData({ ...formData, heightInches: text })}
                />
                <Text style={styles.heightUnit}>in</Text>
              </View>
            </View>

            <Text style={styles.label}>Weight (lbs)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your weight"
              keyboardType="numeric"
              value={formData.weightPounds}
              onChangeText={(text) => setFormData({ ...formData, weightPounds: text })}
            />

            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              keyboardType="numeric"
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
            />

            <Text style={styles.label}>Sex</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.optionButton, formData.sex === 'male' && styles.optionButtonActive]}
                onPress={() => setFormData({ ...formData, sex: 'male' })}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    formData.sex === 'male' && styles.optionButtonTextActive,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  formData.sex === 'female' && styles.optionButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, sex: 'female' })}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    formData.sex === 'female' && styles.optionButtonTextActive,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}


        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, (!isStepValid() || loading) && styles.buttonDisabled]}
            disabled={!isStepValid() || loading}
            onPress={() => {
              if (!isStepValid() || loading) return;
              if (step < 3) {
                setStep(step + 1);
              } else {
                handleSubmit();
              }
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {step < 3 ? 'Next' : 'Get Started'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.stepDot, i === step && styles.stepDotActive]}
            />
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#4C1D95', // Royal purple
    letterSpacing: 1,
  },
  logoIconContainer: {
    position: 'relative',
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 52,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: -8,
    zIndex: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FBBF24', // Golden yellow
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4C1D95',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  checkmark: {
    color: '#4C1D95',
    fontSize: 14,
    fontWeight: 'bold',
  },
  beerGlass: {
    width: 28,
    height: 40,
    borderWidth: 2.5,
    borderColor: '#1F2937',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
  },
  beerLiquid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: '#FBBF24', // Golden yellow
  },
  beerFoam: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: '#FEF3C7', // Light yellow
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 2,
    gap: 3,
  },
  bubble: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  stepContainer: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
    marginTop: 16,
  },
  description: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 24,
  },
  input: {
    borderWidth: 2,
    borderColor: '#DFE6E9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  heightContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  heightInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DFE6E9',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    paddingRight: 12,
  },
  heightInput: {
    flex: 1,
    borderWidth: 0,
    padding: 16,
    margin: 0,
  },
  heightUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636E72',
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DFE6E9',
    alignItems: 'center',
  },
  optionButtonActive: {
    borderColor: '#4C1D95', // Royal purple
    backgroundColor: '#EDE9FE', // Light purple
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636E72',
  },
  optionButtonTextActive: {
    color: '#4C1D95', // Royal purple
  },
  mealOption: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DFE6E9',
    marginBottom: 12,
  },
  mealOptionActive: {
    borderColor: '#4C1D95', // Royal purple
    backgroundColor: '#EDE9FE', // Light purple
  },
  mealOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  mealOptionDesc: {
    fontSize: 14,
    color: '#636E72',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4C1D95', // Royal purple
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#DFE6E9',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#2D3436',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DFE6E9',
  },
  stepDotActive: {
    backgroundColor: '#FBBF24', // Golden yellow
    width: 24,
  },
});

export default OnboardingScreen;

