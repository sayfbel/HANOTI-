import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSegments } from 'expo-router';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';

export type AlertType = 'success' | 'error' | 'info';

interface AlertContextType {
  showAlert: (type: AlertType, title: string, message?: string) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const DURATION_MS = 3800;

interface AlertToastProps {
  visible: boolean;
  alertType: AlertType;
  title: string;
  message: string;
  hideAlert: () => void;
  progressAnim: Animated.Value;
}

function AlertToast({
  visible,
  alertType,
  title,
  message,
  hideAlert,
  progressAnim,
}: AlertToastProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { language, isRTL } = useLanguage();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  let inTabs = false;
  try {
    const segments = useSegments();
    inTabs = Boolean(segments && segments[0] === '(tabs)');
  } catch {
    inTabs = false;
  }

  if (!visible) return null;

  const getStatusConfig = () => {
    switch (alertType) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          iconColor: '#10B981',
          bgPastel: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
          borderPastel: isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.28)',
          cardBorder: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.22)',
          accentColor: '#10B981',
          glowColor: '#10B981',
          badgeText: language === 'ar' ? 'نجاح' : 'Succès',
          badgeBg: isDark ? 'rgba(16, 185, 129, 0.22)' : '#D1FAE5',
          badgeTextColor: isDark ? '#34D399' : '#065F46',
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          iconColor: '#EF4444',
          bgPastel: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2',
          borderPastel: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.28)',
          cardBorder: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.22)',
          accentColor: '#EF4444',
          glowColor: '#EF4444',
          badgeText: language === 'ar' ? 'خطأ' : 'Erreur',
          badgeBg: isDark ? 'rgba(239, 68, 68, 0.22)' : '#FEE2E2',
          badgeTextColor: isDark ? '#F87171' : '#991B1B',
        };
      default:
        return {
          icon: 'information-circle' as const,
          iconColor: isDark ? '#60A5FA' : '#054687',
          bgPastel: isDark ? 'rgba(37, 99, 235, 0.16)' : '#EFF6FF',
          borderPastel: isDark ? 'rgba(37, 99, 235, 0.4)' : 'rgba(5, 70, 135, 0.25)',
          cardBorder: isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(5, 70, 135, 0.2)',
          accentColor: isDark ? '#60A5FA' : '#054687',
          glowColor: '#054687',
          badgeText: language === 'ar' ? 'تنبيه' : 'Info',
          badgeBg: isDark ? 'rgba(37, 99, 235, 0.22)' : '#DBEAFE',
          badgeTextColor: isDark ? '#93C5FD' : '#1E40AF',
        };
    }
  };

  const getLocalizedTitle = (raw: string) => {
    if (!raw) return '';
    const lower = raw.trim().toLowerCase();
    if (language === 'ar') {
      if (lower === 'success') return 'تمت العملية بنجاح';
      if (lower === 'error') return 'حدث خطأ';
      if (lower === 'validation error') return 'تنبيه';
      if (lower === 'info') return 'معلومة';
    } else if (language === 'fr') {
      if (lower === 'success') return 'Succès';
      if (lower === 'error') return 'Erreur';
      if (lower === 'validation error') return 'Attention';
    }
    return raw;
  };

  const status = getStatusConfig();
  const cardWidth = Math.min(screenWidth - 32, 430);
  const displayTitle = getLocalizedTitle(title);

  // Bottom placement: floats above tab bar on tab screens, or near bottom edge on child pages
  const bottomOffset = inTabs
    ? (Platform.OS === 'web' ? 82 : insets.bottom + 72)
    : (Platform.OS === 'web' ? 24 : Math.max(insets.bottom + 16, 24));

  return (
    <SafeAreaView
      style={[
        styles.bottomContainer,
        {
          bottom: bottomOffset,
          pointerEvents: 'box-none',
        },
      ]}
      edges={['bottom']}
    >
      <Animatable.View
        animation="slideInUp"
        duration={320}
        style={[
          styles.floatingCard,
          {
            width: cardWidth,
            backgroundColor: isDark ? '#0D1522' : '#FFFFFF',
            borderColor: status.cardBorder,
            shadowColor: isDark ? '#000000' : status.glowColor,
            flexDirection: isRTL ? 'row-reverse' : 'row',
            pointerEvents: 'auto',
          },
        ]}
      >
        {/* Status Icon Squircle */}
        <View
          style={[
            styles.iconSquircle,
            {
              backgroundColor: status.bgPastel,
              borderColor: status.borderPastel,
            },
          ]}
        >
          <Ionicons name={status.icon} size={22} color={status.iconColor} />
        </View>

        {/* Content Details */}
        <View
          style={[
            styles.textGroup,
            { alignItems: isRTL ? 'flex-end' : 'flex-start' },
          ]}
        >
          <View
            style={[
              styles.headerLine,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View
              style={[
                styles.statusPill,
                { backgroundColor: status.badgeBg },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: status.accentColor },
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  { color: status.badgeTextColor },
                ]}
              >
                {status.badgeText}
              </Text>
            </View>

            <Text
              style={[
                styles.title,
                {
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
              numberOfLines={1}
            >
              {displayTitle}
            </Text>
          </View>

          {!!message && (
            <Text
              style={[
                styles.message,
                {
                  color: isDark ? '#94A3B8' : '#64748B',
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
              numberOfLines={2}
            >
              {message}
            </Text>
          )}
        </View>

        {/* Dismiss Close Button */}
        <Pressable
          style={({ pressed }) => [
            styles.closeBtn,
            {
              backgroundColor: isDark ? '#1A2333' : '#F1F5F9',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={hideAlert}
          accessibilityLabel="Fermer la notification"
        >
          <Feather
            name="x"
            size={14}
            color={isDark ? '#94A3B8' : '#64748B'}
          />
        </Pressable>

        {/* Bottom Animated Progress Line */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: status.accentColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </Animatable.View>
    </SafeAreaView>
  );
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>('info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;

  const hideAlert = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    progressAnim.stopAnimation();
    setVisible(false);
  };

  const showAlert = (type: AlertType, alertTitle: string, alertMessage?: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setAlertType(type);
    setTitle(alertTitle);
    setMessage(alertMessage || '');
    setVisible(true);

    // Reset & animate progress bar
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: DURATION_MS,
      useNativeDriver: false,
    }).start();

    timerRef.current = setTimeout(() => {
      setVisible(false);
      timerRef.current = null;
    }, DURATION_MS);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <AlertToast
        visible={visible}
        alertType={alertType}
        title={title}
        message={message}
        hideAlert={hideAlert}
        progressAnim={progressAnim}
      />
    </AlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAppAlert must be used within an AlertProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  floatingCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  iconSquircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textGroup: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  headerLine: {
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  statusDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  message: {
    fontSize: 12,
    lineHeight: 16.5,
    fontWeight: '500',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 1,
  },
});
