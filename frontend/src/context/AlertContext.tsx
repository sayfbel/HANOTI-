import React, { createContext, useContext, useState, useRef } from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useTheme } from './ThemeContext';

export type AlertType = 'success' | 'error' | 'info';

interface AlertContextType {
  showAlert: (type: AlertType, title: string, message?: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>('info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showAlert = (type: AlertType, alertTitle: string, alertMessage?: string) => {
    setAlertType(type);
    setTitle(alertTitle);
    setMessage(alertMessage || '');
    setVisible(true);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, 4000); // Auto-hide after 4 seconds
  };

  const getIcon = () => {
    switch (alertType) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      default: return 'info';
    }
  };

  const getBackgroundColor = () => {
    switch (alertType) {
      case 'success': return '#10B981'; // Green
      case 'error': return '#EF4444'; // Red
      default: return colors.primary;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {visible && (
        <SafeAreaView style={styles.container} pointerEvents="none">
          <Animatable.View 
            animation="slideInDown" 
            duration={400}
            style={[
              styles.card, 
              { backgroundColor: colors.surface, borderLeftColor: getBackgroundColor() }
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: getBackgroundColor() }]}>
              <Feather name={getIcon() as any} size={24} color="#FFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              {!!message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
            </View>
          </Animatable.View>
        </SafeAreaView>
      )}
    </AlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAppAlert must be used within an AlertProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40, // Space from top of screen
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderLeftWidth: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  }
});
