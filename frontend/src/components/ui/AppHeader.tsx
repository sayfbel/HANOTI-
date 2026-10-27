import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { SupportedLanguage } from '@/constants/translations';

export interface AppHeaderProps {
  /** 'tab' for top-level main screens (brand + status pill), 'subpage' for child pages (back button) */
  variant?: 'tab' | 'subpage';

  /** Page title (e.g. "Clients", "Actions Rapides", "Paramètres") */
  title?: string;
  /** Short descriptive subtitle */
  subtitle?: string;
  /** Badge text next to title (e.g. count "3") */
  badgeText?: string | number;

  /** Show the brand logo - defaults to true for 'tab' */
  showBrand?: boolean;
  /** Show the "Boutique Ouverte" pill - defaults to true for 'tab' */
  showStatusPill?: boolean;

  /** For subpage: show back button */
  showBackButton?: boolean;
  onBack?: () => void;
  fallbackRoute?: string;

  /** Quick action icons on the right */
  showThemeToggle?: boolean;
  showLanguageSwitch?: boolean;
  showNotifications?: boolean; // Deprecated, kept for backward compatibility

  /** Action button on the right of title (e.g. "+ Nouveau Client") */
  rightButton?: {
    label: string;
    icon?: 'plus' | 'edit-2' | 'download' | 'share-2';
    onPress: () => void;
  };

  /** Custom right component */
  rightActions?: React.ReactNode;

  /** Optional component below the header (e.g. search bar, filter tabs) */
  children?: React.ReactNode;
}

