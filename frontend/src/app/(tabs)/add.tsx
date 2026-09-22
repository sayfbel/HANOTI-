import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ClientModal, ClientData } from '@/components/ClientModal';
import { TransactionModal } from '@/components/TransactionModal';

export default function QuickActionsScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { token } = useAuth();
  const isDark = theme === 'dark';

  const [clients, setClients] = useState<ClientData[]>([]);

  // Modals
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<'credit' | 'payment'>('credit');

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:3000/api/clients', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch((err) => console.error(err));
  }, [token, clientModalVisible, transactionModalVisible]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0A0E17' : '#F8FAFC' }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Actions Rapides</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enregistrez instantanément une opération financière
          </Text>
        </View>

        {/* 3 Action Cards */}
        <View style={styles.cardsContainer}>
          {/* 1. Ajouter un client */}
          <Animatable.View animation="fadeInUp" delay={80}>
            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                {
                  backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                  borderColor: isDark ? '#232D3F' : '#E2E8F0',
                },
                pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
              ]}
              onPress={() => setClientModalVisible(true)}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF' },
                ]}
              >
                <Feather name="user-plus" size={24} color={colors.primary} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>Ajouter un client</Text>
                <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                  Créez une nouvelle fiche client avec nom et téléphone
                </Text>
              </View>
              <View style={[styles.actionArrowCircle, { backgroundColor: isDark ? '#1F2736' : '#F1F5F9' }]}>
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </View>
            </Pressable>
          </Animatable.View>

          {/* 2. Ajouter un crédit */}
          <Animatable.View animation="fadeInUp" delay={160}>
            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                {
                  backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                  borderColor: isDark ? '#232D3F' : '#E2E8F0',
                },
                pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
              ]}
              onPress={() => {
                setTransactionType('credit');
                setTransactionModalVisible(true);
              }}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.18)' : '#FFF7ED' },
                ]}
              >
                <Feather name="plus-circle" size={24} color="#F97316" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>Ajouter un crédit</Text>
                <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                  Enregistrez des achats à crédit pour un client
                </Text>
              </View>
              <View style={[styles.actionArrowCircle, { backgroundColor: isDark ? '#1F2736' : '#F1F5F9' }]}>
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </View>
            </Pressable>
          </Animatable.View>

          {/* 3. Enregistrer un paiement */}
          <Animatable.View animation="fadeInUp" delay={240}>
            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                {
                  backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                  borderColor: isDark ? '#232D3F' : '#E2E8F0',
                },
                pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
              ]}
              onPress={() => {
                setTransactionType('payment');
                setTransactionModalVisible(true);
              }}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#F0FDF4' },
                ]}
              >
                <FontAwesome5 name="hand-holding-usd" size={20} color="#10B981" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>Enregistrer un paiement</Text>
                <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                  Déduisez un versement ou remboursement de la dette
                </Text>
              </View>
              <View style={[styles.actionArrowCircle, { backgroundColor: isDark ? '#1F2736' : '#F1F5F9' }]}>
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </View>
            </Pressable>
          </Animatable.View>
        </View>

        {/* Explore shortcut button */}
        <Animatable.View animation="fadeInUp" delay={320} style={{ marginTop: 24 }}>
          <Pressable
            style={[
              styles.exploreShortcut,
              {
                backgroundColor: isDark ? '#161C28' : '#F1F5F9',
                borderColor: isDark ? '#263044' : '#E2E8F0',
              },
            ]}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Feather name="users" size={17} color={colors.primary} />
            <Text style={[styles.exploreShortcutText, { color: colors.primary }]}>
              Voir tous les clients dans l'Explorateur
            </Text>
          </Pressable>
        </Animatable.View>
      </ScrollView>

      {/* MODALS */}
      <ClientModal
        visible={clientModalVisible}
        onClose={() => setClientModalVisible(false)}
        onSuccess={(newClient) => {
          if (newClient?.id) {
            router.push(`/client/${newClient.id}` as any);
          } else {
            router.push('/(tabs)/search');
          }
        }}
      />

      <TransactionModal
        visible={transactionModalVisible}
        type={transactionType}
        clientsList={clients}
        onClose={() => setTransactionModalVisible(false)}
        onSuccess={(trans) => {
          if (trans?.client_id) {
            router.push(`/client/${trans.client_id}` as any);
          } else {
            router.push('/(tabs)/search');
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
  container: {
    padding: 20,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardsContainer: {
    gap: 14,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
    paddingRight: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },
  actionDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  exploreShortcutText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
