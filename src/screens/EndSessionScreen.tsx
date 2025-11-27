import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';

const EndSessionScreen = () => {
  const navigation = useNavigation();
  const { currentSession, currentBAC, endSession } = useApp();
  const [notes, setNotes] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState<'great' | 'good' | 'okay' | 'bad' | undefined>();

  const handleSave = async () => {
    if (!currentSession) {
      Alert.alert('Error', 'No active session to end.');
      navigation.goBack();
      return;
    }

    try {
      await endSession(notes.trim() || undefined, selectedFeeling);
      Alert.alert('Success', 'Session saved!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save session. Please try again.');
    }
  };

  const feelings = [
    { id: 'great', label: 'Great', emoji: '😄' },
    { id: 'good', label: 'Good', emoji: '🙂' },
    { id: 'okay', label: 'Okay', emoji: '😐' },
    { id: 'bad', label: 'Bad', emoji: '😞' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>End Session</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {currentSession && (
          <>
            <View style={styles.sessionSummary}>
              <Text style={styles.summaryTitle}>Session Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>
                  {Math.round(
                    (Date.now() - currentSession.startTime.getTime()) / (1000 * 60)
                  )}{' '}
                  minutes
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Drinks:</Text>
                <Text style={styles.summaryValue}>{currentSession.drinks.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Max BAC:</Text>
                <Text style={styles.summaryValue}>{currentBAC.toFixed(3)}%</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How did you feel?</Text>
              <View style={styles.feelingsGrid}>
                {feelings.map((feeling) => (
                  <TouchableOpacity
                    key={feeling.id}
                    style={[
                      styles.feelingButton,
                      selectedFeeling === feeling.id && styles.feelingButtonActive,
                    ]}
                    onPress={() => setSelectedFeeling(feeling.id as any)}
                  >
                    <Text style={styles.feelingEmoji}>{feeling.emoji}</Text>
                    <Text
                      style={[
                        styles.feelingLabel,
                        selectedFeeling === feeling.id && styles.feelingLabelActive,
                      ]}
                    >
                      {feeling.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Notes (Optional)</Text>
              <Text style={styles.sectionSubtitle}>
                Reflect on your session - how did it go? What did you learn?
              </Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Write your thoughts here..."
                placeholderTextColor="#95A5A6"
                multiline
                numberOfLines={8}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Session</Text>
            </TouchableOpacity>
          </>
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
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#2D3436',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  content: {
    padding: 24,
  },
  sessionSummary: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#636E72',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 16,
  },
  feelingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  feelingButton: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#DFE6E9',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  feelingButtonActive: {
    borderColor: '#4C1D95',
    backgroundColor: '#EDE9FE',
  },
  feelingEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  feelingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636E72',
  },
  feelingLabelActive: {
    color: '#4C1D95',
  },
  notesInput: {
    borderWidth: 2,
    borderColor: '#DFE6E9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2D3436',
    backgroundColor: '#F8F9FA',
    minHeight: 120,
  },
  saveButton: {
    backgroundColor: '#4C1D95',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EndSessionScreen;

