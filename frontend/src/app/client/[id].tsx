import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useAppAlert } from '@/context/AlertContext';
import { ClientModal, ClientData } from '@/components/ClientModal';
import { TransactionModal } from '@/components/TransactionModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

interface TransactionItem {
  id: number;
  client_id: number;
  type: 'credit' | 'payment';
  amount: number;
  date: string;
  description?: string | null;
  created_at?: string;
}

interface ClientProfileData extends ClientData {
  transactions: TransactionItem[];
}

export default function ClientProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { token } = useAuth();
  const { showAlert } = useAppAlert();
  const isDark = theme === 'dark';

  const [client, setClient] = useState<ClientProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteClientModalVisible, setDeleteClientModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<'credit' | 'payment'>('credit');
  const [deleteTransModalVisible, setDeleteTransModalVisible] = useState(false);
  const [transToDelete, setTransToDelete] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter transactions
  const [transFilter, setTransFilter] = useState<'all' | 'credit' | 'payment'>('all');

  const fetchClientProfile = useCallback(async () => {
    if (!id || !token) return;
    try {
      const res = await fetch(`http://localhost:3000/api/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Client introuvable');
      }
      const data = await res.json();
      setClient(data);
    } catch (err: any) {
      console.error(err);
      showAlert('error', 'Erreur', err.message || 'Impossible de charger le profil.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchClientProfile();
  }, [fetchClientProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClientProfile();
  };

  const handleDeleteClient = async () => {
    if (!client?.id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/clients/${client.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
      showAlert('success', 'Client supprimé', 'Le client et ses transactions ont été supprimés.');
      setDeleteClientModalVisible(false);
      router.back();
    } catch (err: any) {
      showAlert('error', 'Erreur', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/transactions/${transToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      showAlert('success', 'Transaction supprimée', 'La transaction a été supprimée.');
      setDeleteTransModalVisible(false);
      setTransToDelete(null);
      fetchClientProfile();
    } catch (err: any) {
      showAlert('error', 'Erreur', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openCall = () => {
    if (client?.phone) {
      Linking.openURL(`tel:${client.phone}`);
    }
  };

  const openWhatsApp = () => {
    if (client?.phone) {
      const cleanPhone = client.phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('0') ? '212' + cleanPhone.slice(1) : cleanPhone;
      Linking.openURL(`https://wa.me/${formattedPhone}`);
    }
  };

  const filteredTransactions = (client?.transactions || []).filter((t) => {
    if (transFilter === 'credit') return t.type === 'credit';
    if (transFilter === 'payment') return t.type === 'payment';
    return true;
  });

  const getInitials = (name?: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0A0E17' : '#F8FAFC' }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement de la fiche client...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0A0E17' : '#F8FAFC' }]}>
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={48} color="#EF4444" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Client introuvable</Text>
          <Pressable style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Retour à l'Explorateur</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const totalCredit = Number(client.total_credit) || 0;
  const totalPaid = Number(client.total_paid) || 0;
  const remainingDebt = Number(client.remaining_debt) || (totalCredit - totalPaid);
  const hasDebt = remainingDebt > 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0A0E17' : '#F8FAFC' }]}>
      {/* 1. TOP NAV BAR */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: isDark ? '#101522' : '#FFFFFF',
            borderBottomColor: isDark ? '#1C2433' : '#E2E8F0',
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.navBackBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
          <Text style={[styles.navBackText, { color: colors.text }]}>Retour</Text>
        </Pressable>

        <View style={styles.topActions}>
          <Pressable
            style={[styles.topActionBtn, { backgroundColor: isDark ? '#1A2232' : '#F1F5F9' }]}
            onPress={() => setEditModalVisible(true)}
          >
            <Feather name="edit-2" size={17} color={colors.text} />
          </Pressable>
          <Pressable
            style={[styles.topActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
            onPress={() => setDeleteClientModalVisible(true)}
          >
            <Feather name="trash-2" size={17} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. CUSTOMER HERO CARD */}
        <Animatable.View
          animation="fadeInDown"
          style={[
            styles.heroCustomerCard,
            {
              backgroundColor: isDark ? '#141A26' : '#FFFFFF',
              borderColor: isDark ? '#232D3F' : '#E2E8F0',
            },
          ]}
        >
          <View
            style={[
              styles.heroAvatarCircle,
              {
                backgroundColor: hasDebt
                  ? isDark
                    ? '#2E1E1B'
                    : '#FFEDD5'
                  : isDark
                  ? '#112B1E'
                  : '#DCFCE7',
              },
            ]}
          >
            <Text
              style={[
                styles.heroAvatarInitials,
                { color: hasDebt ? '#EA580C' : '#059669' },
              ]}
            >
              {getInitials(client.name)}
            </Text>
          </View>

          <Text style={[styles.heroName, { color: colors.text }]}>{client.name}</Text>
          
          <View style={styles.heroPhoneRow}>
            <Feather name="phone" size={13} color={colors.textSecondary} />
            <Text style={[styles.heroPhone, { color: colors.textSecondary }]}>{client.phone}</Text>
          </View>

          {/* Quick Contact Action Pills */}
          <View style={styles.quickContactPills}>
            <Pressable style={[styles.contactPill, { backgroundColor: '#10B981' }]} onPress={openWhatsApp}>
              <FontAwesome5 name="whatsapp" size={15} color="#FFFFFF" />
              <Text style={styles.contactPillText}>WhatsApp</Text>
            </Pressable>
            <Pressable style={[styles.contactPill, { backgroundColor: colors.primary }]} onPress={openCall}>
              <Feather name="phone-call" size={15} color="#FFFFFF" />
              <Text style={styles.contactPillText}>Appeler</Text>
            </Pressable>
          </View>
        </Animatable.View>

        {/* 3. HERO FINANCIAL OVERVIEW (Reste à payer + Dette totale + Total payé) */}
        <Animatable.View
          animation="fadeInUp"
          style={[
            styles.financialOverviewCard,
            {
              backgroundColor: isDark ? '#141A26' : '#FFFFFF',
              borderColor: isDark ? '#232D3F' : '#E2E8F0',
            },
          ]}
        >
          {/* Top Hero: RESTE À PAYER */}
          <View
            style={[
              styles.resteHeroBlock,
              {
                backgroundColor: hasDebt
                  ? isDark
                    ? '#271714'
                    : '#FFF7ED'
                  : isDark
                  ? '#0E241A'
                  : '#F0FDF4',
                borderColor: hasDebt ? '#F97316' : '#10B981',
              },
            ]}
          >
            <View style={styles.resteHeaderRow}>
              <Text
                style={[
                  styles.resteHeaderLabel,
                  { color: hasDebt ? '#EA580C' : '#059669' },
                ]}
              >
                RESTE À PAYER
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: hasDebt ? '#EA580C' : '#059669' },
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {hasDebt ? 'Dette active' : 'Compte Soldé'}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.hugeResteValue,
                { color: hasDebt ? (isDark ? '#FFA07A' : '#9A3412') : (isDark ? '#6EE7B7' : '#047857') },
              ]}
            >
              {remainingDebt.toLocaleString('fr-FR')} <Text style={styles.hugeResteUnit}>DH</Text>
            </Text>
          </View>

          {/* Bottom Split Sub-Metrics */}
          <View style={styles.subMetricsRow}>
            {/* Dette Totale */}
            <View style={[styles.subMetricCell, { borderRightWidth: 1, borderRightColor: isDark ? '#232D3F' : '#E2E8F0' }]}>
              <View style={styles.subMetricLabelRow}>
                <View style={[styles.tinyDot, { backgroundColor: '#F97316' }]} />
                <Text style={[styles.subMetricLabel, { color: colors.textSecondary }]}>DETTE TOTALE</Text>
              </View>
              <Text style={[styles.subMetricValue, { color: colors.text }]}>
                {totalCredit.toLocaleString('fr-FR')} <Text style={styles.subMetricUnit}>DH</Text>
              </Text>
            </View>

            {/* Total Payé */}
            <View style={styles.subMetricCell}>
              <View style={styles.subMetricLabelRow}>
                <View style={[styles.tinyDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.subMetricLabel, { color: colors.textSecondary }]}>TOTAL PAYÉ</Text>
              </View>
              <Text style={[styles.subMetricValue, { color: '#10B981' }]}>
                {totalPaid.toLocaleString('fr-FR')} <Text style={styles.subMetricUnit}>DH</Text>
              </Text>
            </View>
          </View>
        </Animatable.View>

        {/* 4. MAIN ACTION BUTTONS (+ Ajouter un crédit & 💰 Enregistrer un paiement) */}
        <View style={styles.mainActionsGrid}>
          <Pressable
            style={[styles.primaryActionBtn, styles.creditPrimaryBtn]}
            onPress={() => {
              setTransactionType('credit');
              setTransactionModalVisible(true);
            }}
          >
            <Feather name="plus-circle" size={19} color="#FFFFFF" />
            <Text style={styles.primaryActionBtnText}>Ajouter un crédit</Text>
          </Pressable>

          <Pressable
            style={[styles.primaryActionBtn, styles.paymentPrimaryBtn]}
            onPress={() => {
              setTransactionType('payment');
              setTransactionModalVisible(true);
            }}
          >
            <FontAwesome5 name="hand-holding-usd" size={17} color="#FFFFFF" />
            <Text style={styles.primaryActionBtnText}>Enregistrer un paiement</Text>
          </Pressable>
        </View>

        {/* 5. INFORMATIONS DU CLIENT */}
        <View
          style={[
            styles.infoCardWrapper,
            {
              backgroundColor: isDark ? '#141A26' : '#FFFFFF',
              borderColor: isDark ? '#232D3F' : '#E2E8F0',
            },
          ]}
        >
          <View
            style={[
              styles.infoCardHeader,
              { borderBottomColor: isDark ? '#1E2738' : '#F1F5F9' },
            ]}
          >
            <Text style={[styles.infoSectionTitle, { color: colors.text }]}>Informations du client</Text>
            <Pressable style={styles.editActionLink} onPress={() => setEditModalVisible(true)}>
              <Feather name="edit-2" size={13} color={colors.primary} />
              <Text style={[styles.editActionLinkText, { color: colors.primary }]}>Modifier</Text>
            </Pressable>
          </View>

          <View style={styles.infoFieldsList}>
            <View style={styles.infoFieldRow}>
              <Text style={[styles.infoFieldLabel, { color: colors.textSecondary }]}>Nom complet</Text>
              <Text style={[styles.infoFieldValue, { color: colors.text }]}>{client.name}</Text>
            </View>

            <View style={styles.infoFieldRow}>
              <Text style={[styles.infoFieldLabel, { color: colors.textSecondary }]}>Téléphone</Text>
              <Text style={[styles.infoFieldValue, { color: colors.text }]}>{client.phone}</Text>
            </View>

            <View style={styles.infoFieldRow}>
              <Text style={[styles.infoFieldLabel, { color: colors.textSecondary }]}>Adresse</Text>
              <Text style={[styles.infoFieldValue, { color: colors.text }]}>
                {client.address || 'Non renseignée'}
              </Text>
            </View>

            <View style={styles.infoFieldRow}>
              <Text style={[styles.infoFieldLabel, { color: colors.textSecondary }]}>Date d'ajout</Text>
              <Text style={[styles.infoFieldValue, { color: colors.text }]}>
                {formatDateDisplay(client.created_at)}
              </Text>
            </View>

            {!!client.note && (
              <View style={styles.infoFieldRow}>
                <Text style={[styles.infoFieldLabel, { color: colors.textSecondary }]}>Note</Text>
                <Text style={[styles.infoFieldValue, { color: colors.text }]}>{client.note}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 6. VERTICAL FINANCIAL TIMELINE */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeaderRow}>
            <View>
              <Text style={[styles.timelineSectionTitle, { color: colors.text }]}>
                Historique des transactions
              </Text>
              <Text style={[styles.timelineSubtitle, { color: colors.textSecondary }]}>
                Journal chronologique des crédits et encaissements
              </Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.timelineFilterTabs}>
              {(['all', 'credit', 'payment'] as const).map((tabKey) => {
                const isSelected = transFilter === tabKey;
                const label = tabKey === 'all' ? 'Tous' : tabKey === 'credit' ? 'Crédits' : 'Paiements';
                return (
                  <Pressable
                    key={tabKey}
                    style={[
                      styles.timelineFilterPill,
                      isSelected
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: isDark ? '#1C2433' : '#F1F5F9' },
                    ]}
                    onPress={() => setTransFilter(tabKey)}
                  >
                    <Text
                      style={[
                        styles.timelineFilterPillText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Timeline List */}
          {filteredTransactions.length === 0 ? (
            <View
              style={[
                styles.emptyTimelineCard,
                {
                  backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                  borderColor: isDark ? '#232D3F' : '#E2E8F0',
                },
              ]}
            >
              <Feather name="clock" size={32} color={colors.textSecondary} />
              <Text style={[styles.emptyTimelineTitle, { color: colors.text }]}>
                Aucune transaction enregistrée
              </Text>
              <Text style={[styles.emptyTimelineDesc, { color: colors.textSecondary }]}>
                Ajoutez un crédit ou un versement pour commencer à suivre les mouvements financiers.
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.timelineContainerCard,
                {
                  backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                  borderColor: isDark ? '#232D3F' : '#E2E8F0',
                },
              ]}
            >
              {filteredTransactions.map((t, idx) => {
                const isCredit = t.type === 'credit';
                const isLast = idx === filteredTransactions.length - 1;

                return (
                  <View key={t.id} style={styles.timelineRow}>
                    {/* Left Column: Date */}
                    <View style={styles.timelineDateColumn}>
                      <Text style={[styles.timelineDateDay, { color: colors.text }]}>
                        {formatDateDisplay(t.date).slice(0, 5)}
                      </Text>
                      <Text style={[styles.timelineDateYear, { color: colors.textSecondary }]}>
                        {formatDateDisplay(t.date).slice(6)}
                      </Text>
                    </View>

                    {/* Timeline Line & Node */}
                    <View style={styles.timelineNodeAxis}>
                      <View
                        style={[
                          styles.timelineNodeDot,
                          {
                            backgroundColor: isCredit ? '#F97316' : '#10B981',
                            borderColor: isDark ? '#141A26' : '#FFFFFF',
                          },
                        ]}
                      />
                      {!isLast && (
                        <View
                          style={[
                            styles.timelineVerticalLine,
                            { backgroundColor: isDark ? '#232D3F' : '#E2E8F0' },
                          ]}
                        />
                      )}
                    </View>

                    {/* Right Column: Transaction Box */}
                    <View style={styles.timelineContentBox}>
                      <View style={styles.timelineMainLine}>
                        <View>
                          <Text style={[styles.timelineTypeTitle, { color: colors.text }]}>
                            {isCredit ? 'Crédit accordé' : 'Paiement reçu'}
                          </Text>
                          {!!t.description && (
                            <Text style={[styles.timelineDescText, { color: colors.textSecondary }]}>
                              {t.description}
                            </Text>
                          )}
                        </View>

                        <View style={styles.timelineAmountColumn}>
                          <Text
                            style={[
                              styles.timelineAmountText,
                              { color: isCredit ? '#EA580C' : '#059669' },
                            ]}
                          >
                            {isCredit ? '+' : '-'}
                            {t.amount.toLocaleString('fr-FR')} DH
                          </Text>

                          <Pressable
                            style={styles.deleteTransIconBtn}
                            onPress={() => {
                              setTransToDelete(t.id);
                              setDeleteTransModalVisible(true);
                            }}
                          >
                            <Feather name="trash" size={13} color={colors.textSecondary} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODALS */}
      <ClientModal
        visible={editModalVisible}
        client={client}
        onClose={() => setEditModalVisible(false)}
        onSuccess={() => fetchClientProfile()}
      />

      <TransactionModal
        visible={transactionModalVisible}
        type={transactionType}
        client={client}
        onClose={() => setTransactionModalVisible(false)}
        onSuccess={() => fetchClientProfile()}
      />

      <DeleteConfirmModal
        visible={deleteClientModalVisible}
        title="Supprimer ce client ?"
        message="Cette action supprimera définitivement le profil et toutes les transactions liées à ce client."
        loading={actionLoading}
        onCancel={() => setDeleteClientModalVisible(false)}
        onConfirm={handleDeleteClient}
      />

      <DeleteConfirmModal
        visible={deleteTransModalVisible}
        title="Supprimer cette transaction ?"
        message="Cette action recalculera automatiquement les soldes et la dette restante du client."
        loading={actionLoading}
        onCancel={() => {
          setDeleteTransModalVisible(false);
          setTransToDelete(null);
        }}
        onConfirm={handleDeleteTransaction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 20,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingRight: 12,
  },
  navBackText: {
    fontSize: 15,
    fontWeight: '700',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  topActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCustomerCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroAvatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroAvatarInitials: {
    fontSize: 24,
    fontWeight: '900',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  heroPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  heroPhone: {
    fontSize: 13,
    fontWeight: '500',
  },
  quickContactPills: {
    flexDirection: 'row',
    gap: 10,
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contactPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  financialOverviewCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  resteHeroBlock: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  resteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  resteHeaderLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  hugeResteValue: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  hugeResteUnit: {
    fontSize: 20,
    fontWeight: '800',
  },
  subMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subMetricCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  subMetricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  tinyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  subMetricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  subMetricUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  mainActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  creditPrimaryBtn: {
    backgroundColor: '#2563EB',
  },
  paymentPrimaryBtn: {
    backgroundColor: '#10B981',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  infoCardWrapper: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  infoSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  editActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editActionLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoFieldsList: {
    gap: 10,
  },
  infoFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoFieldLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoFieldValue: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  timelineSection: {
    marginTop: 4,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timelineSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  timelineSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  timelineFilterTabs: {
    flexDirection: 'row',
    gap: 4,
  },
  timelineFilterPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  timelineFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyTimelineCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  emptyTimelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  emptyTimelineDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  timelineContainerCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 64,
  },
  timelineDateColumn: {
    width: 44,
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  timelineDateDay: {
    fontSize: 12,
    fontWeight: '800',
  },
  timelineDateYear: {
    fontSize: 10,
  },
  timelineNodeAxis: {
    width: 24,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  timelineNodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 4,
    zIndex: 2,
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    marginTop: 2,
  },
  timelineContentBox: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 16,
  },
  timelineMainLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  timelineTypeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  timelineDescText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  timelineAmountColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timelineAmountText: {
    fontSize: 15,
    fontWeight: '900',
  },
  deleteTransIconBtn: {
    padding: 3,
  },
});
