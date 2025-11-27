import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Platform,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const { userProfile, logout, updateProfilePicture } = useAuth();
  const { user } = useApp();
  const navigation = useNavigation();
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const handlePickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photos to set a profile picture.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        await updateProfilePicture(uri);
        Alert.alert('Success', 'Profile picture updated!');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions first
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your camera to take a photo.'
        );
        return;
      }

      // Launch camera directly - this should open the camera app, not file picker
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        await updateProfilePicture(uri);
        Alert.alert('Success', 'Profile picture updated!');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleProfilePicturePress = () => {
    console.log('Profile picture tapped - opening modal');
    setShowImagePicker(true);
    console.log('showImagePicker set to:', true);
  };

  const handleCloseImagePicker = () => {
    setShowImagePicker(false);
  };

  const handleSelectFromLibrary = async () => {
    setShowImagePicker(false);
    await handlePickImage();
  };

  const handleTakePhotoPress = async () => {
    setShowImagePicker(false);
    await handleTakePhoto();
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled by AppNavigator
            } catch (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {userProfile && (
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Profile</Text>
            
            {/* Profile Picture */}
            <View style={styles.profilePictureSection}>
              <TouchableOpacity 
                onPress={() => {
                  console.log('Profile picture tapped!');
                  setShowImagePicker(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.profilePictureContainer}>
                  {userProfile.profilePictureUri ? (
                    <Image
                      source={{ uri: userProfile.profilePictureUri }}
                      style={styles.profilePicture}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.profilePicturePlaceholder}>
                      <Text style={styles.profilePicturePlaceholderText}>
                        {userProfile.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.editIconContainer}>
                    <Text style={styles.editIcon}>✎</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={styles.profilePictureLabel}>Tap to change</Text>
            </View>

            <View style={styles.profileCard}>
              <Text style={styles.profileLabel}>Name</Text>
              <Text style={styles.profileValue}>{userProfile.name}</Text>
            </View>
            <View style={styles.profileCard}>
              <Text style={styles.profileLabel}>Email</Text>
              <Text style={styles.profileValue}>{userProfile.email}</Text>
            </View>
            <View style={styles.profileCard}>
              <Text style={styles.profileLabel}>Phone Number</Text>
              <Text style={styles.profileValue}>{userProfile.phoneNumber}</Text>
            </View>
            <View style={styles.profileCard}>
              <Text style={styles.profileLabel}>Height</Text>
              <Text style={styles.profileValue}>{userProfile.height.toFixed(1)} cm</Text>
            </View>
            <View style={styles.profileCard}>
              <Text style={styles.profileLabel}>Weight</Text>
              <Text style={styles.profileValue}>{userProfile.weight.toFixed(1)} kg</Text>
            </View>
            <View style={styles.profileCard}>
              <Text style={styles.profileLabel}>Age</Text>
              <Text style={styles.profileValue}>{userProfile.age} years</Text>
            </View>
            <View style={styles.profileCard}>
              <Text style={styles.profileLabel}>Sex</Text>
              <Text style={styles.profileValue}>
                {userProfile.sex.charAt(0).toUpperCase() + userProfile.sex.slice(1)}
              </Text>
            </View>
            <View style={styles.profileCard}>
              <Text style={styles.profileLabel}>Meal State</Text>
              <Text style={styles.profileValue}>
                {userProfile.mealState.charAt(0).toUpperCase() + userProfile.mealState.slice(1)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              safesip - Know Your Limit, Drink Smarter Socially
            </Text>
            <Text style={styles.aboutSubtext}>
              Track your BAC in real time and support one another in making safer, smarter drinking choices.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseImagePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Profile Picture</Text>
            <Text style={styles.modalSubtitle}>Choose an option</Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSelectFromLibrary}
            >
              <Text style={styles.modalButtonIcon}>📷</Text>
              <Text style={styles.modalButtonText}>Choose from Library</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleTakePhotoPress}
            >
              <Text style={styles.modalButtonIcon}>📸</Text>
              <Text style={styles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={handleCloseImagePicker}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
  },
  profileLabel: {
    fontSize: 16,
    color: '#636E72',
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  profileSection: {
    marginBottom: 32,
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePictureWrapper: {
    marginBottom: 8,
  },
  profilePictureContainer: {
    width: 120,
    height: 120,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicturePlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  editIcon: {
    fontSize: 18,
    color: '#fff',
  },
  profilePictureLabel: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
  },
  aboutCard: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  aboutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  aboutSubtext: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  modalCancelButton: {
    marginTop: 8,
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
});

export default SettingsScreen;

