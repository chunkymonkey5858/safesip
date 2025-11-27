import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { useApp } from '../contexts/AppContext';
import { useNavigation, useRoute } from '@react-navigation/native';

const GroupQRScreen = () => {
  const { createGroup, joinGroup } = useApp();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { mode?: 'create' | 'join' } | undefined;
  const [permission, requestPermission] = useCameraPermissions();
  
  const [mode, setMode] = useState<'create' | 'join' | 'display' | 'scanning'>(
    params?.mode || 'create'
  );
  const [groupName, setGroupName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [createdGroup, setCreatedGroup] = useState<any>(null);
  const [scanned, setScanned] = useState(false);

  const handleCreateGroup = () => {
    if (groupName.trim()) {
      const group = createGroup(groupName);
      setCreatedGroup(group);
      setMode('display');
    }
  };

  const handleJoinGroup = async () => {
    if (groupId.trim()) {
      try {
        joinGroup(groupId.trim().toUpperCase());
        Alert.alert('Success', 'You have joined the group!');
        navigation.goBack();
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to join group. Please check the group ID.');
      }
    }
  };

  const handleScanQR = async () => {
    if (!permission) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan QR codes.');
        return;
      }
    }
    setMode('scanning');
    setScanned(false);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    // Parse safesip://group/{groupCode}
    const match = data.match(/safesip:\/\/group\/(.+)/);
    if (match && match[1]) {
      try {
        joinGroup(match[1]);
        Alert.alert('Success', 'You have joined the group!');
        navigation.goBack();
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to join group.');
        setScanned(false);
      }
    } else {
      Alert.alert('Invalid QR Code', 'This QR code is not a valid safesip group code.');
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'display' ? 'Share Group' : mode === 'create' ? 'Create Group' : 'Join Group'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {mode === 'create' && (
        <View style={styles.content}>
          <Text style={styles.title}>Create a New Group</Text>
          <Text style={styles.description}>
            Create a group to track drinking sessions with friends
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Group name (e.g., Friday Night)"
            value={groupName}
            onChangeText={setGroupName}
          />

          <TouchableOpacity
            style={[styles.button, !groupName.trim() && styles.buttonDisabled]}
            onPress={handleCreateGroup}
            disabled={!groupName.trim()}
          >
            <Text style={styles.buttonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'display' && createdGroup && (
        <View style={styles.content}>
          <Text style={styles.title}>"{createdGroup.name}"</Text>
          <Text style={styles.description}>
            Share this QR code with friends to join your group
          </Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={`safesip://group/${createdGroup.groupCode || createdGroup.id}`}
              size={250}
              backgroundColor="white"
            />
          </View>

          {/* Group ID Display */}
          <View style={styles.groupIdContainer}>
            <Text style={styles.groupIdLabel}>Group ID:</Text>
            <View style={styles.groupIdBox}>
              <Text style={styles.groupIdText}>{createdGroup.groupCode || createdGroup.id}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => {
                  const codeToCopy = createdGroup.groupCode || createdGroup.id;
                  Clipboard.setString(codeToCopy);
                  Alert.alert('Copied!', `Group ID "${codeToCopy}" copied to clipboard`);
                }}
              >
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.groupIdHint}>
              Friends can enter this code to join manually
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.membersButton}
            onPress={() => {
              // Show group members with messaging options
              Alert.alert(
                'Group Members',
                `Group: ${createdGroup.name}\nMembers: ${createdGroup.members.length}`,
                [
                  { text: 'OK', style: 'default' },
                  {
                    text: 'Message All Members',
                    onPress: () => {
                      Alert.alert('Coming Soon', 'Group messaging feature coming soon!');
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.membersButtonText}>Members ({createdGroup.members.length})</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'join' && (
        <View style={styles.content}>
          <Text style={styles.title}>Join a Group</Text>
          <Text style={styles.description}>Scan a QR code or enter a group ID</Text>

          <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
            <Text style={styles.scanButtonIcon}>📷</Text>
            <Text style={styles.scanButtonText}>Scan QR Code</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Enter Group Code (e.g., ABC123)"
            value={groupId}
            onChangeText={(text) => setGroupId(text.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            autoCapitalize="characters"
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.button, !groupId.trim() && styles.buttonDisabled]}
            onPress={handleJoinGroup}
            disabled={!groupId.trim()}
          >
            <Text style={styles.buttonText}>Join Group</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'scanning' && (
        <View style={styles.scanContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanInstruction}>Align QR code within the frame</Text>
              <TouchableOpacity
                style={styles.cancelScanButton}
                onPress={() => {
                  setMode('join');
                  setScanned(false);
                }}
              >
                <Text style={styles.cancelScanButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      )}
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
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
    marginBottom: 32,
  },
  qrContainer: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#DFE6E9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    marginBottom: 24,
  },
  button: {
    width: '100%',
    backgroundColor: '#6C5CE7',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  membersButton: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6C5CE7',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  membersButtonText: {
    color: '#6C5CE7',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanButton: {
    width: '100%',
    backgroundColor: '#6C5CE7',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  scanButtonIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DFE6E9',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#636E72',
    fontWeight: '600',
  },
  scanContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#6C5CE7',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanInstruction: {
    color: '#fff',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  cancelScanButton: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#E74C3C',
    borderRadius: 24,
  },
  cancelScanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupIdContainer: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  groupIdLabel: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 8,
    fontWeight: '600',
  },
  groupIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#6C5CE7',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    justifyContent: 'space-between',
  },
  groupIdText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C5CE7',
    letterSpacing: 2,
    flex: 1,
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  groupIdHint: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default GroupQRScreen;

