import React, { useState, useEffect } from 'react';
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
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAppAlert } from '../context/AlertContext';

export interface ClientData {
  id?: number;
  name: string;
  phone: string;
  address?: string | null;
  note?: string | null;
  total_credit?: number;
  total_paid?: number;
  remaining_debt?: number;
  transaction_count?: number;
  created_at?: string;
}

interface ClientModalProps {
  visible: boolean;
  client?: ClientData | null;
  onClose: () => void;
  onSuccess: (savedClient: ClientData) => void;
}

export function ClientModal({ visible, client, onClose, onSuccess }: ClientModalProps) {
  const { colors, theme } = useTheme();
  const { token } = useAuth();
  const { showAlert } = useAppAlert();
  const isDark = theme === 'dark';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!client?.id;

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setPhone(client.phone || '');
      setAddress(client.address || '');
      setNote(client.note || '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setNote('');
    }
  }, [client, visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert('error', 'Champ requis', 'Veuillez saisir le nom complet du client.');
      return;
    }
    if (!phone.trim()) {
      showAlert('error', 'Champ requis', 'Veuillez saisir le numéro de téléphone.');
      return;
    }

    setLoading(true);
    try {
      const url = isEditing
        ? `http://localhost:3000/api/clients/${client?.id}`
        : 'http://localhost:3000/api/clients';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim() || null,
          note: note.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors de l’enregistrement');
      }

      showAlert('success', 'Succès', isEditing ? 'Client mis à jour avec succès.' : 'Nouveau client ajouté au carnet.');
      onSuccess(data.client || data);
      onClose();
    } catch (err: any) {
      console.error(err);
      showAlert('error', 'Erreur', err.message || 'Impossible d’enregistrer le client.');
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
          {/* Header Banner */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleGroup}>
              <View
                style={[
                  styles.headerIconCircle,
                  { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF' },
                ]}
              >
                <Feather name={isEditing ? 'edit-3' : 'user-plus'} size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {isEditing ? 'Modifier la fiche client' : 'Nouveau client'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {isEditing ? 'Mettez à jour les coordonnées' : 'Ajoutez un client à votre carnet'}
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
            {/* Nom complet */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                NOM COMPLET <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? '#0F131C' : '#F8FAFC',
                    borderColor: isDark ? '#263044' : '#E2E8F0',
                  },
                ]}
              >
                <Feather name="user" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Ex: Yassine Benali"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoFocus={!isEditing}
                />
              </View>
            </View>

            {/* Numéro de téléphone */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                NUMÉRO DE TÉLÉPHONE <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? '#0F131C' : '#F8FAFC',
                    borderColor: isDark ? '#263044' : '#E2E8F0',
                  },
                ]}
              >
                <Feather name="phone" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Ex: 06 12 34 56 78"
                  placeholderTextColor={colors.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Adresse */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                ADRESSE <Text style={styles.optionalText}>(Optionnel)</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? '#0F131C' : '#F8FAFC',
                    borderColor: isDark ? '#263044' : '#E2E8F0',
                  },
                ]}
              >
                <Feather name="map-pin" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Ex: Quartier Maarif, Rue 14"
                  placeholderTextColor={colors.textSecondary}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>

            {/* Note */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                REMARQUE / NOTE <Text style={styles.optionalText}>(Optionnel)</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  styles.textAreaContainer,
                  {
                    backgroundColor: isDark ? '#0F131C' : '#F8FAFC',
                    borderColor: isDark ? '#263044' : '#E2E8F0',
                  },
                ]}
              >
                <TextInput
                  style={[styles.textInput, styles.textAreaInput, { color: colors.text }]}
                  placeholder="Notes personnelles sur le client ou ses habitudes de paiement..."
                  placeholderTextColor={colors.textSecondary}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View
            style={[
              styles.actionsRow,
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
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Annuler</Text>
            </Pressable>

            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Enregistrer les modifications' : 'Ajouter le client'}
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
  requiredStar: {
    color: '#EF4444',
  },
  optionalText: {
    fontSize: 11,
    fontWeight: '400',
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  textAreaContainer: {
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  textAreaInput: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingVertical: 4,
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
    shadowColor: '#2563EB',
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
