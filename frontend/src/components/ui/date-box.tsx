import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface DateBoxProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function DateBox({ value, onChange, placeholder = 'YYYY-MM-DD' }: DateBoxProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setTempDate(d);
        setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    } else {
      setTempDate(null);
      setCurrentMonth(new Date());
    }
  }, [value, modalVisible]);

  const openModal = () => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setTempDate(d);
        setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    } else {
      setTempDate(null);
      setCurrentMonth(new Date());
    }
    setModalVisible(true);
  };

  const handleApply = () => {
    if (tempDate) {
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
    setModalVisible(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const changeYear = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear() + offset, currentMonth.getMonth(), 1));
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of month offset (Monday = 0, Sunday = 6)
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Previous month days
    for (let i = 0; i < firstDay; i++) {
      days.push({
        day: daysInPrevMonth - firstDay + i + 1,
        isCurrentMonth: false,
        date: new Date(year, month - 1, daysInPrevMonth - firstDay + i + 1)
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }
    
    // Next month days to complete grid (42 cells total)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    const today = new Date();
    
    return (
      <View style={styles.grid}>
        {DAYS_OF_WEEK.map((day, idx) => (
          <View key={`header-${idx}`} style={styles.cell}>
            <Text style={styles.dayOfWeekText}>{day}</Text>
          </View>
        ))}
        
        {days.map((item, idx) => {
          const isSelected = tempDate && 
            item.date.getFullYear() === tempDate.getFullYear() && 
            item.date.getMonth() === tempDate.getMonth() && 
            item.date.getDate() === tempDate.getDate();
            
          const isToday = item.date.getFullYear() === today.getFullYear() && 
            item.date.getMonth() === today.getMonth() && 
            item.date.getDate() === today.getDate();

          return (
            <Pressable 
              key={`day-${idx}`} 
              style={[
                styles.cell, 
                styles.dayCell,
                isToday && !isSelected && styles.todayCell,
                isSelected && styles.selectedCell
              ]}
              onPress={() => setTempDate(item.date)}
            >
              <Text style={[
                styles.dayText,
                !item.isCurrentMonth && styles.otherMonthText,
                isSelected && styles.selectedText
              ]}>
                {item.day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <View style={styles.container}>
      <Pressable onPress={openModal} style={styles.inputContainer}>
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Feather name="calendar" size={20} color="#111827" />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCancel}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            
            <View style={styles.header}>
              <View style={styles.navGroup}>
                <Pressable onPress={() => changeYear(-1)} style={styles.navButton}>
                  <Feather name="chevrons-left" size={16} color="#4B5563" />
                </Pressable>
                <Pressable onPress={() => changeMonth(-1)} style={styles.navButton}>
                  <Feather name="chevron-left" size={16} color="#4B5563" />
                </Pressable>
              </View>
              
              <Text style={styles.headerTitle}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              
              <View style={styles.navGroup}>
                <Pressable onPress={() => changeMonth(1)} style={styles.navButton}>
                  <Feather name="chevron-right" size={16} color="#4B5563" />
                </Pressable>
                <Pressable onPress={() => changeYear(1)} style={styles.navButton}>
                  <Feather name="chevrons-right" size={16} color="#4B5563" />
                </Pressable>
              </View>
            </View>

            {renderCalendar()}

            <View style={styles.footer}>
              <Pressable onPress={handleCancel} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleApply} style={styles.applyButton}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </Pressable>
            </View>
            
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCell: {
    borderRadius: 8,
    marginVertical: 2,
  },
  dayOfWeekText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  dayText: {
    fontSize: 14,
    color: '#111827',
  },
  otherMonthText: {
    color: '#D1D5DB',
  },
  todayCell: {
    backgroundColor: '#F3F4F6',
  },
  selectedCell: {
    backgroundColor: '#111827',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