export function AppHeader({
  variant = 'tab',
  title,
  subtitle,
  badgeText,
  showBrand,
  showStatusPill,
  showBackButton,
  onBack,
  fallbackRoute,
  showThemeToggle,
  showLanguageSwitch,
  showNotifications,
  rightButton,
  rightActions,
  children,
}: AppHeaderProps) {
  const router = useRouter();
  const { colors, theme, setTheme } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const isDark = theme === 'dark';

  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const isTab = variant === 'tab';
  const shouldShowBrand = showBrand ?? isTab;
  const shouldShowStatusPill = showStatusPill ?? isTab;
  const shouldShowBack = showBackButton ?? (!isTab);
  const shouldShowTheme = showThemeToggle ?? true;
  const shouldShowLang = showLanguageSwitch ?? true;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace((fallbackRoute || '/(tabs)/dashboard') as any);
    }
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleSelectLanguage = async (lang: SupportedLanguage) => {
    await setLanguage(lang);
    setLanguageModalVisible(false);
  };

  const languagesList: {
    code: SupportedLanguage;
    label: string;
    nativeName: string;
    flag: string;
  }[] = [
    { code: 'ar', label: 'العربية', nativeName: 'Arabic (المغرب)', flag: '🇲🇦' },
    { code: 'fr', label: 'Français', nativeName: 'French', flag: '🇫🇷' },
    { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  ];

  const currentLangDisplay =
    language === 'ar' ? 'عربي' : language === 'fr' ? 'FR' : 'EN';

  return (
    <View
      style={[
        styles.headerWrapper,
        {
          backgroundColor: isDark ? '#0A0E17' : '#F8FAFC',
          borderBottomColor: isDark ? '#1C2433' : '#F1F5F9',
        },
      ]}
    >
      <View style={styles.headerContent}>
        {/* ─── ROW 1: BRAND BAR / TOP NAV ─── */}
        <View style={[styles.topRow, isRTL && { flexDirection: 'row-reverse' }]}>
          {/* Left Side */}
          {shouldShowBack ? (
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                {
                  backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                  borderColor: isDark ? '#232D3F' : '#E2E8F0',
                },
                pressed && styles.buttonPressed,
              ]}
              onPress={handleBack}
              accessibilityLabel={t('header.back')}
            >
              <Feather
                name={isRTL ? 'arrow-right' : 'arrow-left'}
                size={20}
                color={isDark ? '#F8FAFC' : '#0F172A'}
              />
            </Pressable>
          ) : (
            <View style={[styles.brandGroup, isRTL && { flexDirection: 'row-reverse' }]}>
              {shouldShowBrand && (
                <Pressable
                  onPress={() => router.push('/(tabs)/dashboard')}
                  style={({ pressed }) => [
                    styles.logoPressable,
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityLabel="Accueil Hanoti+"
                >
                  <Image
                    source={require('../../../assets/logo/LOGO_PNG.png')}
                    style={styles.brandLogoImage}
                    resizeMode="contain"
                  />
                </Pressable>
              )}

              {shouldShowStatusPill && (
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16, 185, 129, 0.16)'
                        : '#DCFCE7',
                      borderColor: isDark
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(16, 185, 129, 0.25)',
                    },
                    isRTL && { flexDirection: 'row-reverse' },
                  ]}
                >
                  <View style={styles.statusDotPulse}>
                    <View style={styles.statusDot} />
                  </View>
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: isDark ? '#34D399' : '#15803D' },
                    ]}
                  >
                    {t('header.storeOpen')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Subpage Title if inline */}
          {!isTab && title && (
            <View style={[styles.subpageInlineTitle, isRTL && { alignItems: 'flex-end' }]}>
              <Text
                style={[
                  styles.subpageTitleText,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                  isRTL && { textAlign: 'right' },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>
          )}

          {/* Right Side Icons: Theme Toggle + Language Switcher */}
          <View style={[styles.rightActionsRow, isRTL && { flexDirection: 'row-reverse' }]}>
            {/* 1. Theme Switcher (Dark / Light) */}
            {shouldShowTheme && (
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                    borderColor: isDark ? '#232D3F' : '#E2E8F0',
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={toggleTheme}
                accessibilityLabel="Basculer thème"
              >
                <Feather
                  name={isDark ? 'sun' : 'moon'}
                  size={17}
                  color={isDark ? '#FBBF24' : '#054687'}
                />
              </Pressable>
            )}

            {/* 2. Language Switcher Button (FR / AR / EN Pill) */}
            {shouldShowLang && (
              <Pressable
                style={({ pressed }) => [
                  styles.langButton,
                  {
                    backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                    borderColor: isDark ? '#232D3F' : '#E2E8F0',
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setLanguageModalVisible(true)}
                accessibilityLabel={t('header.selectLanguage')}
              >
                <Feather
                  name="globe"
                  size={15}
                  color={isDark ? '#38BDF8' : '#054687'}
                />
                <Text
                  style={[
                    styles.langButtonText,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {currentLangDisplay}
                </Text>
              </Pressable>
            )}

            {rightActions}
          </View>
        </View>

        {/* ─── ROW 2: TITLE & ACTION BUTTON (FOR TABS) ─── */}
        {isTab && (title || rightButton) && (
          <View style={[styles.titleRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.titleTextGroup, isRTL && { alignItems: 'flex-end' }]}>
              <View style={[styles.titleHeadingRow, isRTL && { flexDirection: 'row-reverse' }]}>
                <Text
                  style={[
                    styles.mainTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                    isRTL && { textAlign: 'right' },
                  ]}
                >
                  {title}
                </Text>
                {badgeText !== undefined && (
                  <View
                    style={[
                      styles.countBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(37, 99, 235, 0.2)'
                          : '#EFF6FF',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countBadgeText,
                        { color: isDark ? '#60A5FA' : '#054687' },
                      ]}
                    >
                      {badgeText}
                    </Text>
                  </View>
                )}
              </View>

              {subtitle ? (
                <Text
                  style={[
                    styles.mainSubtitle,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                    isRTL && { textAlign: 'right' },
                  ]}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>

            {rightButton && (
              <Pressable
                style={({ pressed }) => [
                  styles.primaryActionButton,
                  isRTL && { flexDirection: 'row-reverse' },
                  pressed && styles.buttonPressed,
                ]}
                onPress={rightButton.onPress}
              >
                {rightButton.icon && (
                  <Feather name={rightButton.icon} size={15} color="#FFFFFF" />
                )}
                <Text style={styles.primaryActionButtonText}>
                  {rightButton.label}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ─── OPTIONAL CHILDREN (SEARCH, TABS, ETC.) ─── */}
        {children && <View style={styles.childrenContainer}>{children}</View>}
      </View>

      {/* ─── MODAL: LANGUAGE PICKER ─── */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setLanguageModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                borderColor: isDark ? '#232D3F' : '#E2E8F0',
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.modalHeaderTitleGroup, isRTL && { flexDirection: 'row-reverse' }]}>
                <View
                  style={[
                    styles.modalIconSquircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(37, 99, 235, 0.2)'
                        : '#EFF6FF',
                    },
                  ]}
                >
                  <Feather
                    name="globe"
                    size={20}
                    color={isDark ? '#38BDF8' : '#054687'}
                  />
                </View>
                <View style={isRTL && { alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                  >
                    {t('header.chooseLanguage')}
                  </Text>
                  <Text
                    style={[
                      styles.modalSubtitle,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    {t('header.languageSubtitle')}
                  </Text>
                </View>
              </View>

              <Pressable
                style={[
                  styles.modalCloseBtn,
                  { backgroundColor: isDark ? '#1F2736' : '#F1F5F9' },
                ]}
                onPress={() => setLanguageModalVisible(false)}
              >
                <Feather
                  name="x"
                  size={16}
                  color={isDark ? '#94A3B8' : '#64748B'}
                />
              </Pressable>
            </View>

            {/* Language Options */}
            <View style={styles.langListContainer}>
              {languagesList.map((item) => {
                const isSelected = language === item.code;
                return (
                  <Pressable
                    key={item.code}
                    style={({ pressed }) => [
                      styles.langOptionCard,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(5, 70, 135, 0.22)'
                            : '#EFF6FF'
                          : isDark
                          ? '#1A2333'
                          : '#F8FAFC',
                        borderColor: isSelected
                          ? '#054687'
                          : isDark
                          ? '#2A364F'
                          : '#EDF2F7',
                      },
                      isRTL && { flexDirection: 'row-reverse' },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => handleSelectLanguage(item.code)}
                  >
                    <View style={[styles.langOptionLeft, isRTL && { flexDirection: 'row-reverse' }]}>
                      <Text style={styles.langFlagText}>{item.flag}</Text>
                      <View style={isRTL && { alignItems: 'flex-end' }}>
                        <Text
                          style={[
                            styles.langOptionLabel,
                            {
                              color: isSelected
                                ? isDark
                                  ? '#60A5FA'
                                  : '#054687'
                                : isDark
                                ? '#F8FAFC'
                                : '#0F172A',
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.langOptionNative,
                            { color: isDark ? '#94A3B8' : '#64748B' },
                          ]}
                        >
                          {item.nativeName}
                        </Text>
                      </View>
                    </View>

                    {isSelected ? (
                      <View style={styles.selectedCheckCircle}>
                        <Feather name="check" size={14} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.unselectedRadioCircle,
                          { borderColor: isDark ? '#3E4D69' : '#CBD5E1' },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Modal Footer */}
            <Pressable
              style={styles.modalDismissBtn}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.modalDismissBtnText}>{t('common.close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 50,
  },
  headerContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },

  // ─── Top Row ───
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    gap: 8,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  logoPressable: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  brandLogoImage: {
    width: 104,
    height: 32,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  statusDotPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ─── Subpage Inline Title ───
  subpageInlineTitle: {
    flex: 1,
    paddingHorizontal: 8,
  },
  subpageTitleText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // ─── Buttons ───
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  langButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ─── Title Row ───
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 4,
    gap: 12,
  },
  titleTextGroup: {
    flex: 1,
  },
  titleHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  mainSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },

  // ─── Primary Action Button ───
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#054687',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
    shadowColor: '#054687',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ─── Children ───
  childrenContainer: {
    marginTop: 8,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  // ─── Modal Styles ───
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalIconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langListContainer: {
    gap: 10,
    marginVertical: 6,
  },
  langOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  langOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  langFlagText: {
    fontSize: 24,
  },
  langOptionLabel: {
    fontSize: 15,
  },
  langOptionNative: {
    fontSize: 12,
    marginTop: 1,
  },
  selectedCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#054687',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  modalDismissBtn: {
    marginTop: 18,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#054687',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDismissBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
