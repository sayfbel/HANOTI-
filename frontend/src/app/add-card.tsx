import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Animated } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';

export default function AddCardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { token } = useAuth();

  const styles = useMemo(() => getStyles(colors), [colors]);

  const params = useLocalSearchParams();
  const { isUpdate, cardholder_name, last_four, expiry_date, card_type: passedCardType } = params;

  const [cardNumber, setCardNumber] = useState(last_four ? `**** **** **** ${last_four}` : '');
  const [expiry, setExpiry] = useState((expiry_date as string) || '');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState((cardholder_name as string) || '');
  const [saving, setSaving] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const flipAnim = useRef(new Animated.Value(0)).current;

  const flipCard = (toBack: boolean) => {
    setIsFlipped(toBack);
    Animated.timing(flipAnim, {
      toValue: toBack ? 180 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  const getCardType = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    
    const prefix2 = parseInt(cleaned.substring(0, 2), 10);
    const prefix4 = parseInt(cleaned.substring(0, 4), 10);
    if (prefix2 >= 51 && prefix2 <= 55) return 'Mastercard';
    if (prefix4 >= 2221 && prefix4 <= 2720) return 'Mastercard';
    
    return 'Unknown';
  };

  const cardType = passedCardType && cardNumber.includes('*') 
    ? (passedCardType as string) 
    : getCardType(cardNumber);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/.{1,4}/g);
    setCardNumber(match ? match.join(' ') : cleaned);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  const handleSave = async () => {
    if (!cardNumber || !expiry || !name) {
      Alert.alert('Error', 'Please fill in all details');
      return;
    }
    
    setSaving(true);
    const lastFour = cardNumber.includes('*') ? (last_four as string) : cardNumber.replace(/\D/g, '').slice(-4);
    
    try {
      const res = await fetch('http://localhost:3000/user/credit-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardholder_name: name,
          last_four: lastFour,
          expiry_date: expiry,
          card_type: cardType
        })
      });
      
      if (res.ok) {
        Alert.alert('Success', 'Credit card saved securely!');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push('/subscription');
        }
      } else {
        const errorData = await res.json();
        Alert.alert('Error', errorData.message || 'Failed to save card');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <PageHeader title={isUpdate === 'true' ? "Update Payment Method" : "Add Payment Method"} showBackButton />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Card Mockup Container */}
          <View style={{ position: 'relative', height: 200, marginBottom: 32, perspective: 1000 } as any}>
            {/* Front of Card */}
            <Animated.View style={[styles.cardMockup, frontAnimatedStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, marginBottom: 0, backfaceVisibility: 'hidden' }]}>
              <View style={styles.cardHeader}>
                {cardType === 'Visa' ? (
                  <FontAwesome5 name="cc-visa" size={32} color="#FFF" />
                ) : cardType === 'Mastercard' ? (
                  <FontAwesome5 name="cc-mastercard" size={32} color="#FFF" />
                ) : (
                  <FontAwesome5 name="credit-card" size={32} color="#FFF" />
                )}
                <FontAwesome5 name="wifi" size={20} color="#FFF" style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
              
              <Text style={styles.cardNumberDisplay}>
                {cardNumber || '•••• •••• •••• ••••'}
              </Text>
              
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>Card Holder</Text>
                  <Text style={styles.cardValue}>{name || 'YOUR NAME'}</Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Expires</Text>
                  <Text style={styles.cardValue}>{expiry || 'MM/YY'}</Text>
                </View>
              </View>
            </Animated.View>

            {/* Back of Card */}
            <Animated.View style={[styles.cardMockup, backAnimatedStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, marginBottom: 0, backfaceVisibility: 'hidden', padding: 0, justifyContent: 'flex-start' }]}>
              <View style={{ backgroundColor: '#000', height: 40, width: '100%', marginTop: 24 }} />
              <View style={{ padding: 24 }}>
                <View style={{ backgroundColor: '#FFF', padding: 8, borderRadius: 4, alignItems: 'flex-end' }}>
                  <Text style={{ color: '#000', fontWeight: 'bold' }}>{cvv || '•••'}</Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Name on card"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor={colors.textSecondary}
                value={cardNumber}
                onChangeText={formatCardNumber}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.textSecondary}
                  value={expiry}
                  onChangeText={formatExpiry}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor={colors.textSecondary}
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  onFocus={() => flipCard(true)}
                  onBlur={() => flipCard(false)}
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable 
              style={({ pressed }) => [
                styles.saveButton,
                { opacity: pressed || saving ? 0.8 : 1 },
                isUpdate === 'true' ? { flex: 1, marginRight: 10 } : { flex: 1 }
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Card</Text>
              )}
            </Pressable>

            {isUpdate === 'true' && (
              <Pressable 
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: '#FF3B30', opacity: pressed || saving ? 0.8 : 1, flex: 1, marginLeft: 10 }
                ]}
                onPress={async () => {
                  try {
                    const res = await fetch('http://localhost:3000/user/credit-card', {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                      Alert.alert('Success', 'Credit card deleted.');
                      if (router.canGoBack()) {
                        router.back();
                      } else {
                        router.push('/subscription');
                      }
                    } else {
                      Alert.alert('Error', 'Failed to delete credit card.');
                    }
                  } catch (err) {
                    Alert.alert('Error', 'An error occurred while deleting.');
                  }
                }}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>Delete Card</Text>
              </Pressable>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
  cardMockup: {
    backgroundColor: '#0B308D',
    borderRadius: 20,
    padding: 24,
    height: 200,
    justifyContent: 'space-between',
    marginBottom: 32,
    shadowColor: '#0B308D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNumberDisplay: {
    color: '#FFF',
    fontSize: 24,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  formContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#0B308D',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#0B308D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
