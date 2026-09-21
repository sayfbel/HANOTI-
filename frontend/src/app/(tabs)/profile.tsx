import { useRouter } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, SafeAreaView, ActivityIndicator, Image, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAppAlert } from '../../context/AlertContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { showAlert } = useAppAlert();
  
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  const styles = useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
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
    
    // Refresh when screen comes into focus if possible, but simple mount is okay for now
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const displayName = profileData?.first_name 
    ? `${profileData.first_name} ${profileData.last_name || ''}`.trim() 
    : t('settings.unknownUser');
  
  const handle = profileData?.custom_id || (profileData?.first_name && profileData?.last_name 
    ? `@${profileData.first_name.toLowerCase()}${profileData.last_name.toLowerCase()}`.replace(/\s+/g, '') 
    : '@newuser');

  return (
    <SafeAreaView style={styles.safeArea}>
      <PageHeader 
        title={t('profile.title')} 
        rightComponent={
          <Pressable onPress={() => router.push('/settings')} style={styles.settingsBtn}>
            <Feather name="settings" size={24} color={colors.text} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* User Info Section */}
        <View style={styles.userInfoContainer}>
          <View style={styles.avatarContainer}>
            {profileData?.avatar_url ? (
               <Image source={{ uri: `http://localhost:3000${profileData.avatar_url}` }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarMock}>
                <Feather name="user" size={40} color="#FFFFFF" />
              </View>
            )}
          </View>
          
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{displayName}</Text>
            {profileData?.custom_id && (
              <Feather name="check-circle" size={18} color="#00C9FF" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>{handle}</Text>
        </View>

        {/* Global Stats - Wallet Style */}
        <View style={styles.walletCard}>
          <Text style={styles.walletTitle}>Crédit en cours</Text>
          <Text style={styles.walletAmount}>0 <Text style={styles.walletCurrency}>DH</Text></Text>
          
          <View style={styles.walletDivider} />
          
          <View style={styles.walletBottomRow}>
            <View style={styles.walletSubStat}>
              <Text style={styles.walletSubLabel}>Reçus ce mois</Text>
              <Text style={styles.walletSubValue}>0 DH</Text>
            </View>
            <View style={styles.walletSubStatRight}>
              <Text style={styles.walletSubLabel}>Clients actifs</Text>
              <Text style={styles.walletSubValue}>0</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
        </View>
        <View style={styles.actionsGrid}>
          <Pressable style={styles.actionBtn} onPress={() => showAlert('info', "Export", "Fonction d'export à venir")}>
            <View style={styles.actionIconContainer}>
              <Feather name="file-text" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionBtnText}>Exporter</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => showAlert('info', "Rappels", "Fonction d'envoi de SMS à venir")}>
            <View style={styles.actionIconContainer}>
              <Feather name="bell" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionBtnText}>Rappels</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => showAlert('info', "Archives", "Liste des clients archivés à venir")}>
            <View style={styles.actionIconContainer}>
              <Feather name="archive" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionBtnText}>Archivés</Text>
          </Pressable>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activité Récente</Text>
        </View>
        <View style={styles.activityContainer}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="arrow-up-right" size={20} color={colors.danger} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Nouveau crédit ajouté</Text>
              <Text style={styles.activitySubtitle}>Ali Youssef</Text>
            </View>
            <View style={styles.activityRight}>
              <Text style={[styles.activityAmount, { color: colors.danger }]}>-50 DH</Text>
              <Text style={styles.activityTime}>Il y a 2h</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#D1FAE5' }]}>
              <Feather name="arrow-down-left" size={20} color="#10B981" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Paiement reçu</Text>
              <Text style={styles.activitySubtitle}>Fatima Zahra</Text>
            </View>
            <View style={styles.activityRight}>
              <Text style={[styles.activityAmount, { color: '#10B981' }]}>+150 DH</Text>
              <Text style={styles.activityTime}>Hier</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#E0F2FE' }]}>
              <Feather name="user-plus" size={20} color={colors.primary} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Nouveau client</Text>
              <Text style={styles.activitySubtitle}>Karim M.</Text>
            </View>
            <View style={styles.activityRight}>
              <Text style={styles.activityAmount}></Text>
              <Text style={styles.activityTime}>Hier</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  settingsBtn: {
    padding: 4,
  },
  scrollContainer: {
    paddingBottom: 110,
  },
  userInfoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarImage: {
    width: 100, 
    height: 100, 
    borderRadius: 50,
    borderWidth: 3, 
    borderColor: colors.background,
  },
  avatarMock: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsBold: {
    fontWeight: 'bold',
    color: colors.text,
  },
  walletCard: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  walletTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  walletAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  walletCurrency: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  walletDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 20,
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
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginBottom: 4,
  },
  walletSubValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: colors.surface,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activityContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textSecondary,
  }
});
