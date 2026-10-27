import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useAppAlert } from '@/context/AlertContext';
import { useLanguage } from '@/context/LanguageContext';
import { AppHeader } from '@/components/ui/AppHeader';
import { ClientModal, ClientData } from '@/components/ClientModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

type FilterType = 'all' | 'with_debt' | 'settled';
type SortType = 'newest' | 'highest_debt' | 'name_asc' | 'oldest';

export default function ExploreScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { token } = useAuth();
  const { showAlert } = useAppAlert();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeSort, setActiveSort] = useState<SortType>('newest');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  // Modals
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClientData | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3000/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des clients');
      }
      const data = await res.json();
      setClients(data);
    } catch (err: any) {
      console.error(err);
      showAlert('error', 'Erreur', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClients();
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete?.id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/clients/${clientToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      showAlert('success', 'Client supprimé', 'Le client a été retiré de votre carnet.');
      setDeleteModalVisible(false);
      setClientToDelete(null);
      fetchClients();
    } catch (err: any) {
      showAlert('error', 'Erreur', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Search query filter (name or phone or address)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query) ||
          (c.address && c.address.toLowerCase().includes(query))
      );
    }

    // Tab Filter
    if (activeFilter === 'with_debt') {
      result = result.filter((c) => (c.remaining_debt || 0) > 0);
    } else if (activeFilter === 'settled') {
      result = result.filter((c) => (c.remaining_debt || 0) <= 0);
    }

    // Sorting
    if (activeSort === 'newest') {
      result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    } else if (activeSort === 'oldest') {
      result.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
    } else if (activeSort === 'highest_debt') {
      result.sort((a, b) => (b.remaining_debt || 0) - (a.remaining_debt || 0));
    } else if (activeSort === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [clients, searchQuery, activeFilter, activeSort]);

  // Financial Stats Totals
  const totalOutstandingDebt = useMemo(() => {
    return clients.reduce((sum, c) => sum + (c.remaining_debt || 0), 0);
  }, [clients]);

  const totalPaidSum = useMemo(() => {
    return clients.reduce((sum, c) => sum + (c.total_paid || 0), 0);
  }, [clients]);

  const clientsWithDebtCount = useMemo(() => {
    return clients.filter((c) => (c.remaining_debt || 0) > 0).length;
  }, [clients]);

  const getInitials = (name?: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getSortLabel = (sort: SortType) => {
    switch (sort) {
      case 'newest': return t('clients.sortNewest');
      case 'highest_debt': return t('clients.sortHighestDebt');
      case 'name_asc': return t('clients.sortNameAsc');
      case 'oldest': return t('clients.sortOldest');
    }
  };

  const handleCallClient = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#0A0E17' : '#F8FAFC' },
      ]}
      edges={['top', 'left', 'right']}
    >
      {/* Universal Modern Header */}
      <AppHeader
        variant="tab"
        title={t('clients.title')}
        subtitle={t('clients.subtitle')}
        badgeText={clients.length}
        showBrand={true}
        showStatusPill={true}
        rightButton={{
          label: t('clients.newClient'),
          icon: 'plus',
          onPress: () => {
            setClientToEdit(null);
            setClientModalVisible(true);
          },
        }}
      />

      <ScrollView
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
        {/* ================= 1. SUMMARY CARDS (PASTEL SQUIRCLE STYLE) ================= */}
        <View style={styles.summaryContainer}>
          {/* Card 1: Total Clients */}
          <View
            style={[
              styles.summaryCell,
              {
                backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                borderColor: isDark ? '#232D3F' : '#E2E8F0',
              },
            ]}
          >
            <View
              style={[
                styles.summaryIconSquare,
                { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.18)' : '#EFF6FF' },
              ]}
            >
              <Feather name="users" size={16} color={isDark ? '#60A5FA' : '#054687'} />
            </View>
            <Text
              style={[
                styles.summaryCellValue,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
            >
              {clients.length}
            </Text>
            <Text
              style={[
                styles.summaryCellSub,
                { color: isDark ? '#60A5FA' : '#054687' },
              ]}
            >
              {clientsWithDebtCount} {t('clients.inDebt')}
            </Text>
          </View>

          {/* Card 2: Total Dettes */}
          <View
            style={[
              styles.summaryCell,
              {
                backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                borderColor: isDark ? '#232D3F' : '#E2E8F0',
              },
            ]}
          >
            <View
              style={[
                styles.summaryIconSquare,
                { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.18)' : '#FFF7ED' },
              ]}
            >
              <Feather name="clock" size={16} color="#F97316" />
            </View>
            <Text
              style={[
                styles.summaryCellValue,
                { color: isDark ? '#FBBF24' : '#B45309' },
              ]}
              numberOfLines={1}
            >
              {totalOutstandingDebt.toLocaleString('fr-FR')}{' '}
              <Text style={styles.summaryUnit}>DH</Text>
            </Text>
            <Text style={[styles.summaryCellSub, { color: '#F97316' }]}>
              {t('clients.toRecover')}
            </Text>
          </View>

          {/* Card 3: Total Paiements */}
          <View
            style={[
              styles.summaryCell,
              {
                backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                borderColor: isDark ? '#232D3F' : '#E2E8F0',
              },
            ]}
          >
            <View
              style={[
                styles.summaryIconSquare,
                { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#F0FDF4' },
              ]}
            >
              <FontAwesome5 name="hand-holding-usd" size={14} color="#10B981" />
            </View>
            <Text
              style={[
                styles.summaryCellValue,
                { color: isDark ? '#34D399' : '#047857' },
              ]}
              numberOfLines={1}
            >
              {totalPaidSum.toLocaleString('fr-FR')}{' '}
              <Text style={styles.summaryUnit}>DH</Text>
            </Text>
            <Text style={[styles.summaryCellSub, { color: '#10B981' }]}>
              {t('clients.collected')}
            </Text>
          </View>
        </View>

        {/* ================= 3. SEARCH BAR (ROUNDED & CLEAN) ================= */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBarWrapper,
              {
                backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                borderColor: isDark ? '#232D3F' : '#E2E8F0',
              },
            ]}
          >
            <Feather
              name="search"
              size={18}
              color={isDark ? '#64748B' : '#94A3B8'}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={[
                styles.searchInputText,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
              placeholder={t('clients.searchPlaceholder')}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {!!searchQuery && (
              <Pressable
                onPress={() => setSearchQuery('')}
                style={{ padding: 4 }}
              >
                <Feather
                  name="x-circle"
                  size={16}
                  color={isDark ? '#94A3B8' : '#64748B'}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* ================= 4. FILTER PILLS & SORT (SWIPABLE ON MOBILE) ================= */}
        <View style={styles.filterSortSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsScroll}
          >
            <Pressable
              style={[
                styles.filterPill,
                activeFilter === 'all'
                  ? styles.filterPillActivePrimary
                  : {
                      backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                      borderColor: isDark ? '#232D3F' : '#E2E8F0',
                    },
              ]}
              onPress={() => setActiveFilter('all')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'all'
                    ? styles.filterPillTextWhite
                    : { color: isDark ? '#94A3B8' : '#475569' },
                ]}
              >
                {t('clients.filterAll')} ({clients.length})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterPill,
                activeFilter === 'with_debt'
                  ? styles.filterPillActiveOrange
                  : {
                      backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                      borderColor: isDark ? '#232D3F' : '#E2E8F0',
                    },
              ]}
              onPress={() => setActiveFilter('with_debt')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'with_debt'
                    ? styles.filterPillTextWhite
                    : { color: isDark ? '#94A3B8' : '#475569' },
                ]}
              >
                {t('clients.filterDebt')} ({clientsWithDebtCount})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterPill,
                activeFilter === 'settled'
                  ? styles.filterPillActiveGreen
                  : {
                      backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                      borderColor: isDark ? '#232D3F' : '#E2E8F0',
                    },
              ]}
              onPress={() => setActiveFilter('settled')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'settled'
                    ? styles.filterPillTextWhite
                    : { color: isDark ? '#94A3B8' : '#475569' },
                ]}
              >
                {t('clients.filterSettled')} ({clients.length - clientsWithDebtCount})
              </Text>
            </Pressable>

            {/* Sort Button Pill */}
            <Pressable
              style={[
                styles.sortTriggerPill,
                {
                  backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                  borderColor: isDark ? '#232D3F' : '#E2E8F0',
                },
              ]}
              onPress={() => setSortMenuVisible(!sortMenuVisible)}
            >
              <Feather
                name="bar-chart-2"
                size={14}
                color={isDark ? '#60A5FA' : '#054687'}
              />
              <Text
                style={[
                  styles.sortTriggerText,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                {getSortLabel(activeSort)}
              </Text>
              <Feather
                name="chevron-down"
                size={13}
                color={isDark ? '#94A3B8' : '#64748B'}
              />
            </Pressable>
          </ScrollView>
        </View>

        {/* Sort Dropdown Menu */}
        {sortMenuVisible && (
          <View
            style={[
              styles.sortDropdownCard,
              {
                backgroundColor: isDark ? '#181E2B' : '#FFFFFF',
                borderColor: isDark ? '#2B374C' : '#E2E8F0',
              },
            ]}
          >
            {(['newest', 'highest_debt', 'name_asc', 'oldest'] as const).map(
              (sortKey) => (
                <Pressable
                  key={sortKey}
                  style={[
                    styles.sortDropdownRow,
                    activeSort === sortKey && {
                      backgroundColor: isDark ? '#222B3D' : '#EFF6FF',
                    },
                  ]}
                  onPress={() => {
                    setActiveSort(sortKey);
                    setSortMenuVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortDropdownRowText,
                      {
                        color:
                          activeSort === sortKey
                            ? '#054687'
                            : isDark
                            ? '#F8FAFC'
                            : '#0F172A',
                      },
                      activeSort === sortKey && { fontWeight: '700' },
                    ]}
                  >
                    {getSortLabel(sortKey)}
                  </Text>
                  {activeSort === sortKey && (
                    <Feather name="check" size={15} color="#054687" />
                  )}
                </Pressable>
              )
            )}
          </View>
        )}

        {/* ================= 5. CLIENT LIST (MOBILE CARDS) ================= */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#054687" />
            <Text
              style={[
                styles.loadingHint,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              {t('clients.loading')}
            </Text>
          </View>
        ) : filteredClients.length === 0 ? (
          <Animatable.View
            animation="fadeIn"
            style={[
              styles.emptyStateCard,
              {
                backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                borderColor: isDark ? '#232D3F' : '#E2E8F0',
              },
            ]}
          >
            {clients.length === 0 ? (
              <>
                <View
                  style={[
                    styles.emptyStateIconCircle,
                    { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF' },
                  ]}
                >
                  <Feather name="users" size={36} color="#054687" />
                </View>
                <Text
                  style={[
                    styles.emptyStateTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {t('clients.emptyTitle')}
                </Text>
                <Text
                  style={[
                    styles.emptyStateSub,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {t('clients.emptyDesc')}
                </Text>
                <Pressable
                  style={[styles.emptyStateBtn, { backgroundColor: '#054687' }]}
                  onPress={() => {
                    setClientToEdit(null);
                    setClientModalVisible(true);
                  }}
                >
                  <Feather name="user-plus" size={17} color="#FFFFFF" />
                  <Text style={styles.emptyStateBtnText}>{t('clients.addClientBtn')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.emptyStateIconCircle,
                    { backgroundColor: isDark ? '#1C2333' : '#F1F5F9' },
                  ]}
                >
                  <Feather
                    name="search"
                    size={36}
                    color={isDark ? '#64748B' : '#94A3B8'}
                  />
                </View>
                <Text
                  style={[
                    styles.emptyStateTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {t('clients.noResultsTitle')}
                </Text>
                <Text
                  style={[
                    styles.emptyStateSub,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  {t('clients.noResultsDesc')}
                </Text>
                <Pressable
                  style={[styles.emptyStateBtn, { backgroundColor: '#054687' }]}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.emptyStateBtnText}>
                    {t('clients.resetSearch')}
                  </Text>
                </Pressable>
              </>
            )}
          </Animatable.View>
        ) : (
          /* INDIVIDUAL MOBILE CLIENT CARDS */
          <View style={styles.clientsStack}>
            {filteredClients.map((client) => {
              const debt = client.remaining_debt || 0;
              const hasDebt = debt > 0;

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
                  {/* Left: Squircle Avatar */}
                  <View
                    style={[
                      styles.clientAvatar,
                      {
                        backgroundColor: hasDebt
                          ? isDark
                            ? 'rgba(249, 115, 22, 0.18)'
                            : '#FFF7ED'
                          : isDark
                          ? 'rgba(16, 185, 129, 0.18)'
                          : '#F0FDF4',
                        borderColor: hasDebt
                          ? isDark
                            ? '#7C2D12'
                            : '#FED7AA'
                          : isDark
                          ? '#064E3B'
                          : '#BBF7D0',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.clientAvatarText,
                        { color: hasDebt ? '#EA580C' : '#10B981' },
                      ]}
                    >
                      {getInitials(client.name)}
                    </Text>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: hasDebt ? '#F97316' : '#10B981' },
                      ]}
                    />
                  </View>

                  {/* Customer Info */}
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
                    <View style={styles.clientContactRow}>
                      {client.phone ? (
                        <View style={styles.metaPhoneGroup}>
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

                      {client.address ? (
                        <View style={styles.metaAddressGroup}>
                          <Text
                            style={[
                              styles.metaSeparator,
                              { color: isDark ? '#475569' : '#CBD5E1' },
                            ]}
                          >
                            •
                          </Text>
                          <Text
                            style={[
                              styles.clientAddress,
                              { color: isDark ? '#94A3B8' : '#64748B' },
                            ]}
                            numberOfLines={1}
                          >
                            {client.address}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Right Side: Debt badge + Phone action + Chevron */}
                  <View style={styles.clientRightActions}>
                    {hasDebt ? (
                      <View
                        style={[
                          styles.creditDueBadge,
                          {
                            backgroundColor: isDark
                              ? 'rgba(245, 158, 11, 0.16)'
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
                          {t('clients.remainingDue')}
                        </Text>
                        <Text
                          style={[
                            styles.creditDueAmount,
                            { color: isDark ? '#F59E0B' : '#B45309' },
                          ]}
                        >
                          {debt.toLocaleString('fr-FR')} DH
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.settledBadge,
                          {
                            backgroundColor: isDark
                              ? 'rgba(16, 185, 129, 0.16)'
                              : '#DCFCE7',
                          },
                        ]}
                      >
                        <Feather name="check" size={12} color="#10B981" />
                        <Text style={styles.settledText}>{t('clients.settled')}</Text>
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
                        accessibilityLabel={t('clientProfile.call')}
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
        )}
      </ScrollView>

      {/* ================= MODALS ================= */}
      <ClientModal
        visible={clientModalVisible}
        client={clientToEdit}
        onClose={() => {
          setClientModalVisible(false);
          setClientToEdit(null);
        }}
        onSuccess={() => fetchClients()}
      />

      <DeleteConfirmModal
        visible={deleteModalVisible}
        title={t('clients.deleteTitle')}
        message={t('clients.deleteMessage')}
        loading={actionLoading}
        onCancel={() => {
          setDeleteModalVisible(false);
          setClientToDelete(null);
        }}
        onConfirm={handleDeleteClient}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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

  // ─── Header ───
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  newClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#054687',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  newClientButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ─── Summary Cells (Matching squircle cards) ───
  summaryContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryCell: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryIconSquare: {
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryCellValue: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  summaryUnit: {
    fontSize: 10,
    fontWeight: '700',
  },
  summaryCellSub: {
    fontSize: 10,
    fontWeight: '600',
  },

  // ─── Search Bar ───
  searchSection: {
    marginBottom: 12,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },

  // ─── Filter & Sort ───
  filterSortSection: {
    marginBottom: 14,
  },
  filterPillsScroll: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillActivePrimary: {
    backgroundColor: '#054687',
    borderColor: '#054687',
  },
  filterPillActiveOrange: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  filterPillActiveGreen: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextWhite: {
    color: '#FFFFFF',
  },
  sortTriggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  sortTriggerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sortDropdownCard: {
    position: 'absolute',
    top: 250,
    right: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 6,
    zIndex: 999,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  sortDropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sortDropdownRowText: {
    fontSize: 13,
  },

  // ─── Loading & Empty States ───
  centerLoading: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingHint: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyStateIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateSub: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 270,
  },
  emptyStateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyStateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ─── Client Cards Stack (Mobile Native) ───
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
    position: 'relative',
  },
  clientAvatarText: {
    fontSize: 16,
    fontWeight: '900',
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  clientInfo: {
    flex: 1,
    paddingRight: 6,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '800',
  },
  clientContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  metaPhoneGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaAddressGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 90,
  },
  metaSeparator: {
    fontSize: 10,
  },
  clientPhone: {
    fontSize: 12,
    fontWeight: '500',
  },
  clientAddress: {
    fontSize: 11,
    fontWeight: '500',
  },
  clientRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditDueBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  creditDueLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 1,
  },
  creditDueAmount: {
    fontSize: 12,
    fontWeight: '900',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
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

  // ─── Touch effect ───
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
