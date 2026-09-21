import { useRouter } from 'expo-router';
import { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Pressable, TextInput, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Text, Image, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import { DateBox } from '../components/ui/date-box';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ImageCropperModal } from '../components/ImageCropperModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { useAppAlert } from '../context/AlertContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { showAlert } = useAppAlert();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [initialState, setInitialState] = useState<any>(null);
  const [cropperVisible, setCropperVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const phoneInputRef = useRef<TextInput>(null);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const res = await fetch('http://localhost:3000/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        let parsedBirthday = '';
        if (data.birthday) {
          const dateObj = new Date(data.birthday);
          if (!isNaN(dateObj.getTime())) {
            parsedBirthday = dateObj.toISOString().split('T')[0];
          } else {
             parsedBirthday = data.birthday || '';
          }
          setBirthday(parsedBirthday);
        }
        setPhoneNumber(data.phone_number || '');
        if (data.avatar_url) {
          setAvatarUrl(`http://localhost:3000${data.avatar_url}`);
        }
        
        setInitialState({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          birthday: parsedBirthday,
          phoneNumber: data.phone_number || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const hasUnsavedChanges = useMemo(() => {
    if (!initialState) return false;
    return firstName !== initialState.firstName ||
           lastName !== initialState.lastName ||
           birthday !== initialState.birthday ||
           phoneNumber !== initialState.phoneNumber;
  }, [firstName, lastName, birthday, phoneNumber, initialState]);

  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/'); // Fallback to home if there is no history
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
      return true;
    }
    navigateBack();
    return true; // Return true to indicate we handled the back button
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [hasUnsavedChanges]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false, // Using our custom cropper instead
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
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showAlert('error', "Error", "You are not fully authenticated.");
        setUploadingImage(false);
        return;
      }

      let formData = new FormData();
      
      if (Platform.OS === 'web') {
        // Web requires Blob instead of uri object
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('avatar', blob, 'profile.jpg');
      } else {
        // Mobile requires the specific object format
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
        showAlert('success', "Success", "Profile image updated successfully");
      } else {
        showAlert('error', "Error", data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showAlert('error', "Error", "Could not upload image. Ensure backend is running and accepts multipart data.");
    } finally {
      setUploadingImage(false);
    }
  };

  const validateInputs = () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    if (firstName && !nameRegex.test(firstName)) {
      showAlert('error', "Validation Error", "First name must contain only letters.");
      return false;
    }
    if (lastName && !nameRegex.test(lastName)) {
      showAlert('error', "Validation Error", "Last name must contain only letters.");
      return false;
    }

    const phoneRegex = /^(?:\+212|0)[5-7]\d{8}$/;
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
      showAlert('error', "Validation Error", "Phone number must be a valid Moroccan number (e.g. 0612345678).");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showAlert('error', "Error", "You are not fully authenticated. Please log in again.");
        setSaving(false);
        return;
      }
      
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
      
      if (res.ok) {
        showAlert('success', "Success", "Profile updated successfully");
        router.back();
      } else {
        const data = await res.json();
        showAlert('error', "Error", data.message || "Failed to update profile");
      }
    } catch (err) {
      showAlert('error', "Error", "Could not reach server");
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(() => getStyles(colors), [colors]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <PageHeader title={t('editProfile.title')} showBackButton onBack={handleBack} />

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarSection}>
            <Pressable style={styles.avatarContainer} onPress={pickImage} disabled={uploadingImage}>
              {uploadingImage ? (
                <View style={styles.avatarMock}>
                   <ActivityIndicator color="#FFF" />
                </View>
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarMock}>
                  <Feather name="user" size={40} color="#FFFFFF" />
                </View>
              )}
              <View style={styles.editAvatarBtn}>
                <Feather name="camera" size={16} color="#FFFFFF" />
              </View>
              </Pressable>
              <Text style={styles.changePhotoText}>{t('editProfile.changePhoto')}</Text>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('editProfile.firstName')}</Text>
                <TextInput 
                  style={styles.input} 
                  value={firstName} 
                  onChangeText={setFirstName} 
                  placeholder={t('editProfile.firstName')}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('editProfile.lastName')}</Text>
                <TextInput 
                  style={styles.input} 
                  value={lastName} 
                  onChangeText={setLastName} 
                  placeholder={t('editProfile.lastName')}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('editProfile.birthday')}</Text>
                <DateBox 
                value={birthday} 
                onChange={setBirthday} 
                placeholder="YYYY-MM-DD"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput 
                ref={phoneInputRef}
                  style={styles.input} 
                  value={phoneNumber} 
                  onChangeText={setPhoneNumber} 
                  placeholder="06..."
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <Pressable 
                style={({ pressed }) => [styles.saveButton, { opacity: pressed || saving ? 0.8 : 1 }]}
                onPress={handleSave}
                disabled={saving || uploadingImage}
              >
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>{t('editProfile.saveChanges')}</Text>}
              </Pressable>
            </View>
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
      
      <ConfirmDialog
        visible={showConfirmDialog}
        title={t('confirm.discardTitle')}
        message={t('confirm.discardMessage')}
        confirmText={t('confirm.discard')}
        cancelText={t('confirm.dontLeave')}
        onConfirm={() => {
          setShowConfirmDialog(false);
          navigateBack();
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  scrollContainer: { 
    flexGrow: 1, 
    paddingHorizontal: 20,
    padding: 24, 
    paddingBottom: 40 
  },
  avatarSection: { 
    alignItems: 'center', 
    marginBottom: 32 
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 100, 
    height: 100, 
    borderRadius: 50,
    borderWidth: 2, 
    borderColor: colors.surface,
  },
  avatarMock: {
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: colors.primary,
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2, 
    borderColor: colors.surface,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 2,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  changePhotoText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: colors.primary 
  },
  formContainer: { 
    backgroundColor: colors.surface, 
    borderRadius: 24, 
    padding: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 12, 
    elevation: 3, 
    marginBottom: 32 
  },
  inputGroup: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: colors.text, 
    marginBottom: 8 
  },
  input: { 
    backgroundColor: colors.background, 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    fontSize: 16, 
    color: colors.text 
  },
  saveButton: { 
    backgroundColor: colors.primary, 
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 8 
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
});
