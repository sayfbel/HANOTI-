import React, { useState, useRef, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useAppAlert } from '../context/AlertContext';
import { DateBox } from '../components/ui/date-box';
import { ImageCropperModal } from '../components/ImageCropperModal';
import { PageHeader } from '../components/ui/PageHeader';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, token, signIn } = useAuth();
  const { showAlert } = useAppAlert();
  
  const [step, setStep] = useState(1);

  // Form State
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [birthday, setBirthday] = useState(user?.birthday || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  
  // Image State
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ? `http://localhost:3000${user.avatar_url}` : '');
  const [cropperVisible, setCropperVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [saving, setSaving] = useState(false);
  
  const styles = useMemo(() => getStyles(colors), [colors]);

  const flipAnim = useRef(new Animated.Value(0)).current;

  // --- Helpers ---
  const validateStep1 = () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!firstName || !nameRegex.test(firstName)) {
      showAlert('error', "Validation Error", "Please enter a valid first name (letters only).");
      return false;
    }
    if (!lastName || !nameRegex.test(lastName)) {
      showAlert('error', "Validation Error", "Please enter a valid last name (letters only).");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!birthday) {
      showAlert('error', "Validation Error", "Please enter your birthday.");
      return false;
    }
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      showAlert('error', "Validation Error", "You must be at least 18 years old.");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const phoneRegex = /^(?:\+212|0)[5-7]\d{8}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      showAlert('error', "Validation Error", "Please enter a valid Moroccan phone number (e.g., 06..., 07..., 05... or +212...).");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // --- API Calls ---
  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:3000/user/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          birthday: birthday,
          phone_number: phoneNumber
        })
      });
      
      if (!res.ok) {
        throw new Error('Failed to update profile');
      }
      
      // Update local user state
      if (user && token) {
        const updatedUser = { ...user, first_name: firstName, last_name: lastName, birthday, phone_number: phoneNumber };
        await signIn(updatedUser, token, true); // Assuming rememberMe is true or handled
      }
      
    } catch (err) {
      console.error(err);
      showAlert('error', "Error", "Could not save profile data.");
      setSaving(false);
      return false;
    }
    setSaving(false);
    return true;
  };

  const saveCardAndFinish = async () => {
    if (cardNumber && expiry && cardName) {
      setSaving(true);
      const lastFour = cardNumber.replace(/\D/g, '').slice(-4);
      let cardType = 'Unknown';
      if (cardNumber.startsWith('4')) cardType = 'Visa';
      else if (cardNumber.startsWith('5')) cardType = 'Mastercard';

      try {
        const res = await fetch('http://localhost:3000/user/credit-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            cardholder_name: cardName,
            last_four: lastFour,
            expiry_date: expiry,
            card_type: cardType
          })
        });
        if (!res.ok) throw new Error('Failed to save card');
      } catch (err) {
        console.error(err);
      }
    }
    
    // Save profile before finishing
    const profileSaved = await saveProfile();
    if (profileSaved) {
      setStep(5); // Go to Thanks screen
    }
  };

  const skipCardAndFinish = async () => {
    const profileSaved = await saveProfile();
    if (profileSaved) {
      setStep(5); // Go to Thanks screen
    }
  };

  // --- Avatar Logic ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
      setCropperVisible(true);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploadingImage(true);
    try {
      let formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('avatar', blob, 'profile.jpg');
      } else {
        formData.append('avatar', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        } as any);
      }

      const res = await fetch('http://localhost:3000/user/profile/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(`http://localhost:3000${data.avatar_url}`);
      } else {
        showAlert('error', "Error", data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  // --- Card Logic ---
  const flipCard = (toBack: boolean) => {
    setIsFlipped(toBack);
    Animated.timing(flipAnim, {
      toValue: toBack ? 180 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/.{1,4}/g);
    setCardNumber(match ? match.join(' ') : cleaned);
  };
  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  // --- Thanks Screen Timer ---
  useEffect(() => {
    if (step === 5) {
      const timer = setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step]);


  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {step < 5 && (
          <PageHeader 
            title={`Step ${step} of 4`} 
            showBackButton={step > 1} 
            onBack={() => {
              if (step > 1) prevStep();
            }} 
          />
        )}
        
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* STEP 1: Name & Avatar */}
          {step === 1 && (
            <Animatable.View animation="fadeInRight" style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Let's get to know you</Text>
              <Text style={styles.stepSubtitle}>Add a photo and your name</Text>

              <View style={styles.avatarSection}>
                <Pressable style={styles.avatarContainer} onPress={pickImage} disabled={uploadingImage}>
                  {uploadingImage ? (
                    <View style={styles.avatarMock}><ActivityIndicator color="#FFF" /></View>
                  ) : avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarMock}><Feather name="camera" size={32} color="#FFF" /></View>
                  )}
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput 
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput 
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <Pressable style={styles.primaryButton} onPress={nextStep}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </Pressable>
            </Animatable.View>
          )}

          {/* STEP 2: Birthday */}
          {step === 2 && (
            <Animatable.View animation="fadeInRight" style={styles.stepContainer}>
              <Text style={styles.stepTitle}>When is your birthday?</Text>
              <Text style={styles.stepSubtitle}>You must be at least 18 years old to use HANOT+.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Birthday</Text>
                <DateBox 
                  value={birthday} 
                  onChange={setBirthday} 
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <Pressable style={styles.primaryButton} onPress={nextStep}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </Pressable>
            </Animatable.View>
          )}

          {/* STEP 3: Phone Number */}
          {step === 3 && (
            <Animatable.View animation="fadeInRight" style={styles.stepContainer}>
              <Text style={styles.stepTitle}>What's your phone number?</Text>
              <Text style={styles.stepSubtitle}>Please enter a valid Moroccan number (+212 or 06/07/05).</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput 
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="0612345678"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <Pressable style={styles.primaryButton} onPress={nextStep}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </Pressable>
            </Animatable.View>
          )}

          {/* STEP 4: Add Card */}
          {step === 4 && (
            <Animatable.View animation="fadeInRight" style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Add a Payment Method</Text>
              <Text style={styles.stepSubtitle}>You can safely add your Visa or Mastercard, or skip this for now.</Text>

              {/* Card Mockup */}
              <View style={{ position: 'relative', height: 200, marginBottom: 24, perspective: 1000 } as any}>
                <Animated.View style={[styles.cardMockup, { transform: [{ rotateY: frontInterpolate }], position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backfaceVisibility: 'hidden' }]}>
                  <View style={styles.cardHeader}>
                    <FontAwesome5 name={cardNumber.startsWith('4') ? 'cc-visa' : cardNumber.startsWith('5') ? 'cc-mastercard' : 'credit-card'} size={32} color="#FFF" />
                  </View>
                  <Text style={styles.cardNumberDisplay}>{cardNumber || '•••• •••• •••• ••••'}</Text>
                  <View style={styles.cardFooter}>
                    <View><Text style={styles.cardLabel}>Card Holder</Text><Text style={styles.cardValue}>{cardName || 'YOUR NAME'}</Text></View>
                    <View><Text style={styles.cardLabel}>Expires</Text><Text style={styles.cardValue}>{expiry || 'MM/YY'}</Text></View>
                  </View>
                </Animated.View>

                <Animated.View style={[styles.cardMockup, { transform: [{ rotateY: backInterpolate }], position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backfaceVisibility: 'hidden', padding: 0, justifyContent: 'flex-start' }]}>
                  <View style={{ backgroundColor: '#000', height: 40, width: '100%', marginTop: 24 }} />
                  <View style={{ padding: 24 }}><View style={{ backgroundColor: '#FFF', padding: 8, borderRadius: 4, alignItems: 'flex-end' }}><Text style={{ color: '#000', fontWeight: 'bold' }}>{cvv || '•••'}</Text></View></View>
                </Animated.View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cardholder Name</Text>
                <TextInput style={styles.input} placeholder="Name on card" placeholderTextColor={colors.textSecondary} value={cardName} onChangeText={setCardName} autoCapitalize="words" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Card Number</Text>
                <TextInput style={styles.input} placeholder="0000 0000 0000 0000" placeholderTextColor={colors.textSecondary} value={cardNumber} onChangeText={formatCardNumber} keyboardType="numeric" maxLength={19} />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Expiry</Text>
                  <TextInput style={styles.input} placeholder="MM/YY" placeholderTextColor={colors.textSecondary} value={expiry} onChangeText={formatExpiry} keyboardType="numeric" maxLength={5} />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>CVV</Text>
                  <TextInput style={styles.input} placeholder="123" placeholderTextColor={colors.textSecondary} value={cvv} onChangeText={setCvv} keyboardType="numeric" maxLength={4} secureTextEntry onFocus={() => flipCard(true)} onBlur={() => flipCard(false)} />
                </View>
              </View>

              <Pressable style={[styles.primaryButton, { marginBottom: 12 }]} onPress={saveCardAndFinish} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Save & Finish</Text>}
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={skipCardAndFinish} disabled={saving}>
                <Text style={styles.secondaryButtonText}>Skip for now</Text>
              </Pressable>

            </Animatable.View>
          )}

          {/* STEP 5: Thanks Page */}
          {step === 5 && (
            <Animatable.View animation="zoomIn" style={styles.thanksContainer}>
              <View style={styles.checkCircle}>
                <Feather name="check" size={60} color="#FFF" />
              </View>
              <Text style={styles.thanksTitle}>You're all set!</Text>
              <Text style={styles.thanksSubtitle}>Your profile has been updated. Redirecting you to the dashboard...</Text>
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
            </Animatable.View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      <ImageCropperModal
        visible={cropperVisible}
        imageUri={selectedImageUri}
        onClose={() => setCropperVisible(false)}
        onConfirm={(uri) => {
          setCropperVisible(false);
          uploadImage(uri);
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12, flexGrow: 1 },
  stepContainer: { flex: 1, paddingTop: 20 },
  stepTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  stepSubtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 32 },
  
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { position: 'relative' },
  avatarImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: colors.primary },
  avatarMock: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed' },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, fontSize: 16, color: colors.text },
  row: { flexDirection: 'row' },
  
  primaryButton: { backgroundColor: '#054687', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 12, shadowColor: '#054687', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  
  cardMockup: { backgroundColor: '#0B308D', borderRadius: 20, padding: 24, height: 200, justifyContent: 'space-between', shadowColor: '#0B308D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumberDisplay: { color: '#FFF', fontSize: 24, letterSpacing: 2, fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 },
  cardValue: { color: '#FFF', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  
  thanksContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  checkCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  thanksTitle: { fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  thanksSubtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32, lineHeight: 24 }
});
