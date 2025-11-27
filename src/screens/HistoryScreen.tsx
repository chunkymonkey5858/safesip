import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { BACSimulator } from '../models/BACCalculator';
import { DrinkingSession } from '../types';

const HistoryScreen = () => {
  const navigation = useNavigation();
  const { sessions, user, friends } = useApp();
  const { userProfile } = useAuth();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterMode, setFilterMode] = useState<'mine' | 'friends'>('mine');

  // Get friend name by userId
  const getFriendName = (userId: string) => {
    const friend = friends.find(f => f.id === userId);
    return friend?.name || 'Friend';
  };

  // Mock sessions for demo (mix of user and friend sessions)
  const mockSessions = [
    {
      id: '1',
      userId: userProfile?.id || '1',
      startTime: new Date('2025-11-27T22:00:00'),
      endTime: new Date('2025-11-28T02:00:00'),
      drinks: [],
      maxBAC: 0.14,
      notes:
        "Started the night slow but hit after a steady stream of drinks and good vibes—felt buzzed, confident, and fully in the moment. Definitely on the edge of control.",
      feeling: 'okay' as const,
    },
    {
      id: '2',
      userId: userProfile?.id || '1',
      startTime: new Date('2025-11-26T20:00:00'),
      endTime: new Date('2025-11-26T23:00:00'),
      drinks: [],
      maxBAC: 0.08,
      notes: 'Had a few drinks, nothing too crazy. Just a chill night with a slight buzz.',
      feeling: 'good' as const,
    },
  ];

  // Mock friend sessions (will be replaced with real friend data later)
  const mockFriendSessions = friends.length > 0
    ? friends.slice(0, 2).map((friend, idx) => ({
        id: `friend-session-${friend.id}`,
        userId: friend.id,
        startTime: new Date(Date.now() - (idx + 1) * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - (idx + 1) * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        drinks: [],
        maxBAC: 0.10 + idx * 0.02,
        notes: 'Great night out with friends! Stayed responsible.',
        feeling: 'good' as const,
      }))
    : [];
  
  const allMockSessions = [...mockSessions, ...mockFriendSessions];

  // Filter sessions based on mode (mine vs friends)
  const allSessions = sessions.length > 0 ? sessions : allMockSessions;
  const filteredSessions = filterMode === 'mine'
    ? allSessions.filter(s => s.userId === userProfile?.id)
    : allSessions.filter(s => s.userId !== userProfile?.id); // Friend sessions
  
  // Filter by selected date (if no matches, show all from that user type)
  const dateFiltered = filteredSessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    return (
      sessionDate.getMonth() === selectedDate.getMonth() &&
      sessionDate.getDate() === selectedDate.getDate() &&
      sessionDate.getFullYear() === selectedDate.getFullYear()
    );
  });
  
  const displaySessions = dateFiltered.length > 0 ? dateFiltered : filteredSessions;

  const getFeelingEmoji = (feeling?: string) => {
    switch (feeling) {
      case 'great':
        return '😄';
      case 'good':
        return '🙂';
      case 'okay':
        return '😐';
      case 'bad':
        return '😞';
      default:
        return '🙂';
    }
  };

  // Get chart data from actual session BAC history
  const getChartDataFromSession = (session: any) => {
    if (session.bacHistory && session.bacHistory.length > 0) {
      // Use actual BAC history if available
      const data = session.bacHistory.map((reading: any) => reading.bac);
      const labels = session.bacHistory.map((reading: any, index: number) => {
        const timeHours = reading.time;
        const time = new Date(session.startTime.getTime() + timeHours * 60 * 60 * 1000);
        return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      });
      return { data, labels };
    }
    
    // Fallback: generate from drinks if no history exists
    // Calculate session duration
    const endTime = session.endTime || new Date();
    const durationHours = (endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60);
    const durationMinutes = durationHours * 60;
    
    // Generate points every 30 minutes
    const points = Math.max(2, Math.ceil(durationMinutes / 30));
    const data: number[] = [];
    const labels: string[] = [];
    
    for (let i = 0; i < points; i++) {
      const timeMinutes = i * 30;
      const time = new Date(session.startTime.getTime() + timeMinutes * 60 * 1000);
      labels.push(time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
      
      // Estimate BAC at this point based on drinks consumed before this time
      let bac = 0;
      const timeHours = timeMinutes / 60;
      let totalAlcoholGrams = 0;
      
      session.drinks.forEach((drink: any) => {
        if (drink.time <= timeHours) {
          // Each drink contributes ~14g of alcohol
          // Rough estimate: BAC peaks around 1 hour after drinking
          const timeSinceDrink = timeHours - drink.time;
          const peakTime = 1.0; // hours
          const eliminationRate = 0.015; // g/dL per hour
          
          if (timeSinceDrink < peakTime) {
            // Rising phase
            const peakBAC = 0.02; // rough estimate per drink
            bac += peakBAC * (timeSinceDrink / peakTime);
          } else {
            // Declining phase
            const peakBAC = 0.02;
            const decline = (timeSinceDrink - peakTime) * eliminationRate;
            bac += Math.max(0, peakBAC - decline);
          }
        }
      });
      
      data.push(Math.min(session.maxBAC, bac));
    }
    
    return { data, labels };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => (navigation as any).navigate('Settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>History</Text>
        
        {/* Filter toggle */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filterMode === 'mine' && styles.filterButtonActive]}
            onPress={() => setFilterMode('mine')}
          >
            <Text style={[styles.filterButtonText, filterMode === 'mine' && styles.filterButtonTextActive]}>
              My Sessions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterMode === 'friends' && styles.filterButtonActive]}
            onPress={() => setFilterMode('friends')}
          >
            <Text style={[styles.filterButtonText, filterMode === 'friends' && styles.filterButtonTextActive]}>
              Friends
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date selector */}
        <TouchableOpacity 
          style={styles.dateSelector}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateInput}>
            {selectedDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.dateArrowText}>▼</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                }
                if (date && event.type !== 'dismissed') {
                  setSelectedDate(date);
                }
              }}
              maximumDate={new Date()}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.datePickerDoneButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {displaySessions.map((session, index) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionTitleContainer}>
                <Text style={styles.sessionTitle}>
                  {filterMode === 'mine' 
                    ? `Session ${displaySessions.length - index}`
                    : `${getFriendName(session.userId)}'s Session`
                  }
                </Text>
                {filterMode === 'friends' && (
                  <Text style={styles.sessionSubtitle}>Friend Session</Text>
                )}
              </View>
              <Text style={styles.sessionDate}>
                {new Date(session.startTime).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <View style={styles.sessionStats}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Highest BAC Recorded:</Text>
                <Text style={styles.statValue}>{session.maxBAC.toFixed(2)}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Overall Feeling:</Text>
                <Text style={styles.statValue}>{getFeelingEmoji(session.feeling)}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Drinks:</Text>
                <Text style={styles.statValue}>
                  {session.drinks?.length || Math.floor(session.maxBAC * 50)}
                </Text>
              </View>
            </View>

            {(() => {
              const chartData = getChartDataFromSession(session);
              return (
                <LineChart
                  data={{
                    labels: chartData.labels,
                    datasets: [{ data: chartData.data }],
                  }}
              width={Dimensions.get('window').width - 80}
              height={120}
              chartConfig={{
                backgroundColor: '#6C5CE7',
                backgroundGradientFrom: '#6C5CE7',
                backgroundGradientTo: '#A29BFE',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 12,
                },
                propsForDots: {
                  r: '3',
                  strokeWidth: '1',
                  stroke: '#fff',
                },
              }}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
              yAxisLabel=""
              yAxisSuffix=""
              yAxisMin={0}
              yAxisMax={0.40}
              segments={8}
              formatYLabel={(value) => parseFloat(value).toFixed(2)}
            />
              );
            })()}

            {session.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText}>{session.notes}</Text>
              </View>
            )}

            {/* Add/Edit Reflection button - only show for user's own sessions */}
            {filterMode === 'mine' && session.userId === userProfile?.id && (
              <TouchableOpacity
                style={styles.addReflectionButton}
                onPress={() => {
                  (navigation as any).navigate('AddReflection', { sessionId: session.id });
                }}
              >
                <Text style={styles.addReflectionButtonText}>
                  {session.notes ? '✏️ Edit Reflection' : '➕ Add Reflection'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {displaySessions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No drinking sessions yet</Text>
            <Text style={styles.emptySubtext}>
              Start logging drinks to see your history here
            </Text>
          </View>
        )}

        {displaySessions.length > 1 && (
          <View style={styles.bestFriendBadge}>
            <Text style={styles.bestFriendText}>Best Friend 💕</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DFE6E9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    maxWidth: 150,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3436',
  },
  dateArrowText: {
    fontSize: 12,
    color: '#636E72',
    marginLeft: 8,
  },
  datePickerContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  datePickerDoneButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4C1D95',
    borderRadius: 8,
  },
  datePickerDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DFE6E9',
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  filterButtonActive: {
    borderColor: '#4C1D95',
    backgroundColor: '#EDE9FE',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
  },
  filterButtonTextActive: {
    color: '#4C1D95',
  },
  scrollContent: {
    padding: 24,
  },
  sessionCard: {
    backgroundColor: '#6C5CE7',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionTitleContainer: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sessionSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    marginTop: 2,
  },
  sessionDate: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  sessionStats: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 18,
  },
  addReflectionButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  addReflectionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  bestFriendBadge: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  bestFriendText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
  },
});

export default HistoryScreen;

