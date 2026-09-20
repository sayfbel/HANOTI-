import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/ui/PageHeader';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const styles = useMemo(() => getStyles(colors), [colors]);

  const SubscriptionCard = ({ title, desc, price, color, icon, isPopular }: any) => (
    <View style={[styles.card, { borderColor: color }]}>
      {isPopular && (
        <View style={[styles.popularBadge, { backgroundColor: color }]}>
          <Text style={styles.popularText}>Most Popular</Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}1A` }]}>
          <Feather name={icon} size={28} color={color} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardDesc}>{desc}</Text>
      <Text style={styles.priceText}>{price} <Text style={styles.pricePeriod}>/ month</Text></Text>
      <Pressable style={[styles.selectButton, { backgroundColor: color }]}>
        <Text style={styles.selectButtonText}>{t('subscription.select')}</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <PageHeader title={t('subscription.title')} showBackButton />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <SubscriptionCard 
          title={t('subscription.basic')}
          desc={t('subscription.basicDesc')}
          price="99 MAD"
          color="#00C9FF"
          icon="check-circle"
        />

        <SubscriptionCard 
          title={t('subscription.premium')}
          desc={t('subscription.premiumDesc')}
          price="199 MAD"
          color="#0B308D"
          icon="star"
          isPopular={true}
        />

        <SubscriptionCard 
          title={t('subscription.diamond')}
          desc={t('subscription.diamondDesc')}
          price="399 MAD"
          color="#007ACC"
          icon="award"
        />

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
    gap: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  cardDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  priceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  pricePeriod: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
  selectButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
