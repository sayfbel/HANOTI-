import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, SafeAreaView, Dimensions, Alert, Image, ActivityIndicator } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';

const { width } = Dimensions.get('window');

type PlanType = 'basic' | 'premium' | 'diamond';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, token } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('premium');
  const [profileData, setProfileData] = useState<any>(null);
  const [savedCard, setSavedCard] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const styles = useMemo(() => getStyles(colors), [colors]);

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          if (!token) {
            setLoadingProfile(false);
            return;
          }
          const res = await fetch('http://localhost:3000/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setProfileData(data);
          }

          const cardRes = await fetch('http://localhost:3000/user/credit-card', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (cardRes.ok) {
            const cardData = await cardRes.json();
            setSavedCard(cardData);
          }
        } catch (err) {
          console.error('Failed to fetch profile', err);
        } finally {
          setLoadingProfile(false);
        }
      };
      
      fetchProfile();
    }, [token])
  );

  const userName = profileData?.first_name 
    ? `${profileData.first_name} ${profileData.last_name || ''}`.trim() 
    : user?.first_name 
      ? `${user.first_name} ${user.last_name || ''}`.trim() 
      : 'Valued User';

  const handleCardPress = () => {
    if (savedCard) {
      router.push({
        pathname: '/add-card',
        params: {
          isUpdate: 'true',
          cardholder_name: savedCard.cardholder_name || '',
          last_four: savedCard.last_four || '',
          expiry_date: savedCard.expiry_date || '',
          card_type: savedCard.card_type || ''
        }
      });
    }
  };

  const customId = profileData?.custom_id || '@newuser';
  
  const currentPlan = profileData?.subscription_plan 
    ? profileData.subscription_plan.charAt(0).toUpperCase() + profileData.subscription_plan.slice(1)
    : 'Free Plan';


  const plans = {
    basic: {
      id: 'basic',
      title: t('subscription.basic'), // "Basic Pack"
      desc: t('subscription.basicDesc'), // "Essential features..."
      price: '99 MAD',
      color: '#00C9FF',
      icon: 'check-circle' as any,
      features: ['Up to 50 clients', 'Basic reporting', 'Email support']
    },
    premium: {
      id: 'premium',
      title: t('subscription.premium'),
      desc: t('subscription.premiumDesc'),
      price: '199 MAD',
      color: '#0B308D',
      icon: 'star' as any,
      features: ['Unlimited clients', 'Advanced analytics', 'Priority support', 'Custom branding']
    },
    diamond: {
      id: 'diamond',
      title: t('subscription.diamond'),
      desc: t('subscription.diamondDesc'),
      price: '399 MAD',
      color: '#8A2BE2',
      icon: 'award' as any,
      features: ['All Premium features', 'Dedicated account manager', 'API access', 'SLA guarantee']
    }
  };

  const activePlanData = plans[selectedPlan];

  return (
    <SafeAreaView style={styles.safeArea}>
      <PageHeader title={t('subscription.title')} showBackButton />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Top Section: User Info & Current Plan */}
        <View style={styles.userInfoSection}>
          <View style={styles.userHeader}>
            {loadingProfile ? (
               <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 16 }} />
            ) : profileData?.avatar_url ? (
              <Image source={{ uri: `http://localhost:3000${profileData.avatar_url}` }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarMock}>
                <Text style={styles.avatarInitials}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.greetingText}>{userName}</Text>
              <Text style={styles.customIdText}>{customId}</Text>
            </View>
            <View style={styles.currentPlanBadge}>
              <Feather name="shield" size={14} color="#054687" />
              <Text style={styles.currentPlanText}>{currentPlan}</Text>
            </View>
          </View>

          {/* Payment Method Section */}
          <Text style={styles.sectionTitle}>Payment Method</Text>

          {savedCard && (
            <Pressable style={styles.savedCardContainer} onPress={handleCardPress}>
              <View style={styles.savedCardHeader}>
                <FontAwesome5 
                  name={savedCard.card_type === 'Visa' ? 'cc-visa' : savedCard.card_type === 'Mastercard' ? 'cc-mastercard' : 'credit-card'} 
                  size={28} 
                  color="#0B308D" 
                />
                <Text style={styles.savedCardType}>{savedCard.card_type}</Text>
              </View>
              <View style={styles.savedCardDetails}>
                <Text style={styles.savedCardNumber}>•••• •••• •••• {savedCard.last_four}</Text>
                <Text style={styles.savedCardExpiry}>Expires: {savedCard.expiry_date}</Text>
              </View>
            </Pressable>
          )}

          {!savedCard && (
            <Pressable 
              style={styles.addCardButton} 
              onPress={() => router.push('/add-card')}
            >
              <View style={styles.cardIconWrapper}>
                <FontAwesome5 name="credit-card" size={24} color="#fff" />
              </View>
              <View style={styles.cardButtonTextWrapper}>
                <Text style={styles.addCardTitle}>Add Credit Card</Text>
                <Text style={styles.addCardSubtitle}>Securely pay online</Text>
              </View>
              <Feather name="chevron-right" size={24} color="#0B308D" style={styles.cardArrow} />
            </Pressable>
          )}
        </View>

        <View style={styles.divider} />

        {/* Bottom Section: Plan Selection */}
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          {(Object.keys(plans) as PlanType[]).map((key) => {
            const isActive = selectedPlan === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: plans[key].color }
                ]}
                onPress={() => setSelectedPlan(key)}
              >
                <Text style={[
                  styles.tabText,
                  isActive && styles.tabTextActive
                ]}>
                  {plans[key].title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Selected Plan Details */}
        <View style={[styles.planDetailsCard, { borderColor: activePlanData.color }]}>
          {selectedPlan === 'premium' && (
            <View style={[styles.popularBadge, { backgroundColor: activePlanData.color }]}>
              <Text style={styles.popularText}>Most Popular</Text>
            </View>
          )}
          
          <View style={styles.planHeader}>
            <View style={[styles.planIconContainer, { backgroundColor: `${activePlanData.color}1A` }]}>
              <Feather name={activePlanData.icon} size={32} color={activePlanData.color} />
            </View>
            <View style={styles.planTitleWrapper}>
              <Text style={styles.planTitle}>{activePlanData.title}</Text>
              <Text style={styles.planPrice}>
                {activePlanData.price} <Text style={styles.planPricePeriod}>/ month</Text>
              </Text>
            </View>
          </View>
          
          <Text style={styles.planDesc}>{activePlanData.desc}</Text>
          
          <View style={styles.featuresList}>
            {activePlanData.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Feather name="check" size={20} color={activePlanData.color} style={styles.featureCheck} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.selectButton, 
              { backgroundColor: activePlanData.color, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Text style={styles.selectButtonText}>Upgrade to {activePlanData.title}</Text>
          </Pressable>
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
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  userInfoSection: {
    marginBottom: 24,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#0B308D',
  },
  avatarMock: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0B308D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarInitials: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  customIdText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  currentPlanText: {
    color: '#054687',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  savedCardContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 20,
  },
  savedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  savedCardType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B308D',
    marginLeft: 10,
  },
  savedCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedCardNumber: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    letterSpacing: 1,
  },
  savedCardExpiry: {
    fontSize: 13,
    color: '#64748B',
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 16,
  },
  cardIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0B308D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardButtonTextWrapper: {
    flex: 1,
  },
  addCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  addCardSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  addIcon: {
    opacity: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 6,
    borderRadius: 30,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 24,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
  },
  planDetailsCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    position: 'relative',
    minHeight: 300,
  },
  popularBadge: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1,
  },
  popularText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  planIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planTitleWrapper: {
    flex: 1,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  planPricePeriod: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
  planDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  featuresList: {
    marginBottom: 32,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureCheck: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  selectButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  selectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
