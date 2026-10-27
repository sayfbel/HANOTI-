import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAppAlert } from '../../context/AlertContext';
import {
  ActivityItem,
  DashboardStats,
  formatCurrency,
  formatTimeAgo,
} from '@/services/dashboard';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const { user, token, refreshUser } = useAuth();
  const { showAlert } = useAppAlert();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const fetchAllData = useCallback(async () => {
    try {
      const activeToken = token || (await AsyncStorage.getItem('token'));
      if (!activeToken) {
        setLoading(false);
        return;
      }

      // 1. Fetch User Profile
      const profilePromise = fetch('http://localhost:3000/user/profile', {
        headers: { Authorization: `Bearer ${activeToken}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      // 2. Fetch Live Dashboard Data (Stats & Activities)
      const dashboardPromise = fetch('http://localhost:3000/api/dashboard', {
        headers: { Authorization: `Bearer ${activeToken}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const [profileRes, dashboardRes] = await Promise.all([
        profilePromise,
        dashboardPromise,
      ]);

      if (profileRes) {
        setProfileData(profileRes);
      }
      if (dashboardRes && dashboardRes.stats) {
        setDashboardStats(dashboardRes.stats);
        if (Array.isArray(dashboardRes.recentActivities)) {
          setRecentActivities(dashboardRes.recentActivities);
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
      refreshUser();
    }, [fetchAllData, refreshUser])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
    refreshUser();
  };

  if (loading && !profileData && !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const currentUser = profileData || user;
  const displayName = currentUser?.first_name
    ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
    : t('settings.unknownUser');

  const handle =
    currentUser?.custom_id ||
    (currentUser?.first_name && currentUser?.last_name
      ? `@${currentUser.first_name.toLowerCase()}${currentUser.last_name.toLowerCase()}`.replace(
          /\s+/g,
          ''
        )
      : '@commercant');

  const avatarUrl = currentUser?.avatar_url
    ? currentUser.avatar_url.startsWith('http')
      ? currentUser.avatar_url
      : `http://localhost:3000${currentUser.avatar_url}`
    : null;

  const totalCredit = dashboardStats?.totalCredit || 0;
  const totalPaid = dashboardStats?.totalPaid || 0;
  const totalClients = dashboardStats?.totalClients || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        showBrand={true}
        showStatusPill={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#054687']}
            tintColor="#054687"
          />
        }
      >
        {/* User Info Section */}
        <View style={styles.userInfoContainer}>
          <Pressable
            style={styles.avatarContainer}
            onPress={() => router.push('/edit-profile')}
            accessibilityLabel={t('profile.changePhoto')}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarMock}>
                <Feather name="user" size={42} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.editBadge}>
              <Feather name="camera" size={13} color="#FFFFFF" />
            </View>
          </Pressable>

          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{displayName}</Text>
            {currentUser?.custom_id && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#0284C7"
                style={{ marginLeft: 6 }}
              />
            )}
          </View>
          <Text style={styles.handleText}>{handle}</Text>

          <Pressable
            style={styles.editProfilePill}
            onPress={() => router.push('/edit-profile')}
          >
            <Feather name="edit-2" size={13} color={colors.primary} />
            <Text style={styles.editProfilePillText}>{t('profile.editProfile')}</Text>
          </Pressable>
        </View>

        {/* Global Live Stats - Fintech Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletTopRow}>
            <Text style={styles.walletTitle}>{t('profile.totalCredit')}</Text>
            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Live</Text>
            </View>
          </View>
          <Text style={styles.walletAmount}>
            {formatCurrency(totalCredit)}
          </Text>

          <View style={styles.walletDivider} />

          <View style={styles.walletBottomRow}>
            <View style={styles.walletSubStat}>
              <Text style={styles.walletSubLabel}>{t('profile.paymentsReceived')}</Text>
              <Text style={styles.walletSubValue}>
                +{formatCurrency(totalPaid)}
              </Text>
            </View>
            <View style={styles.walletSubStatRight}>
              <Text style={styles.walletSubLabel}>{t('profile.registeredClients')}</Text>
              <Text style={styles.walletSubValue}>
                {totalClients} {t('dashboard.clients')}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Navigation Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.quickAccess')}</Text>
        </View>
        <View style={styles.actionsGrid}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push('/edit-profile')}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF' },
              ]}
            >
              <Feather name="user-check" size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionBtnText}>{t('profile.myProfile')}</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push('/subscription')}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: isDark ? 'rgba(238, 167, 60, 0.2)' : '#FEF3C7' },
              ]}
            >
              <Feather name="award" size={22} color="#D97706" />
            </View>
            <Text style={styles.actionBtnText}>{t('profile.subscription')}</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push('/add-card')}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' },
              ]}
            >
              <Feather name="credit-card" size={22} color="#10B981" />
            </View>
            <Text style={styles.actionBtnText}>{t('profile.payments')}</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push('/settings')}
          >
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <Feather
                name="settings"
                size={22}
                color={isDark ? '#94A3B8' : '#64748B'}
              />
            </View>
            <Text style={styles.actionBtnText}>{t('profile.settings')}</Text>
          </Pressable>
        </View>

        {/* Live Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.recentActivity')}</Text>
          <Text style={styles.sectionBadge}>
            {recentActivities.length} {t('profile.operations')}
          </Text>
        </View>

        <View style={styles.activityContainer}>
          {recentActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Feather
                  name="clock"
                  size={24}
                  color={isDark ? '#475569' : '#94A3B8'}
                />
              </View>
              <Text style={styles.emptyTitle}>{t('profile.noRecentActivity')}</Text>
              <Text style={styles.emptySubtitle}>
                {t('profile.noRecentActivityDesc')}
              </Text>
            </View>
          ) : (
            recentActivities.slice(0, 5).map((item) => {
              const isPayment = item.type === 'paiement';
              return (
                <View key={item.id} style={styles.activityItem}>
                  <View
                    style={[
                      styles.activityIcon,
                      {
                        backgroundColor: isPayment
                          ? isDark
                            ? 'rgba(16, 185, 129, 0.2)'
                            : '#D1FAE5'
                          : isDark
                          ? 'rgba(239, 68, 68, 0.2)'
                          : '#FEE2E2',
                      },
                    ]}
                  >
                    <Feather
                      name={isPayment ? 'arrow-down-left' : 'arrow-up-right'}
                      size={20}
                      color={isPayment ? '#10B981' : colors.danger}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {item.description || (isPayment ? t('dashboard.paymentReceived') : t('dashboard.creditGranted'))}
                    </Text>
                    <Text style={styles.activitySubtitle} numberOfLines={1}>
                      {item.client_name}
                    </Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Text
                      style={[
                        styles.activityAmount,
                        { color: isPayment ? '#10B981' : colors.danger },
                      ]}
                    >
                      {isPayment ? '+' : '-'}
                      {formatCurrency(Number(item.amount))}
                    </Text>
                    <Text style={styles.activityTime}>
                      {formatTimeAgo(item.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? '#0A0E17' : colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContainer: {
      paddingBottom: 120,
    },
    userInfoContainer: {
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 14,
    },
    avatarImage: {
      width: 104,
      height: 104,
      borderRadius: 52,
      borderWidth: 3,
      borderColor: colors.primary,
    },
    avatarMock: {
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#FFFFFF',
    },
    editBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    nameText: {
      fontSize: 22,
      fontWeight: '800',
      color: isDark ? '#F8FAFC' : '#0F172A',
      letterSpacing: -0.3,
    },
    handleText: {
      fontSize: 13.5,
      color: isDark ? '#94A3B8' : '#64748B',
      marginBottom: 12,
      fontWeight: '500',
    },
    editProfilePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.2)',
    },
    editProfilePillText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.primary,
    },
    walletCard: {
      backgroundColor: isDark ? '#141A26' : colors.primary,
      marginHorizontal: 20,
      borderRadius: 24,
      padding: 22,
      marginBottom: 28,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? '#232D3F' : 'transparent',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.1 : 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    walletTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    walletTitle: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    activePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(16, 185, 129, 0.25)',
      paddingHorizontal: 8,
      paddingVertical: 2.5,
      borderRadius: 10,
    },
    activeDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#34D399',
    },
    activeText: {
      color: '#A7F3D0',
      fontSize: 10,
      fontWeight: '800',
    },
    walletAmount: {
      color: '#FFFFFF',
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    walletDivider: {
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      marginVertical: 18,
    },
    walletBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    walletSubStat: {
      flex: 1,
    },
    walletSubStatRight: {
      alignItems: 'flex-end',
    },
    walletSubLabel: {
      color: 'rgba(255, 255, 255, 0.75)',
      fontSize: 12,
      marginBottom: 3,
    },
    walletSubValue: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: isDark ? '#F8FAFC' : colors.text,
      letterSpacing: -0.2,
    },
    sectionBadge: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#64748B',
      fontWeight: '600',
    },
    actionsGrid: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      justifyContent: 'space-between',
      marginBottom: 28,
    },
    actionBtn: {
      alignItems: 'center',
      flex: 1,
    },
    actionIconContainer: {
      width: 54,
      height: 54,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDark ? '#232D3F' : 'rgba(0,0,0,0.04)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    actionBtnText: {
      fontSize: 12,
      color: isDark ? '#CBD5E1' : colors.textSecondary,
      fontWeight: '600',
    },
    activityContainer: {
      paddingHorizontal: 20,
      gap: 12,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#141A26' : colors.surface,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? '#232D3F' : '#E2E8F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    activityIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    activityContent: {
      flex: 1,
      justifyContent: 'center',
    },
    activityTitle: {
      fontSize: 14.5,
      fontWeight: '700',
      color: isDark ? '#F8FAFC' : colors.text,
      marginBottom: 2,
    },
    activitySubtitle: {
      fontSize: 12.5,
      color: isDark ? '#94A3B8' : colors.textSecondary,
      fontWeight: '500',
    },
    activityRight: {
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    activityAmount: {
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 2,
    },
    activityTime: {
      fontSize: 11.5,
      color: isDark ? '#64748B' : colors.textSecondary,
      fontWeight: '500',
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
      backgroundColor: isDark ? '#141A26' : colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#232D3F' : '#E2E8F0',
    },
    emptyIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: isDark ? '#1F2736' : '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#F8FAFC' : '#0F172A',
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 13,
      color: isDark ? '#94A3B8' : '#64748B',
      textAlign: 'center',
      lineHeight: 18,
    },
  });
