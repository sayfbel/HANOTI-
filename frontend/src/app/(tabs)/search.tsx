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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useAppAlert } from '@/context/AlertContext';
import { ClientModal, ClientData } from '@/components/ClientModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

type FilterType = 'all' | 'with_debt' | 'settled';
type SortType = 'newest' | 'highest_debt' | 'name_asc' | 'oldest';

export default function ExploreScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { token } = useAuth();
  const { showAlert } = useAppAlert();
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
      case 'newest': return 'Plus récent';
      case 'highest_debt': return 'Dette élevée';
      case 'name_asc': return 'Nom A-Z';
      case 'oldest': return 'Plus ancien';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0A0E17' : '#F8FAFC' }]} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER */}
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Clients</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Gérez vos clients et leurs crédits
          </Text>
        </View>

        <Pressable
          style={[styles.newClientButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setClientToEdit(null);
            setClientModalVisible(true);
          }}
        >
          <Feather name="plus" size={17} color="#FFFFFF" />
          <Text style={styles.newClientButtonText}>Nouveau Client</Text>
        </Pressable>
      </View>

      {/* 2. COMPACT SUMMARY CARDS (Clients / Dettes / Paiements) */}
      <View style={styles.summaryContainer}>
        {/* Total Clients */}
        <View
          style={[
            styles.summaryCell,
            {
              backgroundColor: isDark ? '#141A26' : '#FFFFFF',
              borderColor: isDark ? '#232D3F' : '#E2E8F0',
            },
          ]}
        >
          <Text style={[styles.summaryCellLabel, { color: colors.textSecondary }]}>TOTAL CLIENTS</Text>
          <Text style={[styles.summaryCellValue, { color: colors.text }]}>{clients.length}</Text>
          <Text style={[styles.summaryCellSub, { color: colors.primary }]}>{clientsWithDebtCount} en dette</Text>
        </View>

        {/* Total Dettes */}
        <View
          style={[
            styles.summaryCell,
            {
              backgroundColor: isDark ? '#1C1517' : '#FFF7ED',
              borderColor: isDark ? '#3E2420' : '#FFEDD5',
            },
          ]}
        >
          <Text style={[styles.summaryCellLabel, { color: isDark ? '#FDBA74' : '#C2410C' }]}>TOTAL DETTES</Text>
          <Text style={[styles.summaryCellValue, { color: isDark ? '#FFFFFF' : '#9A3412' }]}>
            {totalOutstandingDebt.toLocaleString('fr-FR')} <Text style={styles.summaryUnit}>DH</Text>
          </Text>
          <Text style={[styles.summaryCellSub, { color: '#F97316' }]}>À recouvrer</Text>
        </View>

        {/* Total Paiements */}
        <View
          style={[
            styles.summaryCell,
            {
              backgroundColor: isDark ? '#112019' : '#F0FDF4',
              borderColor: isDark ? '#1A3C2F' : '#DCFCE7',
            },
          ]}
        >
          <Text style={[styles.summaryCellLabel, { color: isDark ? '#6EE7B7' : '#047857' }]}>PAIEMENTS</Text>
          <Text style={[styles.summaryCellValue, { color: isDark ? '#FFFFFF' : '#065F46' }]}>
            {totalPaidSum.toLocaleString('fr-FR')} <Text style={styles.summaryUnit}>DH</Text>
          </Text>
          <Text style={[styles.summaryCellSub, { color: '#10B981' }]}>Encaissés</Text>
        </View>
      </View>

      {/* 3. ELEGANT SEARCH BAR */}
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
          <Feather name="search" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInputText, { color: colors.text }]}
            placeholder="Rechercher par nom ou numéro de téléphone..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {!!searchQuery && (
            <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Feather name="x-circle" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* 4. FILTER PILLS & SORT TRIGGER */}
      <View style={styles.filterSortContainer}>
        <View style={styles.filterPillsGroup}>
          <Pressable
            style={[
              styles.filterPill,
              activeFilter === 'all'
                ? { backgroundColor: colors.primary }
                : {
                    backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                    borderColor: isDark ? '#232D3F' : '#E2E8F0',
                    borderWidth: 1,
                  },
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: activeFilter === 'all' ? '#FFFFFF' : colors.text },
              ]}
            >
              Tous ({clients.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterPill,
              activeFilter === 'with_debt'
                ? { backgroundColor: '#F97316' }
                : {
                    backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                    borderColor: isDark ? '#232D3F' : '#E2E8F0',
                    borderWidth: 1,
                  },
            ]}
            onPress={() => setActiveFilter('with_debt')}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: activeFilter === 'with_debt' ? '#FFFFFF' : colors.text },
              ]}
            >
              En dette ({clientsWithDebtCount})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterPill,
              activeFilter === 'settled'
                ? { backgroundColor: '#10B981' }
                : {
                    backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                    borderColor: isDark ? '#232D3F' : '#E2E8F0',
                    borderWidth: 1,
                  },
            ]}
            onPress={() => setActiveFilter('settled')}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: activeFilter === 'settled' ? '#FFFFFF' : colors.text },
              ]}
            >
              Soldés ({clients.length - clientsWithDebtCount})
            </Text>
          </Pressable>
        </View>

        {/* Sort Pill */}
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
          <Feather name="bar-chart-2" size={14} color={colors.primary} />
          <Text style={[styles.sortTriggerText, { color: colors.text }]}>{getSortLabel(activeSort)}</Text>
          <Feather name="chevron-down" size={13} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Sort Dropdown Modal Menu */}
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
          {(['newest', 'highest_debt', 'name_asc', 'oldest'] as const).map((sortKey) => (
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
                  { color: activeSort === sortKey ? colors.primary : colors.text },
                  activeSort === sortKey && { fontWeight: '700' },
                ]}
              >
                {getSortLabel(sortKey)}
              </Text>
              {activeSort === sortKey && <Feather name="check" size={15} color={colors.primary} />}
            </Pressable>
          ))}
        </View>
      )}

      {/* 5. CLIENT LIST (FINTECH ROWS) */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingHint, { color: colors.textSecondary }]}>Chargement de vos clients...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {filteredClients.length === 0 ? (
            /* EMPTY STATES */
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
                    <Feather name="users" size={38} color={colors.primary} />
                  </View>
                  <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                    Aucun client pour le moment
                  </Text>
                  <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
                    Ajoutez votre premier client pour commencer à gérer ses crédits et ses remboursements.
                  </Text>
                  <Pressable
                    style={[styles.emptyStateBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setClientToEdit(null);
                      setClientModalVisible(true);
                    }}
                  >
                    <Feather name="user-plus" size={17} color="#FFFFFF" />
                    <Text style={styles.emptyStateBtnText}>+ Ajouter un client</Text>
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
                    <Feather name="search" size={38} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Aucun client trouvé</Text>
                  <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
                    Aucun client ne correspond à "{searchQuery}".
                  </Text>
                  <Pressable
                    style={[styles.emptyStateBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={styles.emptyStateBtnText}>Réinitialiser la recherche</Text>
                  </Pressable>
                </>
              )}
            </Animatable.View>
          ) : (
            /* CLIENT ROWS CONTAINER */
            <View
              style={[
                styles.clientRowsContainer,
                {
                  backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                  borderColor: isDark ? '#232D3F' : '#E2E8F0',
                },
              ]}
            >
              {filteredClients.map((client, index) => {
                const debt = client.remaining_debt || 0;
                const hasDebt = debt > 0;
                const isLast = index === filteredClients.length - 1;

                return (
                  <Pressable
                    key={client.id}
                    style={({ pressed }) => [
                      styles.clientRowItem,
                      pressed && {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                      },
                      !isLast && {
                        borderBottomWidth: 1,
                        borderBottomColor: isDark ? '#1C2433' : '#F1F5F9',
                      },
                    ]}
                    onPress={() => router.push(`/client/${client.id}` as any)}
                  >
                    {/* Avatar with Status Ring */}
                    <View style={styles.avatarWithRing}>
                      <View
                        style={[
                          styles.rowAvatarCircle,
                          {
                            backgroundColor: hasDebt
                              ? isDark
                                ? '#2D1F1C'
                                : '#FFEDD5'
                              : isDark
                              ? '#132B20'
                              : '#DCFCE7',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rowAvatarInitials,
                            { color: hasDebt ? '#EA580C' : '#059669' },
                          ]}
                        >
                          {getInitials(client.name)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: hasDebt ? '#F97316' : '#10B981' },
                        ]}
                      />
                    </View>

                    {/* Customer Info */}
                    <View style={styles.rowMainInfo}>
                      <Text style={[styles.rowClientName, { color: colors.text }]} numberOfLines={1}>
                        {client.name}
                      </Text>
                      <View style={styles.rowPhoneLine}>
                        <Feather name="phone" size={11} color={colors.textSecondary} />
                        <Text style={[styles.rowClientPhone, { color: colors.textSecondary }]}>
                          {client.phone}
                        </Text>
                        {!!client.address && (
                          <Text style={[styles.rowClientAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                            • {client.address}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Remaining Debt Highlight Pill */}
                    <View style={styles.rowDebtSide}>
                      <Text style={[styles.rowResteLabel, { color: colors.textSecondary }]}>
                        {hasDebt ? 'Reste à payer' : 'Statut'}
                      </Text>
                      <View
                        style={[
                          styles.rowDebtPill,
                          {
                            backgroundColor: hasDebt
                              ? isDark
                                ? 'rgba(249, 115, 22, 0.16)'
                                : '#FFF7ED'
                              : isDark
                              ? 'rgba(16, 185, 129, 0.16)'
                              : '#F0FDF4',
                            borderColor: hasDebt ? '#F97316' : '#10B981',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rowDebtPillText,
                            { color: hasDebt ? '#EA580C' : '#059669' },
                          ]}
                        >
                          {hasDebt ? `${debt.toLocaleString('fr-FR')} DH` : 'Soldé'}
                        </Text>
                      </View>
                    </View>

                    {/* Chevron Indicator */}
                    <Feather name="chevron-right" size={17} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* MODALS */}
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
        title="Supprimer ce client ?"
        message="Cette action supprimera toutes les informations et l'historique de crédit de ce client."
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  newClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  newClientButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  summaryCell: {
    flex: 1,
    borderRadius: 18,
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
  summaryCellLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  summaryCellValue: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },
  summaryUnit: {
    fontSize: 10,
    fontWeight: '700',
  },
  summaryCellSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInputText: {
    flex: 1,
    fontSize: 14,
  },
  filterSortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 8,
    zIndex: 20,
  },
  filterPillsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sortTriggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  sortTriggerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sortDropdownCard: {
    position: 'absolute',
    top: 250,
    right: 20,
    borderRadius: 18,
    borderWidth: 1,
    padding: 6,
    zIndex: 999,
    minWidth: 190,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
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
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingHint: {
    marginTop: 12,
    fontSize: 14,
  },
  listScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  emptyStateCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  emptyStateIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 22,
    maxWidth: 270,
  },
  emptyStateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
  },
  emptyStateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  clientRowsContainer: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  clientRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatarWithRing: {
    position: 'relative',
    marginRight: 14,
  },
  rowAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowAvatarInitials: {
    fontSize: 16,
    fontWeight: '900',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  rowMainInfo: {
    flex: 1,
    paddingRight: 8,
  },
  rowClientName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },
  rowPhoneLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowClientPhone: {
    fontSize: 12,
    fontWeight: '500',
  },
  rowClientAddress: {
    fontSize: 11,
    maxWidth: 100,
  },
  rowDebtSide: {
    alignItems: 'flex-end',
  },
  rowResteLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 3,
  },
  rowDebtPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  rowDebtPillText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
