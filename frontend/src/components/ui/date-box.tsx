import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface DateBoxProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function DateBox({ value, onChange, placeholder = 'YYYY-MM-DD' }: DateBoxProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [modalVisible, setModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [viewMode, setViewMode] = useState<'calendar' | 'months' | 'years'>('calendar');
  const [yearPage, setYearPage] = useState(new Date().getFullYear());

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setTempDate(d);
        setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        setYearPage(d.getFullYear());
      }
    } else {
      setTempDate(null);
      setCurrentMonth(new Date());
      setYearPage(new Date().getFullYear());
    }
  }, [value, modalVisible]);

  const openModal = () => {
    setViewMode('calendar');
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setTempDate(d);
        setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        setYearPage(d.getFullYear());
      }
    } else {
      setTempDate(null);
      setCurrentMonth(new Date());
      setYearPage(new Date().getFullYear());
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

  const changeYearPage = (offset: number) => {
    setYearPage(prev => prev + offset * 12);
  };

  const selectMonth = (monthIndex: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex, 1));
    setViewMode('calendar');
  };

  const selectYear = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setViewMode('calendar');
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

  const renderMonths = () => {
    return (
      <View style={styles.pickerGrid}>
        {MONTH_NAMES.map((month, idx) => (
          <Pressable 
            key={month} 
            style={[styles.pickerCell, currentMonth.getMonth() === idx && styles.selectedPickerCell]} 
            onPress={() => selectMonth(idx)}
          >
            <Text style={[styles.pickerCellText, currentMonth.getMonth() === idx && styles.selectedPickerCellText]}>
              {month.substring(0, 3)}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderYears = () => {
    const years = [];
    const startYear = yearPage - 6;
    for (let i = 0; i < 12; i++) {
      years.push(startYear + i);
    }

    return (
      <View style={styles.pickerGrid}>
        {years.map((year) => (
          <Pressable 
            key={year} 
            style={[styles.pickerCell, currentMonth.getFullYear() === year && styles.selectedPickerCell]} 
            onPress={() => selectYear(year)}
          >
            <Text style={[styles.pickerCellText, currentMonth.getFullYear() === year && styles.selectedPickerCellText]}>
              {year}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={openModal} style={styles.inputContainer}>
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Feather name="calendar" size={20} color={colors.textSecondary} />
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
                <Pressable 
                  onPress={() => {
                    if (viewMode === 'calendar') changeYear(-1);
                    else if (viewMode === 'years') changeYearPage(-1);
                  }} 
                  style={styles.navButton}
                >
                  <Feather name="chevrons-left" size={16} color={colors.textSecondary} />
                </Pressable>
                {viewMode === 'calendar' && (
                  <Pressable onPress={() => changeMonth(-1)} style={styles.navButton}>
                    <Feather name="chevron-left" size={16} color={colors.textSecondary} />
                  </Pressable>
                )}
              </View>
              
              <View style={styles.titleGroup}>
                {viewMode === 'calendar' && (
                  <Pressable onPress={() => setViewMode('months')}>
                    <Text style={styles.headerTitle}>
                      {MONTH_NAMES[currentMonth.getMonth()]}
                    </Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setViewMode(viewMode === 'years' ? 'calendar' : 'years')}>
                  <Text style={[styles.headerTitle, (viewMode === 'years' || viewMode === 'months') && styles.activeHeaderTitle]}>
                    {viewMode === 'years' ? `${yearPage - 6} - ${yearPage + 5}` : currentMonth.getFullYear()}
                  </Text>
                </Pressable>
              </View>
              
              <View style={styles.navGroup}>
                {viewMode === 'calendar' && (
                  <Pressable onPress={() => changeMonth(1)} style={styles.navButton}>
                    <Feather name="chevron-right" size={16} color={colors.textSecondary} />
                  </Pressable>
                )}
                <Pressable 
                  onPress={() => {
                    if (viewMode === 'calendar') changeYear(1);
                    else if (viewMode === 'years') changeYearPage(1);
                  }} 
                  style={styles.navButton}
                >
                  <Feather name="chevrons-right" size={16} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            {viewMode === 'calendar' && renderCalendar()}
            {viewMode === 'months' && renderMonths()}
            {viewMode === 'years' && renderYears()}

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

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  navGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  activeHeaderTitle: {
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCell: {
    width: '31%',
    aspectRatio: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedPickerCell: {
    backgroundColor: colors.primary,
  },
  pickerCellText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  selectedPickerCellText: {
    color: '#FFF',
  },
  dayCell: {
    borderRadius: 8,
    marginVertical: 2,
  },
  dayOfWeekText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  dayText: {
    fontSize: 14,
    color: colors.text,
  },
  otherMonthText: {
    color: colors.border, // Very light color for other month
  },
  todayCell: {
    backgroundColor: colors.background,
  },
  selectedCell: {
    backgroundColor: colors.primary,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
