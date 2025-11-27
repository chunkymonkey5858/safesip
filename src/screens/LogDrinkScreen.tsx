import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { DRINK_TYPES, BAC_THRESHOLDS } from '../utils/drinkTypes';

const LogDrinkScreen = () => {
  const navigation = useNavigation();
  const { userProfile, updateMealState } = useAuth();
  const { currentSession, currentBAC, bacHistory, startSession, logDrink, bacSimulator } =
    useApp();
  const [predictedData, setPredictedData] = useState<{ times: number[]; bacs: number[] }>({
    times: [],
    bacs: [],
  });

  useEffect(() => {
    if (bacSimulator && currentBAC > 0) {
      const predicted = bacSimulator.predictFutureBAC(4);
      setPredictedData(predicted);
    }
  }, [currentBAC, bacSimulator]);

  const handleLogDrink = (drinkTypeId: string) => {
    if (!currentSession) {
      startSession();
    }
    logDrink(drinkTypeId);
  };

  const getBACStatus = (bac: number) => {
    if (bac >= BAC_THRESHOLDS.LIFE_THREATENING) {
      return { label: 'LIFE-THREATENING', color: '#C0392B' };
    }
    if (bac >= BAC_THRESHOLDS.ALCOHOL_POISONING) {
      return { label: 'ALCOHOL POISONING', color: '#E74C3C' };
    }
    if (bac >= BAC_THRESHOLDS.BLACKOUT) {
      return { label: 'Blackout Risk', color: '#E67E22' };
    }
    if (bac >= BAC_THRESHOLDS.LEGALLY_IMPAIRED) {
      return { label: 'Legally Impaired', color: '#6C5CE7' };
    }
    if (bac >= BAC_THRESHOLDS.IMPAIRMENT_STARTS) {
      return { label: 'Impaired', color: '#F39C12' };
    }
    return { label: 'Safe', color: '#27AE60' };
  };

  const status = getBACStatus(currentBAC);

  // Prepare chart data - only actual BAC (solid line)
  const getChartData = () => {
    if (!currentSession) {
      // Return empty chart with proper scale (0 to 0.40)
      return {
        labels: ['8:30', '9:00', '9:30', '10:00', '10:30', '11:00'],
        datasets: [
          {
            data: [0, 0, 0, 0, 0, 0],
            color: (opacity = 1) => `rgba(108, 92, 231, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      };
    }

    // Calculate time range: from session start to either last history point or current + predicted
    const sessionStartTime = currentSession.startTime.getTime();
    const now = Date.now();
    
    // Get the last actual time
    const lastActualTime = bacHistory.length > 0 
      ? bacHistory[bacHistory.length - 1].time 
      : 0;
    
    // Get the last predicted time (if available)
    const lastPredictedTime = predictedData.times.length > 0
      ? Math.max(...predictedData.times.filter(t => t > lastActualTime), lastActualTime)
      : lastActualTime;
    
    // Total duration in hours (show at least 4 hours, or extend to cover predicted)
    const totalDurationHours = Math.max(4, lastPredictedTime || 2);
    
    // Generate labels every 30 minutes
    const labels: string[] = [];
    const labelTimes: number[] = []; // Store hours since start for each label
    const numIntervals = Math.ceil(totalDurationHours * 2) + 1; // Every 30 min = 2 per hour
    
    for (let i = 0; i < numIntervals; i++) {
      const hoursSinceStart = i * 0.5; // 30 minutes = 0.5 hours
      const time = new Date(sessionStartTime + hoursSinceStart * 60 * 60 * 1000);
      const label = time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      labels.push(label);
      labelTimes.push(hoursSinceStart);
    }

    // Map actual BAC data to the 30-minute intervals
    // For each label interval, find the closest BAC value
    const chartData: (number | null)[] = [];
    
    for (let i = 0; i < labelTimes.length; i++) {
      const intervalTime = labelTimes[i];
      
      // Check if we have actual BAC data for this interval
      if (bacHistory.length > 0) {
        // Find the BAC value closest to this interval time
        let closestBAC: number | null = null;
        let closestDistance = Infinity;
        
        bacHistory.forEach((reading) => {
          const distance = Math.abs(reading.time - intervalTime);
          if (distance < closestDistance && distance < 0.25) { // Within 15 minutes
            closestDistance = distance;
            closestBAC = reading.bac;
          }
        });
        
        // If we found a close match, use it; otherwise use null for gaps
        if (closestBAC !== null) {
          chartData.push(closestBAC);
        } else if (intervalTime <= lastActualTime) {
          // Interpolate for intervals between actual readings
          // Find surrounding points
          let beforeBAC: number | null = null;
          let afterBAC: number | null = null;
          let beforeTime: number | null = null;
          let afterTime: number | null = null;
          
          for (let j = 0; j < bacHistory.length; j++) {
            if (bacHistory[j].time <= intervalTime) {
              beforeBAC = bacHistory[j].bac;
              beforeTime = bacHistory[j].time;
            }
            if (bacHistory[j].time > intervalTime && afterBAC === null) {
              afterBAC = bacHistory[j].bac;
              afterTime = bacHistory[j].time;
              break;
            }
          }
          
          // Linear interpolation
          if (beforeBAC !== null && afterBAC !== null && beforeTime !== null && afterTime !== null) {
            const ratio = (intervalTime - beforeTime) / (afterTime - beforeTime);
            const interpolated = beforeBAC + (afterBAC - beforeBAC) * ratio;
            chartData.push(interpolated);
          } else if (beforeBAC !== null) {
            chartData.push(beforeBAC);
          } else if (afterBAC !== null) {
            chartData.push(afterBAC);
          } else {
            chartData.push(intervalTime === 0 ? 0 : null);
          }
        } else {
          // Future interval - use null (will be shown as dotted line overlay)
          chartData.push(null);
        }
      } else {
        // No history yet, show current BAC at start, then nulls
        if (intervalTime === 0) {
          chartData.push(currentBAC);
        } else {
          chartData.push(null);
        }
      }
    }

    // Ensure first point is at least 0
    if (chartData[0] === null || (chartData[0] !== null && chartData[0] < 0)) {
      chartData[0] = 0;
    }

    return {
      labels: labels,
      datasets: [
        {
          data: chartData,
          color: (opacity = 1) => `rgba(108, 92, 231, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  // Get predicted data for SVG overlay (dotted line)
  const getPredictedPath = () => {
    if (!currentSession || predictedData.bacs.length === 0) return null;

    const lastActualTime = bacHistory.length > 0 
      ? bacHistory[bacHistory.length - 1].time 
      : 0;
    
    // Filter predicted points that are in the future
    const futurePoints: { time: number; bac: number }[] = [];
    predictedData.times.forEach((time, idx) => {
      if (time > lastActualTime) {
        futurePoints.push({ time, bac: predictedData.bacs[idx] });
      }
    });

    if (futurePoints.length === 0) return null;

    // Get the last actual point to connect from
    const lastActualBAC = bacHistory.length > 0 
      ? bacHistory[bacHistory.length - 1].bac 
      : currentBAC;
    const lastActualTimeValue = bacHistory.length > 0 
      ? bacHistory[bacHistory.length - 1].time 
      : 0;

    // Get all actual times to calculate time range
    const actualTimes = bacHistory.length > 0
      ? bacHistory.map(h => h.time)
      : [0];
    const minActualTime = Math.min(...actualTimes, 0);
    const maxActualTime = Math.max(...actualTimes, lastActualTimeValue);
    const maxPredictedTime = Math.max(...futurePoints.map(p => p.time));
    
    // Time range spans from first actual to last predicted
    const timeRange = Math.max(maxPredictedTime - minActualTime, 0.1); // Avoid division by zero

    // Calculate chart dimensions (matching react-native-chart-kit's internal padding)
    const chartWidth = Dimensions.get('window').width - 48;
    const chartHeight = 280;
    const paddingLeft = 45; // Approximate left padding for Y-axis
    const paddingRight = 10;
    const paddingTop = 10;
    const paddingBottom = 30; // Approximate bottom padding for X-axis labels
    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    // Combine actual and predicted for path calculation
    const allPoints = [
      { time: lastActualTimeValue, bac: lastActualBAC },
      ...futurePoints,
    ];

    // Calculate Y positions (BAC-based, inverted for screen coordinates)
    const Y_MAX = 0.40;
    const getX = (time: number) => {
      return paddingLeft + ((time - minActualTime) / timeRange) * plotWidth;
    };
    const getY = (bac: number) => {
      return paddingTop + ((Y_MAX - bac) / Y_MAX) * plotHeight;
    };

    // Build SVG path with smooth curve
    let path = `M ${getX(allPoints[0].time)} ${getY(allPoints[0].bac)}`;
    for (let i = 1; i < allPoints.length; i++) {
      const prevPoint = allPoints[i - 1];
      const currPoint = allPoints[i];
      
      // Use quadratic bezier for smoother curve
      if (i === 1) {
        // First segment: simple line
        path += ` L ${getX(currPoint.time)} ${getY(currPoint.bac)}`;
      } else {
        // Subsequent segments: continue line
        path += ` L ${getX(currPoint.time)} ${getY(currPoint.bac)}`;
      }
    }

    return path;
  };

  return (
    <ScrollView style={styles.container}>
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

      {userProfile && (
        <View style={styles.mealStateSection}>
          <Text style={styles.mealStateLabel}>Today's Meal State</Text>
          <Text style={styles.mealStateDesc}>This affects how quickly alcohol is absorbed</Text>
          <View style={styles.mealStateButtons}>
            <TouchableOpacity
              style={[
                styles.mealStateButton,
                userProfile.mealState === 'fasted' && styles.mealStateButtonActive,
              ]}
              onPress={() => updateMealState('fasted')}
            >
              <Text style={styles.mealStateButtonEmoji}>🍽️</Text>
              <Text
                style={[
                  styles.mealStateButtonText,
                  userProfile.mealState === 'fasted' && styles.mealStateButtonTextActive,
                ]}
              >
                Fasted
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.mealStateButton,
                userProfile.mealState === 'light' && styles.mealStateButtonActive,
              ]}
              onPress={() => updateMealState('light')}
            >
              <Text style={styles.mealStateButtonEmoji}>🥗</Text>
              <Text
                style={[
                  styles.mealStateButtonText,
                  userProfile.mealState === 'light' && styles.mealStateButtonTextActive,
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.mealStateButton,
                userProfile.mealState === 'heavy' && styles.mealStateButtonActive,
              ]}
              onPress={() => updateMealState('heavy')}
            >
              <Text style={styles.mealStateButtonEmoji}>🍔</Text>
              <Text
                style={[
                  styles.mealStateButtonText,
                  userProfile.mealState === 'heavy' && styles.mealStateButtonTextActive,
                ]}
              >
                Heavy
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Log A Drink</Text>
        <View style={styles.drinkGrid}>
          {DRINK_TYPES.map((drink) => (
            <TouchableOpacity
              key={drink.id}
              style={[styles.drinkButton, { backgroundColor: drink.color }]}
              onPress={() => handleLogDrink(drink.id)}
            >
              <Text style={styles.drinkIcon}>{drink.icon}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current BAC</Text>
        <View style={styles.bacDisplay}>
          <Text style={styles.bacValue}>{currentBAC.toFixed(3)}</Text>
          <Text style={[styles.bacStatus, { color: status.color }]}>{status.label}</Text>
        </View>

        <View style={styles.chartContainer}>
          <LineChart
            data={getChartData()}
            width={Dimensions.get('window').width - 48}
            height={280}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(108, 92, 231, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#6C5CE7',
              },
            }}
            bezier
            style={styles.chart}
            segments={8}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={true}
            withHorizontalLines={true}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero={true}
            formatYLabel={(value) => {
              const num = parseFloat(value);
              if (isNaN(num)) return '';
              // Clamp values and format to 2 decimal places
              const clamped = Math.min(Math.max(num, 0), 0.40);
              return clamped.toFixed(2);
            }}
            yLabelsOffset={10}
            yAxisMax={0.40}
            yAxisMin={0}
          />

          {/* Predicted BAC overlay - dotted line */}
          {getPredictedPath() && (
            <View style={styles.predictedOverlay}>
              <Svg width={Dimensions.get('window').width - 48} height={280}>
                <Path
                  d={getPredictedPath()!}
                  stroke="rgba(108, 92, 231, 0.6)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="4, 4"
                />
              </Svg>
            </View>
          )}

          {predictedData.times.length > 0 && (
            <Text style={styles.chartNote}>
              Dotted line shows predicted BAC (no more drinks)
            </Text>
          )}
        </View>
      </View>

      {currentSession && (
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionLabel}>Active Session</Text>
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionDetailText}>
              Started: {currentSession.startTime.toLocaleTimeString()}
            </Text>
            <Text style={styles.sessionDetailText}>
              Total drinks: {currentSession.drinks.length}
            </Text>
            <Text style={styles.sessionDetailText}>
              Current BAC: {currentBAC.toFixed(3)}%
            </Text>
          </View>
          <TouchableOpacity
            style={styles.endSessionButton}
            onPress={() => (navigation as any).navigate('AddReflection')}
          >
            <Text style={styles.endSessionButtonText}>✏️ End Session & Add Reflection</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 16,
  },
  drinkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  drinkButton: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  drinkIcon: {
    fontSize: 40,
  },
  bacDisplay: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 24,
  },
  bacValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  bacStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  chartContainer: {
    position: 'relative',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  predictedOverlay: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  thresholdContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  thresholdLine: {
    position: 'absolute',
    left: 60,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdLabel: {
    fontSize: 10,
    color: '#636E72',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    fontWeight: '600',
  },
  thresholdLabelDanger: {
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  thresholdLabelWarning: {
    color: '#F39C12',
  },
  chartNote: {
    fontSize: 12,
    color: '#636E72',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  sessionInfo: {
    padding: 24,
    backgroundColor: '#F8F9FA',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
  },
  sessionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 12,
  },
  sessionDetails: {
    marginBottom: 16,
  },
  sessionDetailText: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 4,
  },
  mealStateSection: {
    padding: 24,
    paddingBottom: 8,
  },
  mealStateLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  mealStateDesc: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 16,
  },
  mealStateButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mealStateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DFE6E9',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  mealStateButtonActive: {
    borderColor: '#4C1D95',
    backgroundColor: '#EDE9FE',
  },
  mealStateButtonEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  mealStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
  },
  mealStateButtonTextActive: {
    color: '#4C1D95',
  },
  endSessionButton: {
    marginTop: 16,
    backgroundColor: '#E74C3C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  endSessionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LogDrinkScreen;

