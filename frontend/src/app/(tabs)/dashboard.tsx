import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  DashboardData,
  ActivityItem,
  ClientItem,
  fetchDashboardData,
  formatCurrency,
  formatTimeAgo,
} from '@/services/dashboard';
import { AppHeader } from '@/components/ui/AppHeader';
import { ClientModal, ClientData } from '@/components/ClientModal';
import { TransactionModal } from '@/components/TransactionModal';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, token, refreshUser } = useAuth();
  const { colors, theme } = useTheme();
  const { t, language } = useLanguage();
  const isDark = theme === 'dark';
  const { width: screenWidth } = useWindowDimensions();

  // State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'paiement' | 'credit'>('all');
  const [clientsList, setClientsList] = useState<ClientData[]>([]);
  const [hideBalance, setHideBalance] = useState(false);

  // Modals state
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<'credit' | 'payment'>('credit');
  const [selectedClientForModal, setSelectedClientForModal] = useState<ClientData | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadClientsList = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3000/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setClientsList(data);
      }
    } catch (e) {
      // Ignore
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      loadClientsList();
      refreshUser();
    }, [loadData, loadClientsList, refreshUser])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    loadClientsList();
    refreshUser();
  }, [loadData, loadClientsList, refreshUser]);

  // Dynamic calculations
  const totalCredit = dashboardData?.stats.totalCredit || 0;
  const totalPaid = dashboardData?.stats.totalPaid || 0;
  const totalClients = dashboardData?.stats.totalClients || 0;
  const totalFlow = totalCredit + totalPaid;
  const recoveryRate = totalFlow > 0 ? Math.round((totalPaid / totalFlow) * 100) : 0;

  // Filtrage des activités
  const filteredActivities = (dashboardData?.recentActivities || []).filter((item: ActivityItem) => {
    if (activityFilter === 'all') return true;
    return item.type === activityFilter;
  });

  // Date du jour formatée
  const todayFormatted = new Intl.DateTimeFormat(
    language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }
  ).format(new Date());

  // Nom d'affichage
  const displayName = (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.name || user?.email?.split('@')[0])) || 'Commerçant';
  const initial = displayName.charAt(0).toUpperCase();

  const avatarUri = user?.avatar_url
    ? (user.avatar_url.startsWith('http')
        ? user.avatar_url
        : `http://localhost:3000${user.avatar_url}`)
    : null;

  const handleCallClient = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
  };

  const openQuickTransactionForClient = (clientItem: ClientItem) => {
    const fullClient = clientsList.find((c: ClientData) => c.id === clientItem.id) || {
      id: clientItem.id,
      name: clientItem.name,
      phone: clientItem.phone || '',
    };
    setSelectedClientForModal(fullClient);
    setTransactionType('credit');
    setTransactionModalVisible(true);
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#0A0E17' : '#F8FAFC' },
      ]}
      edges={['top', 'left', 'right']}
    >
      {/* ─── 1. UNIVERSAL MODERN HEADER ─── */}
      <AppHeader
        variant="tab"
        showBrand={true}
        showStatusPill={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
        {/* ─── 2. GREETING & PROFILE ROW (IMAGE 1 & 2 STYLE) ─── */}
        <View style={styles.profileRow}>
          <View style={styles.profileLeft}>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.profileAvatarContainer}
              accessibilityLabel="Voir le profil"
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.profileAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.profileAvatar,
                    { backgroundColor: isDark ? '#1E3A8A' : '#054687' },
                  ]}
                >
                  <Text style={styles.profileAvatarText}>{initial}</Text>
                </View>
              )}
              <View style={styles.onlineDot} />
            </Pressable>
            <View style={styles.profileTextGroup}>
              <Text
                style={[
                  styles.profileDateText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {todayFormatted}
              </Text>
              <Text
                style={[
                  styles.profileGreetingText,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
                numberOfLines={1}
              >
                {t('dashboard.hello')},{' '}
                <Text style={{ color: isDark ? '#60A5FA' : '#054687' }}>
                  {displayName}
                </Text>{' '}
                👋
              </Text>
            </View>
          </View>

          {/* Privacy Eye Toggle */}
          <Pressable
            style={({ pressed }) => [
              styles.eyeButton,
              {
                backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                borderColor: isDark ? '#232D3F' : '#E2E8F0',
              },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setHideBalance(!hideBalance)}
            accessibilityLabel={t('dashboard.hideAmounts')}
          >
            <Feather
              name={hideBalance ? 'eye-off' : 'eye'}
              size={18}
              color={isDark ? '#94A3B8' : '#64748B'}
            />
          </Pressable>
        </View>

        {loading && !dashboardData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#054687" />
            <Text style={styles.loadingText}>{t('dashboard.loadingStats')}</Text>
          </View>
        ) : (
          <>
            {/* ─── 3. HERO FINTECH BALANCE CARD (IMAGE 1 & 2 FINTECH CARD STYLE) ─── */}
            <View style={styles.heroCardContainer}>
              <LinearGradient
                colors={['#054687', '#0A2E6E', '#061334']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                {/* Decorative background circle */}
                <View style={styles.heroCardDecorCircle} />

                {/* Card Top: Label & Live Indicator */}
                <View style={styles.heroCardTop}>
                  <View style={styles.heroCardAccountPill}>
                    <Ionicons name="card" size={13} color="#93C5FD" />
                    <Text style={styles.heroCardAccountText}>
                      {t('dashboard.commercialLedger')}
                    </Text>
                  </View>
                  <View style={styles.heroCardLivePill}>
                    <View style={styles.heroCardLiveDot} />
                    <Text style={styles.heroCardLiveText}>{t('dashboard.active')}</Text>
                  </View>
                </View>

                {/* Main Debt Amount */}
                <View style={styles.heroCardBalanceGroup}>
                  <Text style={styles.heroCardBalanceLabel}>
                    {t('dashboard.totalCredit')}
                  </Text>
                  <Text style={styles.heroCardBalanceAmount} numberOfLines={1}>
                    {hideBalance ? '•••••••• DH' : formatCurrency(totalCredit)}
                  </Text>
                </View>

                {/* Recovery Progress Bar (Image 1 & 2 inspired) */}
                <View style={styles.recoveryProgressContainer}>
                  <View style={styles.recoveryProgressHeader}>
                    <Text style={styles.recoveryProgressLabel}>
                      {t('dashboard.recoveryRate')}
                    </Text>
                    <Text style={styles.recoveryProgressValue}>
                      {recoveryRate}% {t('dashboard.collected')}
                    </Text>
                  </View>
                  <View style={styles.recoveryProgressBarTrack}>
                    <View
                      style={[
                        styles.recoveryProgressBarFill,
                        { width: `${Math.min(Math.max(recoveryRate, 4), 100)}%` },
                      ]}
                    />
                  </View>
                </View>

                {/* Card Footer: Total Paid & Total Clients */}
                <View style={styles.heroCardFooter}>
                  <View style={styles.heroFooterCell}>
                    <Text style={styles.heroFooterLabel}>{t('dashboard.receivedPayments')}</Text>
                    <Text style={styles.heroFooterValueGreen}>
                      {hideBalance ? '••••••' : `+${formatCurrency(totalPaid)}`}
                    </Text>
                  </View>
                  <View style={styles.heroFooterDivider} />
                  <View style={styles.heroFooterCell}>
                    <Text style={styles.heroFooterLabel}>{t('dashboard.activeClients')}</Text>
                    <Text style={styles.heroFooterValueWhite}>
                      {totalClients} {t('dashboard.clients')}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* ─── 4. QUICK RECIPIENTS / RECENT CLIENTS (IMAGE 1 "SEND MONEY TO" STYLE) ─── */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {t('dashboard.recentClients')}
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {t('dashboard.selectClientSubtitle')}
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentClientsScroll}
            >
              {/* Add Client Circle Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.addClientPillBtn,
                  {
                    backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                    borderColor: isDark ? '#232D3F' : '#E2E8F0',
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  setSelectedClientForModal(null);
                  setClientModalVisible(true);
                }}
              >
                <View
                  style={[
                    styles.addClientCircle,
                    { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF' },
                  ]}
                >
                  <Feather name="plus" size={20} color={isDark ? '#60A5FA' : '#054687'} />
                </View>
                <Text
                  style={[
                    styles.clientAvatarName,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {t('dashboard.new')}
                </Text>
              </Pressable>

              {/* Dynamic Recent Client Avatars */}
              {(dashboardData?.recentClients || []).map((client: ClientItem) => {
                const initialLetter = client.name.charAt(0).toUpperCase();
                const hasDebt = client.credit > 0;

                return (
                  <Pressable
                    key={client.id}
                    style={({ pressed }) => [
                      styles.clientAvatarPill,
                      {
                        backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                        borderColor: isDark ? '#232D3F' : '#E2E8F0',
                      },
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => openQuickTransactionForClient(client)}
                  >
                    <View
                      style={[
                        styles.clientAvatarCircle,
                        {
                          backgroundColor: hasDebt
                            ? isDark
                              ? 'rgba(249, 115, 22, 0.18)'
                              : '#FFF7ED'
                            : isDark
                            ? 'rgba(16, 185, 129, 0.18)'
                            : '#F0FDF4',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.clientAvatarInitial,
                          { color: hasDebt ? '#F97316' : '#10B981' },
                        ]}
                      >
                        {initialLetter}
                      </Text>
                      <View
                        style={[
                          styles.clientDebtMiniDot,
                          { backgroundColor: hasDebt ? '#F97316' : '#10B981' },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.clientAvatarName,
                        { color: isDark ? '#F8FAFC' : '#0F172A' },
                      ]}
                      numberOfLines={1}
                    >
                      {client.name.split(' ')[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* ─── 5. 2x2 QUICK ACTIONS GRID (IMAGE 2 NOJA DESIGNS STYLE) ─── */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {t('dashboard.quickActions')}
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {t('dashboard.instantOperations')}
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/add')}>
                <Text style={styles.seeAllLinkText}>{t('common.more')}</Text>
              </Pressable>
            </View>

            <View style={styles.quickGrid}>
              {/* Action 1: Ajouter Crédit */}
              <Pressable
                style={({ pressed }) => [
                  styles.quickGridCard,
                  {
                    backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                    borderColor: isDark ? '#232D3F' : '#E2E8F0',
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  setSelectedClientForModal(null);
                  setTransactionType('credit');
                  setTransactionModalVisible(true);
                }}
              >
                <View
                  style={[
                    styles.quickGridIconCircle,
                    { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.18)' : '#FFF7ED' },
                  ]}
                >
                  <Feather name="plus-circle" size={22} color="#F97316" />
                </View>
                <Text
                  style={[
                    styles.quickGridTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {t('dashboard.addCredit')}
                </Text>
                <Text
                  style={[
                    styles.quickGridSubtitle,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {t('dashboard.addCreditDesc')}
                </Text>
              </Pressable>

              {/* Action 2: Enregistrer Paiement */}
              <Pressable
                style={({ pressed }) => [
                  styles.quickGridCard,
                  {
                    backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                    borderColor: isDark ? '#232D3F' : '#E2E8F0',
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  setSelectedClientForModal(null);
                  setTransactionType('payment');
                  setTransactionModalVisible(true);
                }}
              >
                <View
                  style={[
                    styles.quickGridIconCircle,
                    { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#F0FDF4' },
                  ]}
                >
                  <FontAwesome5 name="hand-holding-usd" size={18} color="#10B981" />
                </View>
                <Text
                  style={[
                    styles.quickGridTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {t('dashboard.collect')}
                </Text>
                <Text
                  style={[
                    styles.quickGridSubtitle,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {t('dashboard.paymentReceived')}
                </Text>
              </Pressable>

              {/* Action 3: Nouveau Client */}
              <Pressable
                style={({ pressed }) => [
                  styles.quickGridCard,
                  {
                    backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                    borderColor: isDark ? '#232D3F' : '#E2E8F0',
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  setSelectedClientForModal(null);
                  setClientModalVisible(true);
                }}
              >
                <View
                  style={[
                    styles.quickGridIconCircle,
                    { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF' },
                  ]}
                >
                  <Feather name="user-plus" size={22} color={isDark ? '#60A5FA' : '#054687'} />
                </View>
                <Text
                  style={[
                    styles.quickGridTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {t('dashboard.newClient')}
                </Text>
                <Text
                  style={[
                    styles.quickGridSubtitle,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {t('dashboard.createClientProfile')}
                </Text>
              </Pressable>

              {/* Action 4: Tous les Clients */}
              <Pressable
                style={({ pressed }) => [
                  styles.quickGridCard,
                  {
                    backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                    borderColor: isDark ? '#232D3F' : '#E2E8F0',
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.push('/(tabs)/search')}
              >
                <View
                  style={[
                    styles.quickGridIconCircle,
                    { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF' },
                  ]}
                >
                  <Feather name="users" size={22} color="#4F46E5" />
                </View>
                <Text
                  style={[
                    styles.quickGridTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {t('dashboard.explorer')}
                </Text>
                <Text
                  style={[
                    styles.quickGridSubtitle,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {t('dashboard.viewAllLedger')}
                </Text>
              </Pressable>
            </View>

            {/* ─── 6. TRANSACTION HISTORY / ACTIVITIES (IMAGE 1 & 2 STYLE) ─── */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {t('dashboard.recentHistory')}
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {t('dashboard.recentHistorySubtitle')}
                </Text>
              </View>
              <Pressable onPress={() => setActivityFilter('all')}>
                <Text style={styles.seeAllLinkText}>{t('common.all')}</Text>
              </Pressable>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterPillsRow}>
              <Pressable
                style={[
                  styles.filterPill,
                  activityFilter === 'all' && styles.filterPillActive,
                  {
                    backgroundColor:
                      activityFilter === 'all'
                        ? '#054687'
                        : isDark
                        ? '#1F2736'
                        : '#F1F5F9',
                  },
                ]}
                onPress={() => setActivityFilter('all')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activityFilter === 'all'
                      ? styles.filterPillTextActive
                      : { color: isDark ? '#94A3B8' : '#475569' },
                  ]}
                >
                  {t('dashboard.all')}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterPill,
                  activityFilter === 'paiement' && styles.filterPillActive,
                  {
                    backgroundColor:
                      activityFilter === 'paiement'
                        ? '#10B981'
                        : isDark
                        ? '#1F2736'
                        : '#F1F5F9',
                  },
                ]}
                onPress={() => setActivityFilter('paiement')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activityFilter === 'paiement'
                      ? styles.filterPillTextActive
                      : { color: isDark ? '#94A3B8' : '#475569' },
                  ]}
                >
                  {t('dashboard.payments')}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.filterPill,
                  activityFilter === 'credit' && styles.filterPillActive,
                  {
                    backgroundColor:
                      activityFilter === 'credit'
                        ? '#F97316'
                        : isDark
                        ? '#1F2736'
                        : '#F1F5F9',
                  },
                ]}
                onPress={() => setActivityFilter('credit')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activityFilter === 'credit'
                      ? styles.filterPillTextActive
                      : { color: isDark ? '#94A3B8' : '#475569' },
                  ]}
                >
                  {t('dashboard.credits')}
                </Text>
              </Pressable>
            </View>

            {/* Grouped Activity Items */}
            <View
              style={[
                styles.activitiesCard,
                {
                  backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                  borderColor: isDark ? '#232D3F' : '#E2E8F0',
                },
              ]}
            >
              {filteredActivities.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="receipt-outline"
                    size={36}
                    color={isDark ? '#4B5563' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: isDark ? '#6B7280' : '#94A3B8' },
                    ]}
                  >
                    {t('dashboard.noActivity')}
                  </Text>
                </View>
              ) : (
                filteredActivities.map((activity: ActivityItem, index: number) => {
                  const isPayment = activity.type === 'paiement';
                  const isCredit = activity.type === 'credit';
                  const isLast = index === filteredActivities.length - 1;

                  return (
                    <View
                      key={activity.id}
                      style={[
                        styles.activityRow,
                        !isLast && {
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? '#1F2736' : '#F1F5F9',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.activityIconCircle,
                          isPayment && {
                            backgroundColor: isDark
                              ? 'rgba(16, 185, 129, 0.18)'
                              : '#F0FDF4',
                          },
                          isCredit && {
                            backgroundColor: isDark
                              ? 'rgba(249, 115, 22, 0.18)'
                              : '#FFF7ED',
                          },
                          !isPayment &&
                            !isCredit && {
                              backgroundColor: isDark
                                ? 'rgba(37, 99, 235, 0.2)'
                                : '#EFF6FF',
                            },
                        ]}
                      >
                        {isPayment ? (
                          <Feather name="arrow-down-left" size={18} color="#10B981" />
                        ) : isCredit ? (
                          <Feather name="arrow-up-right" size={18} color="#F97316" />
                        ) : (
                          <Feather
                            name="user-plus"
                            size={18}
                            color={isDark ? '#60A5FA' : '#054687'}
                          />
                        )}
                      </View>

                      <View style={styles.activityDetails}>
                        <Text
                          style={[
                            styles.activityClientName,
                            { color: isDark ? '#F8FAFC' : '#0F172A' },
                          ]}
                          numberOfLines={1}
                        >
                          {activity.client_name}
                        </Text>
                        <Text
                          style={[
                            styles.activityDescription,
                            { color: isDark ? '#94A3B8' : '#64748B' },
                          ]}
                          numberOfLines={1}
                        >
                          {activity.description ||
                            (isPayment ? t('dashboard.paymentReceived') : t('dashboard.creditGranted'))}
                        </Text>
                        <Text
                          style={[
                            styles.activityTime,
                            { color: isDark ? '#64748B' : '#94A3B8' },
                          ]}
                        >
                          {formatTimeAgo(activity.created_at, language)}
                        </Text>
                      </View>

                      <View style={styles.activityAmountContainer}>
                        {activity.amount > 0 ? (
                          <Text
                            style={[
                              styles.activityAmount,
                              isPayment
                                ? { color: '#10B981' }
                                : { color: '#F97316' },
                            ]}
                          >
                            {isPayment ? '+' : '-'} {formatCurrency(activity.amount)}
                          </Text>
                        ) : (
                          <View
                            style={[
                              styles.newBadge,
                              { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.newBadgeText,
                                { color: isDark ? '#60A5FA' : '#2563EB' },
                              ]}
                            >
                              {t('dashboard.new')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* ─── 7. RECENT CLIENTS (PORTFOLIO LIST) ─── */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {t('dashboard.clientPortfolio')}
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {t('dashboard.clientPortfolioSubtitle')}
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/search')}>
                <Text style={styles.seeAllLinkText}>{t('common.viewAll')}</Text>
              </Pressable>
            </View>

            <View style={styles.clientsStack}>
              {(dashboardData?.recentClients || []).map((client: ClientItem) => {
                const clientInitial = client.name.charAt(0).toUpperCase();
                const hasCredit = client.credit > 0;

                return (
                  <Pressable
                    key={client.id}
                    style={({ pressed }) => [
                      styles.mobileClientCard,
                      {
                        backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                        borderColor: isDark ? '#232D3F' : '#E2E8F0',
                      },
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => router.push(`/client/${client.id}` as any)}
                  >
                    <View
                      style={[
                        styles.clientAvatar,
                        {
                          backgroundColor: isDark
                            ? 'rgba(37, 99, 235, 0.15)'
                            : '#EFF6FF',
                          borderColor: isDark ? '#1E3A8A' : '#DBEAFE',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.clientAvatarText,
                          { color: isDark ? '#60A5FA' : '#054687' },
                        ]}
                      >
                        {clientInitial}
                      </Text>
                    </View>

                    <View style={styles.clientInfo}>
                      <Text
                        style={[
                          styles.clientName,
                          { color: isDark ? '#F8FAFC' : '#0F172A' },
                        ]}
                        numberOfLines={1}
                      >
                        {client.name}
                      </Text>

                      {client.phone ? (
                        <View style={styles.clientContactRow}>
                          <Feather
                            name="phone"
                            size={12}
                            color={isDark ? '#64748B' : '#94A3B8'}
                          />
                          <Text
                            style={[
                              styles.clientPhone,
                              { color: isDark ? '#94A3B8' : '#64748B' },
                            ]}
                          >
                            {client.phone}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.clientRightSection}>
                      {hasCredit ? (
                        <View
                          style={[
                            styles.creditDueBadge,
                            {
                              backgroundColor: isDark
                                ? 'rgba(245, 158, 11, 0.15)'
                                : '#FEF3C7',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.creditDueLabel,
                              { color: isDark ? '#FBBF24' : '#92400E' },
                            ]}
                          >
                            {t('dashboard.due')}
                          </Text>
                          <Text
                            style={[
                              styles.creditDueAmount,
                              { color: isDark ? '#F59E0B' : '#B45309' },
                            ]}
                          >
                            {formatCurrency(client.credit)}
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.settledBadge,
                            {
                              backgroundColor: isDark
                                ? 'rgba(16, 185, 129, 0.15)'
                                : '#DCFCE7',
                            },
                          ]}
                        >
                          <Feather name="check" size={12} color="#10B981" />
                          <Text style={styles.settledText}>{t('dashboard.upToDate')}</Text>
                        </View>
                      )}

                      {client.phone ? (
                        <Pressable
                          style={[
                            styles.callActionButton,
                            {
                              backgroundColor: isDark ? '#1F2736' : '#F1F5F9',
                            },
                          ]}
                          onPress={() => handleCallClient(client.phone)}
                        >
                          <Feather
                            name="phone-call"
                            size={14}
                            color={isDark ? '#60A5FA' : '#054687'}
                          />
                        </Pressable>
                      ) : null}

                      <View
                        style={[
                          styles.clientChevron,
                          {
                            backgroundColor: isDark ? '#1F2736' : '#F1F5F9',
                          },
                        ]}
                      >
                        <Feather
                          name="chevron-right"
                          size={16}
                          color={isDark ? '#94A3B8' : '#64748B'}
                        />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* ─── MODALS ─── */}
      <ClientModal
        visible={clientModalVisible}
        onClose={() => setClientModalVisible(false)}
        onSuccess={(savedClient) => {
          setClientModalVisible(false);
          loadData();
          loadClientsList();
          if (savedClient?.id) {
            router.push(`/client/${savedClient.id}` as any);
          }
        }}
      />

      <TransactionModal
        visible={transactionModalVisible}
        type={transactionType}
        client={selectedClientForModal}
        clientsList={clientsList}
        onClose={() => {
          setTransactionModalVisible(false);
          setSelectedClientForModal(null);
        }}
        onSuccess={(trans) => {
          setTransactionModalVisible(false);
          setSelectedClientForModal(null);
          loadData();
          loadClientsList();
          if (trans?.client_id) {
            router.push(`/client/${trans.client_id}` as any);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },

  // ─── Profile Greeting Row ───
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatarContainer: {
    width: 48,
    height: 48,
    position: 'relative',
    marginRight: 12,
  },
  profileAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  onlineDot: {
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
  profileTextGroup: {
    flex: 1,
  },
  profileDateText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  profileGreetingText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  eyeButton: {
    width: 42,
    height: 42,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  // ─── Hero Fintech Balance Card ───
  heroCardContainer: {
    marginBottom: 20,
    borderRadius: 26,
    shadowColor: '#054687',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  heroCard: {
    borderRadius: 26,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCardDecorCircle: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroCardAccountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroCardAccountText: {
    color: '#E0F2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroCardLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  heroCardLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  heroCardLiveText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '700',
  },
  heroCardBalanceGroup: {
    marginBottom: 16,
  },
  heroCardBalanceLabel: {
    color: '#BAE6FD',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  heroCardBalanceAmount: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  // Recovery progress bar
  recoveryProgressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  recoveryProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recoveryProgressLabel: {
    color: '#E0F2FE',
    fontSize: 11,
    fontWeight: '600',
  },
  recoveryProgressValue: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
  },
  recoveryProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  recoveryProgressBarFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 3,
  },

  // Hero Footer
  heroCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroFooterCell: {
    flex: 1,
  },
  heroFooterLabel: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  heroFooterValueGreen: {
    color: '#6EE7B7',
    fontSize: 15,
    fontWeight: '900',
  },
  heroFooterValueWhite: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  heroFooterDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 12,
  },

  // ─── Section Header ───
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  seeAllLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#054687',
  },

  // ─── Quick Recipients / Client Avatars Scroll (Image 1 Style) ───
  recentClientsScroll: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
    paddingVertical: 2,
  },
  addClientPillBtn: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    width: 76,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  addClientCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  clientAvatarPill: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    width: 76,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  clientAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  clientAvatarInitial: {
    fontSize: 16,
    fontWeight: '900',
  },
  clientDebtMiniDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  clientAvatarName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ─── 2x2 Quick Actions Grid (Image 2 Style) ───
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 22,
  },
  quickGridCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickGridIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickGridTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  quickGridSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },

  // ─── Filter Pills ───
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#054687',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  // ─── Activities Card ───
  activitiesCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 22,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  activityIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityClientName: {
    fontSize: 14,
    fontWeight: '800',
  },
  activityDescription: {
    fontSize: 12,
    marginTop: 1,
  },
  activityTime: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  activityAmountContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyStateText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ─── Clients Stack ───
  clientsStack: {
    gap: 10,
  },
  mobileClientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  clientAvatarText: {
    fontSize: 17,
    fontWeight: '900',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '800',
  },
  clientContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  clientPhone: {
    fontSize: 12,
    fontWeight: '500',
  },
  clientRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditDueBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'flex-end',
  },
  creditDueLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  creditDueAmount: {
    fontSize: 12,
    fontWeight: '900',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  settledText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  callActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Loading ───
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },

  // ─── Touch effect ───
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
