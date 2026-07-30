import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { usePlaylists } from '../context/PlaylistsContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface AddToPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  hymnId: string;
}

export default function AddToPlaylistModal({ visible, onClose, hymnId }: AddToPlaylistModalProps) {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { playlists, createPlaylist, addHymnToPlaylist, removeHymnFromPlaylist, isHymnInPlaylist } = usePlaylists();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      createPlaylist(newPlaylistName);
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  const handleToggleHymn = (playlistId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isHymnInPlaylist(playlistId, hymnId)) {
      removeHymnFromPlaylist(playlistId, hymnId);
    } else {
      addHymnToPlaylist(playlistId, hymnId);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={() => {
          if (isCreating) setIsCreating(false);
          else onClose();
        }}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.modalContainer, { backgroundColor: theme.surfaceVariants.containerLow }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.onSurface }]}>
              {isCreating ? t.createPlaylist : t.addToPlaylist}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={theme.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {isCreating ? (
            <View style={styles.createContainer}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.background, 
                  color: theme.onSurface,
                  borderColor: theme.outlineVariant 
                }]}
                placeholder={t.newPlaylistName}
                placeholderTextColor={theme.outline}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreate}
                keyboardAppearance={isDarkMode ? 'dark' : 'light'}
              />
              <View style={styles.createActions}>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => setIsCreating(false)}
                >
                  <Text style={[styles.actionBtnText, { color: theme.onSurfaceVariant }]}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.actionBtnPrimary, { backgroundColor: theme.primary }]} 
                  onPress={handleCreate}
                >
                  <Text style={[styles.actionBtnText, { color: theme.onPrimary }]}>{t.create}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                <TouchableOpacity 
                  style={styles.createPlaylistRow} 
                  onPress={() => setIsCreating(true)}
                >
                  <View style={[styles.iconBox, { backgroundColor: theme.primary + '1A' }]}>
                    <MaterialIcons name="add" size={24} color={theme.primary} />
                  </View>
                  <Text style={[styles.createPlaylistText, { color: theme.primary }]}>
                    {t.createPlaylist}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '30' }]} />

                {playlists.map(playlist => {
                  const isAdded = isHymnInPlaylist(playlist.id, hymnId);
                  return (
                    <TouchableOpacity 
                      key={playlist.id} 
                      style={styles.playlistRow}
                      onPress={() => handleToggleHymn(playlist.id)}
                    >
                      <MaterialIcons 
                        name={isAdded ? "check-box" : "check-box-outline-blank"} 
                        size={24} 
                        color={isAdded ? theme.primary : theme.outline} 
                      />
                      <Text style={[styles.playlistName, { color: theme.onSurface }]} numberOfLines={1}>
                        {playlist.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              
              <View style={styles.doneBtnContainer}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.actionBtnPrimary, styles.fullWidthBtn, { backgroundColor: theme.primary }]} 
                  onPress={onClose}
                >
                  <Text style={[styles.actionBtnText, { color: theme.onPrimary, textAlign: 'center' }]}>
                    {t.done}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  closeBtn: {
    padding: 4,
  },
  listContainer: {
    flexGrow: 0,
  },
  createPlaylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  createPlaylistText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 16,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  playlistName: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  createContainer: {
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'PublicSans_400Regular',
    marginBottom: 24,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionBtnPrimary: {
    paddingHorizontal: 24,
  },
  actionBtnText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 15,
  },
  doneBtnContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  fullWidthBtn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 14,
  },
});
