import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Switch, ScrollView, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../constants/translations';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme, colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  const [pauseNotifications, setPauseNotifications] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const isDarkMode = theme === 'dark';
  
  const toggleDarkMode = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  useFocusEffect(
    useCallback(() => {
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
          
          if (res.ok) {
            const data = await res.json();
            setProfileData(data);
          }
        } catch (err) {
          console.error('Failed to fetch profile', err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchProfile();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      router.replace('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const styles = useMemo(() => getStyles(colors), [colors]);

  const MenuItem = ({ icon, title, isLink = true, rightComponent, onPress }: any) => (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Feather name={icon} size={20} color={colors.textSecondary} style={styles.menuIcon} />
        <Text style={styles.menuItemText}>{title}</Text>
      </View>
      {rightComponent ? rightComponent : (isLink && <Feather name="chevron-right" size={20} color={colors.textSecondary} />)}
    </Pressable>
  );

  const displayName = profileData?.first_name 
    ? `${profileData.first_name} ${profileData.last_name || ''}`.trim() 
    : t('settings.unknownUser');
  const handle = profileData?.custom_id || (profileData?.first_name && profileData?.last_name 
    ? `@${profileData.first_name.toLowerCase()}${profileData.last_name.toLowerCase()}`.replace(/\s+/g, '') 
    : '@newuser');

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setShowLanguageModal(false);
  };

  const languageLabels = {
    en: 'English',
    fr: 'Français',
    ar: 'العربية'
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <PageHeader title={t('settings.title')} showBackButton />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Account Profile Card */}
        <Pressable style={styles.accountCard} onPress={() => router.push('/edit-profile')}>
          <View style={styles.accountCardContent}>
            <View style={styles.avatarContainer}>
              {loading ? (
                <View style={styles.avatarMock}><ActivityIndicator color="#fff" /></View>
              ) : profileData?.avatar_url ? (
                <Image source={{ uri: `http://localhost:3000${profileData.avatar_url}` }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarMock}><Feather name="user" size={24} color="#FFFFFF" /></View>
              )}
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{loading ? t('settings.loading') : displayName}</Text>
              <Text style={styles.accountHandle}>{loading ? '' : handle}</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </Pressable>

        {/* Section 1 */}
        <View style={styles.sectionGroup}>
          <MenuItem 
            icon="bell-off" 
            title={t('settings.pauseNotifications')} 
            rightComponent={
              <Switch
                trackColor={{ false: colors.border, true: '#00C9FF' }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor={colors.border}
                onValueChange={setPauseNotifications}
                value={pauseNotifications}
              />
            } 
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="moon" 
            title={t('settings.darkMode')} 
            rightComponent={
              <Switch
                trackColor={{ false: colors.border, true: '#00C9FF' }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor={colors.border}
                onValueChange={toggleDarkMode}
                value={isDarkMode}
              />
            } 
          />
        </View>

        {/* Section 2 */}
        <View style={styles.sectionGroup}>
          <MenuItem 
            icon="globe" 
            title={t('settings.language')} 
            rightComponent={<Text style={{ color: colors.textSecondary }}>{languageLabels[language]}</Text>}
            onPress={() => setShowLanguageModal(true)} 
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="star" 
            title={t('settings.mySubscription')} 
            onPress={() => router.push('/subscription')}
          />
          <View style={styles.divider} />
          <MenuItem icon="help-circle" title={t('settings.faq')} />
          <View style={styles.divider} />
          <MenuItem icon="info" title={t('settings.termsOfService')} />
          <View style={styles.divider} />
          <MenuItem icon="shield" title={t('settings.userPolicy')} />
        </View>

        {/* Log Out Button */}
        <Pressable style={styles.logoutButton} onPress={() => setShowLogoutConfirm(true)}>
          <Feather name="log-out" size={20} color={colors.danger} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>{t('settings.logOut')}</Text>
        </Pressable>
      </ScrollView>

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
            {Object.entries(languageLabels).map(([code, label]) => (
              <Pressable 
                key={code} 
                style={styles.langOption} 
                onPress={() => handleLanguageChange(code as SupportedLanguage)}
              >
                <Text style={[styles.langText, language === code && { color: colors.primary, fontWeight: 'bold' }]}>
                  {label}
                </Text>
                {language === code && <Feather name="check" size={20} color={colors.primary} />}
              </Pressable>
            ))}
            <Pressable style={styles.modalCancel} onPress={() => setShowLanguageModal(false)}>
              <Text style={styles.modalCancelText}>{t('settings.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      )}
      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={showLogoutConfirm}
        title={t('settings.logOut')}
        message="Are you sure you want to log out?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  accountCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarMock: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  accountHandle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionGroup: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: 24,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 56,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 30,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContainer: {
    width: '80%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  langText: {
    fontSize: 16,
    color: colors.text,
  },
  modalCancel: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
