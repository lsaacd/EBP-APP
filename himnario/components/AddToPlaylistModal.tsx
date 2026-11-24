import SheetGrabber from './SheetGrabber';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { usePlaylists } from '../context/PlaylistsContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from '../utils/haptics';
import { buildSheetPanGesture } from '../utils/useSheetBackdropGesture';

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
  const { height: windowHeight } = useWindowDimensions();
  const travel = Math.max(460, windowHeight * 0.7);
  const progress = useSharedValue(1);
  const dragOrigin = useSharedValue(0);
  const spring = { damping: 28, stiffness: 240, mass: 1, overshootClamping: true };

  const finishClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const animateClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    progress.value = withSpring(1, spring, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishClose, progress]);

  useEffect(() => {
    if (visible) {
      progress.value = 1;
      progress.value = withSpring(0, spring);
    } else {
      setIsCreating(false);
      setNewPlaylistName('');
      progress.value = 1;
    }
    return () => cancelAnimation(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdropPan = buildSheetPanGesture({
    progress,
    dragOrigin,
    travel,
    onFinishDismiss: finishClose,
    collapseRatio: 0.45,
  });

  const headerPan = buildSheetPanGesture({
    progress,
    dragOrigin,
    travel,
    onFinishDismiss: finishClose,
    collapseRatio: 0.45,
  });

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, 1 - progress.value)),
  }));

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * travel }],
  }));

  const handleCreate = () => {
    const clean = newPlaylistName.trim().slice(0, 100);
    if (clean) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      createPlaylist(clean);
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
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={animateClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={styles.overlay} behavior="padding">
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.backdrop, backdropAnimStyle]}
          />
          <GestureDetector gesture={backdropPan}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                if (isCreating) {
                  setIsCreating(false);
                  setNewPlaylistName('');
                } else {
                  animateClose();
                }
              }}
            />
          </GestureDetector>

          <Animated.View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.surfaceVariants.containerLow },
              sheetAnimStyle,
            ]}
          >
            <SheetGrabber />
            <GestureDetector gesture={headerPan}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.onSurface }]}>
                  {isCreating ? t.createPlaylist : t.addToPlaylist}
                </Text>
                <TouchableOpacity onPress={animateClose} style={styles.closeBtn}>
                  <MaterialIcons name="close" size={24} color={theme.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            </GestureDetector>

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
                maxLength={100}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreate}
                keyboardAppearance={isDarkMode ? 'dark' : 'light'}
              />
              <View style={styles.createActions}>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => {
                    setIsCreating(false);
                    setNewPlaylistName('');
                  }}
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
                  onPress={animateClose}
                >
                  <Text style={[styles.actionBtnText, { color: theme.onPrimary, textAlign: 'center' }]}>
                    {t.done}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
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
    ...fonts.bold,
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
    ...fonts.sansSemiBold,
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
    ...fonts.sansRegular,
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
    ...fonts.sansRegular,
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
    ...fonts.sansSemiBold,
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
