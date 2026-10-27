import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAppAlert } from '../context/AlertContext';
import { useLanguage } from '../context/LanguageContext';
import { DateBox } from './ui/date-box';
import { ClientData } from './ClientModal';

interface TransactionModalProps {
  visible: boolean;
  type: 'credit' | 'payment';
  client?: ClientData | null;
  clientsList?: ClientData[];
  onClose: () => void;
  onSuccess: (newTrans: any) => void;
}

const PRESET_AMOUNTS = [20, 50, 100, 200, 500];

export function TransactionModal({
  visible,
  type,
  client,
  clientsList = [],
  onClose,
  onSuccess,
}: TransactionModalProps) {
  const { colors, theme } = useTheme();
  const { token } = useAuth();
  const { showAlert } = useAppAlert();
  const { t, isRTL, language } = useLanguage();
  const isDark = theme === 'dark';

  const isCredit = type === 'credit';
  const primaryAccent = isCredit ? '#2563EB' : '#10B981';

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const amountInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      if (client?.id) {
        setSelectedClientId(client.id);
      } else if (clientsList.length > 0) {
        setSelectedClientId(clientsList[0].id || null);
      }
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription(
        isCredit
          ? t('modals.transaction.descriptionCreditPlaceholder')
          : t('modals.transaction.descriptionPaymentPlaceholder')
      );

      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [client, clientsList, type, visible]);

  const addPreset = (preset: number) => {
    const current = parseFloat(amount.replace(',', '.')) || 0;
    setAmount(String(current + preset));
  };

  const clearAmount = () => {
    setAmount('');
    amountInputRef.current?.focus();
  };

  const handleAmountChange = (val: string) => {
    // Only allow digits, dot, and comma
    const sanitized = val.replace(/[^0-9.,]/g, '');
    setAmount(sanitized);
  };

  const handleSubmit = async () => {
    const targetClientId = client?.id || selectedClientId;
    if (!targetClientId) {
      showAlert('error', t('common.error'), t('modals.transaction.selectClientError'));
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert('error', t('common.error'), t('modals.transaction.invalidAmountError'));
      amountInputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/clients/${targetClientId}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          amount: numAmount,
          date,
          description: description.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || t('common.error'));
      }

      const formattedNum = numAmount.toLocaleString(language === 'ar' ? 'ar-MA' : 'fr-FR');
      showAlert(
        'success',
        isCredit ? t('modals.transaction.titleCredit') : t('modals.transaction.titlePayment'),
        `${isCredit ? '+' : '-'}${formattedNum} DH ${isCredit ? t('modals.transaction.successCredit') : t('modals.transaction.successPayment')}`
      );
      onSuccess(data);
      onClose();
    } catch (err: any) {
      console.error(err);
      showAlert('error', t('common.error'), err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#161B26' : '#FFFFFF',
              borderColor: isDark ? '#263044' : '#E2E8F0',
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.headerTitleGroup, isRTL && { flexDirection: 'row-reverse' }]}>
              <View
                style={[
                  styles.headerIconCircle,
                  {
                    backgroundColor: isCredit
                      ? 'rgba(37, 99, 235, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                  },
                ]}
              >
                {isCredit ? (
                  <Feather name="plus-circle" size={22} color={primaryAccent} />
                ) : (
                  <FontAwesome5 name="hand-holding-usd" size={20} color={primaryAccent} />
                )}
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  {isCredit ? t('modals.transaction.titleCredit') : t('modals.transaction.titlePayment')}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                  {isCredit ? t('modals.transaction.subtitleCredit') : t('modals.transaction.subtitlePayment')}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#212936' : '#F1F5F9' }]}
            >
              <Feather name="x" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            {/* Client selector if global */}
            {!client && (
              <View style={styles.fieldWrapper}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                  {t('modals.transaction.clientConcerned')}
                </Text>
                {clientsList.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: isRTL ? 'right' : 'left' }}>
                    {t('modals.transaction.noClients')}
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                    {clientsList.map((c) => {
                      const isSelected = selectedClientId === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          style={[
                            styles.clientChip,
                            {
                              backgroundColor: isSelected
                                ? primaryAccent
                                : isDark
                                ? '#0F131C'
                                : '#F1F5F9',
                              borderColor: isSelected ? primaryAccent : isDark ? '#263044' : '#E2E8F0',
                            },
                          ]}
                          onPress={() => setSelectedClientId(c.id || null)}
                        >
                          <Text
                            style={[
                              styles.clientChipText,
                              { color: isSelected ? '#FFFFFF' : colors.text },
                            ]}
                          >
                            {c.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}

            {/* HERO AMOUNT DISPLAY BOX */}
            <Pressable
              style={[
                styles.amountHeroContainer,
                {
                  backgroundColor: isDark ? '#0D111A' : '#F8FAFC',
                  borderColor: isDark ? '#263044' : '#E2E8F0',
                },
              ]}
              onPress={() => amountInputRef.current?.focus()}
            >
              <View style={[styles.amountHeaderLabelRow, isRTL && { flexDirection: 'row-reverse' }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  {t('modals.transaction.amountLabel')}
                </Text>
                {!!amount && (
                  <Pressable onPress={clearAmount} style={[styles.clearAmountBtn, isRTL && { flexDirection: 'row-reverse' }]}>
                    <Feather name="x-circle" size={14} color={colors.textSecondary} />
                    <Text style={[styles.clearAmountText, { color: colors.textSecondary }]}>
                      {t('modals.transaction.clear')}
                    </Text>
                  </Pressable>
                )}
              </View>

              <View style={[styles.amountInputRow, isRTL && { flexDirection: 'row-reverse' }]}>
                <Text style={[styles.amountSign, { color: primaryAccent }]}>
                  {isCredit ? '+' : '-'}
                </Text>
                <TextInput
                  ref={amountInputRef}
                  style={[
                    styles.hugeAmountInput,
                    {
                      color: colors.text,
                      // @ts-ignore
                      outline: 'none',
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                  autoFocus
                  selectTextOnFocus
                />
                <Text style={[styles.currencyBadge, { color: primaryAccent }]}>DH</Text>
              </View>

              {/* Quick Amount Presets */}
              <View style={[styles.presetRow, isRTL && { flexDirection: 'row-reverse' }]}>
                {PRESET_AMOUNTS.map((preset) => (
                  <Pressable
                    key={preset}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isDark ? '#1C2333' : '#EFF6FF',
                        borderColor: isDark ? '#2E3D5C' : '#DBEAFE',
                      },
                    ]}
                    onPress={() => addPreset(preset)}
                  >
                    <Text style={[styles.presetText, { color: primaryAccent }]}>+{preset} DH</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>

            {/* Date */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('modals.transaction.dateLabel')}
              </Text>
              <DateBox value={date} onChange={setDate} placeholder="YYYY-MM-DD" />
            </View>

            {/* Description / Note */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('modals.transaction.descriptionLabel')}
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  isRTL && { flexDirection: 'row-reverse' },
                  {
                    backgroundColor: isDark ? '#0F131C' : '#F8FAFC',
                    borderColor: isDark ? '#263044' : '#E2E8F0',
                  },
                ]}
              >
                <Feather
                  name="file-text"
                  size={18}
                  color={colors.textSecondary}
                  style={[styles.inputIcon, isRTL ? { marginRight: 0, marginLeft: 10 } : { marginRight: 10 }]}
                />
                <TextInput
                  style={[styles.textInput, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={
                    isCredit
                      ? t('modals.transaction.descriptionCreditPlaceholder')
                      : t('modals.transaction.descriptionPaymentPlaceholder')
                  }
                  placeholderTextColor={colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View
            style={[
              styles.actionsRow,
              isRTL && { flexDirection: 'row-reverse' },
              { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
            ]}
          >
            <Pressable
              style={[
                styles.cancelButton,
                {
                  backgroundColor: isDark ? '#212936' : '#F1F5F9',
                  borderColor: isDark ? '#2E3A4E' : '#CBD5E1',
                },
              ]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t('modals.transaction.cancel')}</Text>
            </Pressable>

            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: primaryAccent },
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isCredit ? t('modals.transaction.submitCredit') : t('modals.transaction.submitPayment')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 8, 15, 0.7)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContent: {
    paddingVertical: 10,
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  clientChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  clientChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  amountHeroContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  amountHeaderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  clearAmountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clearAmountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    width: '100%',
  },
  amountSign: {
    fontSize: 34,
    fontWeight: '900',
    marginRight: 6,
  },
  hugeAmountInput: {
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    minWidth: 140,
    maxWidth: 240,
    paddingVertical: 4,
  },
  currencyBadge: {
    fontSize: 22,
    fontWeight: '900',
    marginLeft: 6,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
