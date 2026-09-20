import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
}

export function PageHeader({ title, showBackButton = false, onBack, rightComponent }: PageHeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      {showBackButton ? (
        <Pressable onPress={onBack || (() => router.back())} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
      ) : (
        <View style={styles.backButtonPlaceholder} />
      )}
      
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      
      <View style={styles.headerRight}>
        {rightComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
});
