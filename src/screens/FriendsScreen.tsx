import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { useNavigation } from '@react-navigation/native';
import { showContactOptions } from '../utils/contact';
import { Friend } from '../types';

const FriendsScreen = () => {
  const { friends, user, currentBAC, currentSession } = useApp();
  const navigation = useNavigation();

  // Include current user in friends list if in session
  const currentUserFriend = currentSession && user
    ? {
        id: user.id,
        name: user.name,
        currentBAC,
        lastUpdate: new Date(),
        status: (currentBAC > 0 ? ('drinking' as const) : ('sober' as const)),
      }
    : null;

  // Mock friends data for demo
  const mockFriends: Friend[] = [
    { 
      id: '1', 
      name: 'Spencer', 
      email: 'spencer@example.com',
      phoneNumber: '+1234567890',
      currentBAC: 0.03, 
      lastUpdate: new Date(), 
      status: 'drinking' as const 
    },
    { 
      id: '2', 
      name: 'Victor', 
      email: 'victor@example.com',
      phoneNumber: '+1234567891',
      currentBAC: 0.07, 
      lastUpdate: new Date(), 
      status: 'drinking' as const 
    },
    { 
      id: '3', 
      name: 'Monish', 
      email: 'monish@example.com',
      phoneNumber: '+1234567892',
      currentBAC: 0.14, 
      lastUpdate: new Date(), 
      status: 'drinking' as const 
    },
    { 
      id: '4', 
      name: 'Daniel', 
      email: 'daniel@example.com',
      phoneNumber: '+1234567893',
      currentBAC: 0.0, 
      lastUpdate: new Date(), 
      status: 'sober' as const 
    },
  ];

  const handleMessageFriend = (friend: Friend) => {
    const message = friend.currentBAC > 0.08
      ? `Hey ${friend.name}, I see your BAC is ${friend.currentBAC.toFixed(2)}%. Just checking in - are you doing okay?`
      : `Hey ${friend.name}, just checking in!`;

    showContactOptions(
      {
        name: friend.name,
        email: friend.email,
        phoneNumber: friend.phoneNumber,
      },
      message
    );
  };

  // Combine user with friends, avoiding duplicates
  const allFriends = friends.length > 0 ? friends : mockFriends;
  const displayFriends = currentUserFriend
    ? [currentUserFriend, ...allFriends.filter((f) => f.id !== user?.id)]
    : allFriends;

  const getBACGradient = (bac: number) => {
    if (bac === 0) return { start: '#95A5A6', end: '#95A5A6' };
    if (bac < 0.05) return { start: '#F1C40F', end: '#F5A623' }; // Yellow gradient
    if (bac < 0.08) return { start: '#F5A623', end: '#E67E22' }; // Yellow to orange
    if (bac < 0.15) return { start: '#E67E22', end: '#8B2E5F' }; // Orange to purple
    return { start: '#8B2E5F', end: '#6C5CE7' }; // Purple gradient
  };

  const getBACWidth = (bac: number) => {
    const maxWidth = 120;
    const percentage = Math.min(bac / 0.2, 1); // Max out at 0.2 BAC
    return Math.max(percentage * maxWidth, 60);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
        <View style={styles.headerDivider} />
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => (navigation as any).navigate('Settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <TouchableOpacity 
          style={styles.messageAllButton}
          onPress={() => {
            // Message all friends functionality
            Alert.alert(
              'Message All Friends',
              'Send a message to all your friends?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Send Group Text', 
                  onPress: () => {
                    // TODO: Implement group messaging
                    Alert.alert('Coming Soon', 'Group messaging will be available soon!');
                  }
                },
                { 
                  text: 'Send Group Email', 
                  onPress: () => {
                    // TODO: Implement group email
                    Alert.alert('Coming Soon', 'Group email will be available soon!');
                  }
                },
              ]
            );
          }}
        >
          <Text style={styles.messageAllIcon}>✉️</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayFriends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
            <View style={styles.friendAvatar}>
              <Text style={styles.friendAvatarText}>👤</Text>
            </View>

            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{item.name}</Text>
              <View
                style={[
                  styles.bacPill,
                  {
                    width: getBACWidth(item.currentBAC),
                  },
                ]}
              >
                <View
                  style={[
                    styles.bacPillGradient,
                    {
                      backgroundColor: item.currentBAC === 0 
                        ? '#95A5A6' 
                        : item.currentBAC < 0.08
                        ? '#F5A623' // Yellow
                        : item.currentBAC < 0.15
                        ? '#E67E22' // Orange
                        : '#8B2E5F', // Purple
                    },
                  ]}
                />
                {item.currentBAC > 0 && (
                  <Text style={styles.bacText}>{item.currentBAC.toFixed(2)}</Text>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.messageButton}
              onPress={() => handleMessageFriend(item)}
            >
              <Text style={styles.messageIcon}>✉️</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.groupButton}
          onPress={() => (navigation as any).navigate('GroupQR', { mode: 'create' })}
        >
          <Text style={styles.groupButtonIcon}>▶</Text>
          <Text style={styles.groupButtonText}>Create Group</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.groupButton}
          onPress={() => (navigation as any).navigate('GroupQR', { mode: 'join' })}
        >
          <Text style={styles.groupButtonIcon}>🔗</Text>
          <Text style={styles.groupButtonText}>Join Group</Text>
        </TouchableOpacity>
      </View>
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
  },
  headerDivider: {
    flex: 1,
    height: 2,
    backgroundColor: '#6C5CE7',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
  },
  messageAllButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAllIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3436',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 24,
    paddingTop: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
  },
  friendAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DFE6E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  friendAvatarText: {
    fontSize: 30,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  bacPill: {
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    minWidth: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  bacPillGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    opacity: 0.9,
  },
  bacText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2D3E50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  messageIcon: {
    fontSize: 20,
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
  },
  groupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2D3436',
  },
  groupButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  groupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
});

export default FriendsScreen;

