import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function localDateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseEventToLocalDate(iso) {
  const d = new Date(iso);
  return localDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

const categoryColors = {
  Talk: '#0040a0',
  Workshop: '#b45309',
  Club: '#059669',
  Exam: '#dc2626',
  Other: '#6b7280',
};

export default function CalendarView({ events, onEventPress }) {
  const today = useMemo(() => {
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      key: localDateKey(d.getFullYear(), d.getMonth(), d.getDate()),
    };
  }, []);

  const [currentMonth, setCurrentMonth] = useState(today.month);
  const [currentYear, setCurrentYear] = useState(today.year);
  const [selectedDay, setSelectedDay] = useState(today.day);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const key = parseEventToLocalDate(ev.startDateTime);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [events]);

  const selectedKey = localDateKey(currentYear, currentMonth, selectedDay);
  const selectedEvents = eventsByDay[selectedKey] || [];

  const monthEventCount = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = localDateKey(currentYear, currentMonth, d);
      if (eventsByDay[key]) count += eventsByDay[key].length;
    }
    return count;
  }, [eventsByDay, currentMonth, currentYear, daysInMonth]);

  const prevMonth = useCallback(() => {
    setCurrentMonth(m => {
      if (m === 0) { setCurrentYear(y => y - 1); return 11; }
      return m - 1;
    });
    setSelectedDay(null);
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth(m => {
      if (m === 11) { setCurrentYear(y => y + 1); return 0; }
      return m + 1;
    });
    setSelectedDay(null);
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(today.month);
    setCurrentYear(today.year);
    setSelectedDay(today.day);
  }, [today]);

  const selectDay = useCallback((day) => {
    setSelectedDay(day);
  }, []);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isCurrentMonth = currentMonth === today.month && currentYear === today.year;

  return (
    <View style={styles.root}>
      <View style={styles.calendarCard}>
        <View style={styles.nav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.navCenter}>
            <Text style={styles.navTitle}>{MONTHS_FR[currentMonth]} {currentYear}</Text>
            <Text style={styles.navSub}>{monthEventCount} événement{monthEventCount !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={22} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {!isCurrentMonth && (
          <TouchableOpacity style={styles.todayBtn} onPress={goToToday} activeOpacity={0.7}>
            <Ionicons name="today-outline" size={14} color="#0040a0" />
            <Text style={styles.todayBtnText}>Aujourd'hui</Text>
          </TouchableOpacity>
        )}

        <View style={styles.daysHeader}>
          {DAYS_FR.map((d, i) => (
            <Text key={i} style={[styles.dayLabel, (i === 5 || i === 6) && styles.dayLabelWeekend]}>{d}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (!day) return <View key={`empty-${i}`} style={styles.cell} />;

            const isToday = isCurrentMonth && day === today.day;
            const isSelected = selectedDay === day;
            const cellKey = localDateKey(currentYear, currentMonth, day);
            const dayEvents = eventsByDay[cellKey] || [];
            const hasEvents = dayEvents.length > 0;

            return (
              <TouchableOpacity
                key={cellKey}
                style={[styles.cell, isToday && styles.cellToday, isSelected && styles.cellSelected]}
                onPress={() => selectDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cellText, isToday && !isSelected && styles.cellTextToday, isSelected && styles.cellTextSelected]}>
                  {day}
                </Text>
                {hasEvents && (
                  <View style={styles.dots}>
                    {dayEvents.length <= 3 ? (
                      dayEvents.slice(0, 3).map((e, j) => (
                        <View key={j} style={[styles.dot, { backgroundColor: isSelected ? '#ffffff80' : categoryColors[e.category] || '#6b7280' }]} />
                      ))
                    ) : (
                      <View style={[styles.dot, { backgroundColor: isSelected ? '#ffffff80' : '#0040a0' }]} />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.legendRow}>
          {Object.entries(categoryColors).map(([cat, color]) => (
            <View key={cat} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{cat}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={styles.eventsList} contentContainerStyle={styles.eventsContent}>
        {selectedDay != null && (
          <View style={styles.eventsHeader}>
            <Text style={styles.eventsDateTitle}>
              {new Date(currentYear, currentMonth, selectedDay).toLocaleDateString('fr-FR', { weekday: 'long' })}
            </Text>
            <Text style={styles.eventsDateSub}>
              {String(selectedDay).padStart(2, '0')}/{String(currentMonth + 1).padStart(2, '0')}/{currentYear} · {selectedEvents.length} événement{selectedEvents.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {selectedDay != null && selectedEvents.length === 0 && (
          <View style={styles.emptyDay}>
            <Ionicons name="calendar-outline" size={32} color="#d1d5db" />
            <Text style={styles.emptyDayText}>Aucun événement ce jour</Text>
          </View>
        )}

        {selectedEvents.map((ev) => {
          const color = categoryColors[ev.category] || '#6b7280';
          const start = new Date(ev.startDateTime);
          const end = ev.endDateTime ? new Date(ev.endDateTime) : null;
          const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
          const endTime = end ? `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}` : '';

          return (
            <TouchableOpacity
              key={ev.id}
              style={styles.eventCard}
              onPress={() => onEventPress?.(ev)}
              activeOpacity={0.7}
            >
              <View style={[styles.eventBar, { backgroundColor: color }]} />
              <View style={styles.eventContent}>
                <View style={styles.eventTop}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                  <View style={[styles.catBadge, { backgroundColor: color + '15' }]}>
                    <Text style={[styles.catBadgeText, { color }]}>{ev.category}</Text>
                  </View>
                </View>
                <View style={styles.eventDetails}>
                  <View style={styles.eventDetail}>
                    <Ionicons name="time-outline" size={13} color="#9ca3af" />
                    <Text style={styles.eventDetailText}>{startTime}{endTime ? ` – ${endTime}` : ''}</Text>
                  </View>
                  <View style={styles.eventDetail}>
                    <Ionicons name="location-outline" size={13} color="#9ca3af" />
                    <Text style={styles.eventDetailText} numberOfLines={1}>{ev.locationName}</Text>
                  </View>
                </View>
                {ev.capacity ? (
                  <View style={styles.capacityRow}>
                    <View style={styles.capacityBar}>
                      <View style={[styles.capacityFill, { width: `${Math.min(100, ((ev.registeredCount || 0) / ev.capacity) * 100)}%` }]} />
                    </View>
                    <Text style={styles.capacityText}>{ev.registeredCount || 0}/{ev.capacity}</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}

        {selectedDay != null && selectedEvents.length > 0 && <View style={{ height: 16 }} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f2f5' },

  calendarCard: {
    backgroundColor: '#ffffff', marginHorizontal: 12, marginTop: 8, borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },

  nav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9',
  },
  navCenter: { alignItems: 'center' },
  navTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  navSub: { fontSize: 11, color: '#9ca3af', marginTop: 1 },

  todayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: '#f0f7ff', borderRadius: 8, paddingVertical: 5, marginBottom: 8,
    borderWidth: 1, borderColor: '#dbeafe', marginHorizontal: 4,
  },
  todayBtnText: { fontSize: 12, fontWeight: '600', color: '#0040a0' },

  daysHeader: { flexDirection: 'row', marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#9ca3af', paddingVertical: 6 },
  dayLabelWeekend: { color: '#d1d5db' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center',
    borderRadius: 10,
  },
  cellToday: { backgroundColor: '#f0f7ff' },
  cellSelected: { backgroundColor: '#0040a0' },
  cellText: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  cellTextToday: { fontWeight: '700', color: '#0040a0' },
  cellTextSelected: { color: '#ffffff', fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 1 },
  dot: { width: 4, height: 4, borderRadius: 2 },

  legendRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 10, marginTop: 4,
    borderTopWidth: 1, borderTopColor: '#f8fafc',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, color: '#9ca3af', fontWeight: '500' },

  eventsList: { flex: 1 },
  eventsContent: { paddingHorizontal: 12, paddingTop: 8 },

  eventsHeader: { paddingHorizontal: 4, marginBottom: 8 },
  eventsDateTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', textTransform: 'capitalize' },
  eventsDateSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  emptyDay: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyDayText: { fontSize: 13, color: '#9ca3af' },

  eventCard: {
    flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 14,
    marginBottom: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  eventBar: { width: 4, alignSelf: 'stretch' },
  eventContent: { flex: 1, padding: 12 },
  eventTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a', flex: 1 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catBadgeText: { fontSize: 11, fontWeight: '600' },
  eventDetails: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  eventDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventDetailText: { fontSize: 12, color: '#6b7280' },
  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  capacityBar: { flex: 1, height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' },
  capacityFill: { height: '100%', backgroundColor: '#0040a0', borderRadius: 2 },
  capacityText: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
});
