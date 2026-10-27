import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { SupportedLanguage } from '../constants/translations';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme, colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { signOut } = useAuth();

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
            headers: { Authorization: `Bearer ${token}` },
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
    await signOut();
    router.replace('/login');
  };

  const displayName = profileData?.first_name
    ? `${profileData.first_name} ${profileData.last_name || ''}`.trim()
    : t('settings.unknownUser');
  const handle =
    profileData?.custom_id ||
    (profileData?.first_name && profileData?.last_name
      ? `@${profileData.first_name.toLowerCase()}${profileData.last_name.toLowerCase()}`.replace(
          /\s+/g,
          ''
        )
      : '@commercant');

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setShowLanguageModal(false);
  };

  const languageLabels = {
    en: 'English',
    fr: 'Français',
    ar: 'العربية',
  };

  const MenuItem = ({
    icon,
    iconColor = colors.primary,
    iconBg,
    title,
    subtitle,
    isLink = true,
    rightComponent,
    onPress,
  }: any) => (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.itemPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuItemLeft}>
        <View
          style={[
            styles.menuIconContainer,
            {
              backgroundColor:
                iconBg ||
                (isDarkMode ? 'rgba(37, 99, 235, 0.18)' : '#EFF6FF'),
            },
          ]}
        >
          <Feather name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.menuTextGroup}>
          <Text
            style={[
              styles.menuItemText,
              { color: isDarkMode ? '#F8FAFC' : '#0F172A' },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.menuItemSubtitle,
                { color: isDarkMode ? '#94A3B8' : '#64748B' },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightComponent ? (
        rightComponent
      ) : isLink ? (
        <View
          style={[
            styles.chevronPill,
            { backgroundColor: isDarkMode ? '#1F2736' : '#F1F5F9' },
          ]}
        >
          <Feather
            name="chevron-right"
            size={16}
            color={isDarkMode ? '#94A3B8' : '#64748B'}
          />
        </View>
      ) : null}
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDarkMode ? '#0A0E17' : '#F8FAFC' },
      ]}
      edges={['top', 'left', 'right']}
    >
      <PageHeader
        title={t('settings.title')}
        showBackButton
        fallbackRoute="/(tabs)/dashboard"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. ACCOUNT PROFILE CARD (IMAGE 4 STYLE) ─── */}
        <Text style={[styles.sectionHeading, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
          COMPTE
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.accountCard,
            {
              backgroundColor: isDarkMode ? '#141A26' : '#FFFFFF',
              borderColor: isDarkMode ? '#232D3F' : '#E2E8F0',
            },
            pressed && styles.itemPressed,
          ]}
          onPress={() => router.push('/edit-profile')}
        >
          <View style={styles.avatarContainer}>
            {loading ? (
              <View style={styles.avatarMock}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : profileData?.avatar_url ? (
              <Image
                source={{ uri: `http://localhost:3000${profileData.avatar_url}` }}
                style={styles.avatarImage}
              />
            ) : (
              <View
                style={[
                  styles.avatarMock,
                  { backgroundColor: isDarkMode ? '#1E3A8A' : '#054687' },
                ]}
              >
                <Feather name="user" size={24} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.accountOnlineDot} />
          </View>
          <View style={styles.accountInfo}>
            <Text
              style={[
                styles.accountName,
                { color: isDarkMode ? '#F8FAFC' : '#0F172A' },
              ]}
            >
              {loading ? t('settings.loading') : displayName}
            </Text>
            <Text
              style={[
                styles.accountHandle,
                { color: isDarkMode ? '#94A3B8' : '#64748B' },
              ]}
            >
              {loading ? '' : handle}
            </Text>
          </View>
          <View
            style={[
              styles.chevronPill,
              { backgroundColor: isDarkMode ? '#1F2736' : '#F1F5F9' },
            ]}
          >
            <Feather
              name="chevron-right"
              size={18}
              color={isDarkMode ? '#94A3B8' : '#64748B'}
            />
          </View>
        </Pressable>

        {/* ─── 2. PREFERENCES (IMAGE 3 & 4 GROUPED CARD) ─── */}
        <Text style={[styles.sectionHeading, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
          PRÉFÉRENCES
        </Text>
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDarkMode ? '#141A26' : '#FFFFFF',
              borderColor: isDarkMode ? '#232D3F' : '#E2E8F0',
            },
          ]}
        >
          <MenuItem
            icon="bell"
            iconColor="#3B82F6"
            iconBg={isDarkMode ? 'rgba(59, 130, 246, 0.18)' : '#EFF6FF'}
            title={t('settings.pauseNotifications')}
            isLink={false}
            rightComponent={
              <Switch
                trackColor={{ false: colors.border, true: '#10B981' }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor={colors.border}
                onValueChange={setPauseNotifications}
                value={pauseNotifications}
              />
            }
          />
          <View
            style={[
              styles.divider,
              { backgroundColor: isDarkMode ? '#1F2736' : '#F1F5F9' },
            ]}
          />
          <MenuItem
            icon="moon"
            iconColor="#8B5CF6"
            iconBg={isDarkMode ? 'rgba(139, 92, 246, 0.18)' : '#F5F3FF'}
            title={t('settings.darkMode')}
            isLink={false}
            rightComponent={
              <Switch
                trackColor={{ false: colors.border, true: '#054687' }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor={colors.border}
                onValueChange={toggleDarkMode}
                value={isDarkMode}
              />
            }
          />
          <View
            style={[
              styles.divider,
              { backgroundColor: isDarkMode ? '#1F2736' : '#F1F5F9' },
            ]}
          />
          <MenuItem
            icon="globe"
            iconColor="#10B981"
            iconBg={isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5'}
            title={t('settings.language')}
            rightComponent={
              <View style={styles.rightValueRow}>
                <Text
                  style={[
                    styles.rightValueText,
                    { color: isDarkMode ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {languageLabels[language]}
                </Text>
                <Feather
                  name="chevron-right"
                  size={16}
                  color={isDarkMode ? '#94A3B8' : '#64748B'}
                />
              </View>
            }
            onPress={() => setShowLanguageModal(true)}
          />
        </View>

        {/* ─── 3. ASSISTANCE & SERVICES ─── */}
        <Text style={[styles.sectionHeading, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
          ASSISTANCE & ABONNEMENT
        </Text>
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDarkMode ? '#141A26' : '#FFFFFF',
              borderColor: isDarkMode ? '#232D3F' : '#E2E8F0',
            },
          ]}
        >
          <MenuItem
            icon="star"
            iconColor="#F59E0B"
            iconBg={isDarkMode ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7'}
            title={t('settings.mySubscription')}
            onPress={() => router.push('/subscription')}
          />
          <View
            style={[
              styles.divider,
              { backgroundColor: isDarkMode ? '#1F2736' : '#F1F5F9' },
            ]}
          />
          <MenuItem
            icon="help-circle"
            iconColor="#06B6D4"
            iconBg={isDarkMode ? 'rgba(6, 182, 212, 0.18)' : '#ECFEFF'}
            title={t('settings.faq')}
          />
          <View
            style={[
              styles.divider,
              { backgroundColor: isDarkMode ? '#1F2736' : '#F1F5F9' },
            ]}
          />
          <MenuItem
            icon="shield"
            iconColor="#6366F1"
            iconBg={isDarkMode ? 'rgba(99, 102, 241, 0.18)' : '#EEF2FF'}
            title={t('settings.userPolicy')}
          />
        </View>

        {/* ─── 4. LOG OUT BUTTON ─── */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutCard,
            {
              backgroundColor: isDarkMode ? '#141A26' : '#FFFFFF',
              borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#FEE2E2',
            },
            pressed && styles.itemPressed,
          ]}
          onPress={() => setShowLogoutConfirm(true)}
        >
          <View
            style={[
              styles.logoutIconCircle,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(239, 68, 68, 0.18)'
                  : '#FEF2F2',
              },
            ]}
          >
            <Feather name="log-out" size={18} color="#EF4444" />
          </View>
          <Text style={styles.logoutText}>{t('settings.logOut')}</Text>
        </Pressable>
      </ScrollView>

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: isDarkMode ? '#181E2B' : '#FFFFFF',
                borderColor: isDarkMode ? '#2B374C' : '#E2E8F0',
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: isDarkMode ? '#F8FAFC' : '#0F172A' },
              ]}
            >
              {t('settings.selectLanguage')}
            </Text>
            {Object.entries(languageLabels).map(([code, label]) => (
              <Pressable
                key={code}
                style={[
                  styles.langOption,
                  {
                    borderBottomColor: isDarkMode ? '#2B374C' : '#F1F5F9',
                  },
                ]}
                onPress={() => handleLanguageChange(code as SupportedLanguage)}
              >
                <Text
                  style={[
                    styles.langText,
                    { color: isDarkMode ? '#F8FAFC' : '#0F172A' },
                    language === code && {
                      color: '#054687',
                      fontWeight: 'bold',
                    },
                  ]}
                >
                  {label}
                </Text>
                {language === code && (
                  <Feather name="check" size={20} color="#054687" />
                )}
              </Pressable>
            ))}
            <Pressable
              style={styles.modalCancel}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalCancelText}>{t('settings.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={showLogoutConfirm}
        title={t('settings.logOut')}
        message="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmText="Oui"
        cancelText="Non"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 60,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 14,
    paddingLeft: 4,
  },

  // ─── Account Profile Card ───
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 6,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 20,
  },
  avatarMock: {
    width: 52,
    height: 52,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },
  accountHandle: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ─── Grouped Section Card ───
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextGroup: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuItemSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  chevronPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rightValueText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },

  // ─── Logout Card ───
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    paddingVertical: 15,
    marginTop: 18,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EF4444',
  },

  // ─── Modal ───
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  langText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalCancel: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },

  itemPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
