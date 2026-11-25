import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { pickAvatarBase64, promptAvatarAction } from './avatarUpload';
import { showSuccessToast } from './toast';
import * as Haptics from './haptics';

export function useAvatarPicker() {
  const { user, uploadAvatar, removeAvatar, restoreGoogleAvatar, signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const runPick = useCallback(
    async (source: 'camera' | 'library') => {
      if (updatingAvatar) return;
      setUpdatingAvatar(true);
      try {
        const base64 = await pickAvatarBase64(source, {
          unavailable: t.avatarUnavailable,
          cameraDenied: t.avatarCameraDenied,
          libraryDenied: t.avatarLibraryDenied,
          processError: t.avatarProcessError,
        });
        if (!base64) return;
        await uploadAvatar(base64);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccessToast(t.avatarUpdatedToast);
      } catch (err: any) {
        if (String(err?.message || '') === 'auth_cancelled') return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const raw = String(err?.message || '');
        const msg = raw && !/^[a-z0-9_]+$/.test(raw) ? raw : t.avatarUploadError;
        Alert.alert(t.avatarChangeAction, msg);
      } finally {
        setUpdatingAvatar(false);
      }
    },
    [
      t.avatarCameraDenied,
      t.avatarChangeAction,
      t.avatarLibraryDenied,
      t.avatarProcessError,
      t.avatarUnavailable,
      t.avatarUpdatedToast,
      t.avatarUploadError,
      updatingAvatar,
      uploadAvatar,
    ],
  );

  const runRemove = useCallback(async () => {
    if (updatingAvatar) return;
    setUpdatingAvatar(true);
    try {
      await removeAvatar();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccessToast(t.avatarRemovedToast);
    } catch (err: any) {
      if (String(err?.message || '') === 'auth_cancelled') return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t.avatarChangeAction, t.avatarUploadError);
    } finally {
      setUpdatingAvatar(false);
    }
  }, [
    removeAvatar,
    t.avatarChangeAction,
    t.avatarRemovedToast,
    t.avatarUploadError,
    updatingAvatar,
  ]);

  const runRestoreGoogle = useCallback(async () => {
    if (updatingAvatar) return;
    setUpdatingAvatar(true);
    try {
      await restoreGoogleAvatar();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccessToast(t.avatarRestoredToast);
    } catch (err: any) {
      const code = String(err?.message || '');
      if (code === 'auth_cancelled') return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (code === 'google_avatar_expired') {
        Alert.alert(t.avatarRestoreGoogle, t.avatarGoogleExpired, [
          { text: t.cancel, style: 'cancel' },
          {
            text: t.authContinueWithGoogle,
            onPress: () => {
              void signInWithGoogle()
                .then(() => restoreGoogleAvatar())
                .then(() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  showSuccessToast(t.avatarRestoredToast);
                })
                .catch(() => {});
            },
          },
        ]);
      } else {
        Alert.alert(t.avatarRestoreGoogle, t.avatarGoogleRestoreFailed);
      }
    } finally {
      setUpdatingAvatar(false);
    }
  }, [
    restoreGoogleAvatar,
    signInWithGoogle,
    t.authContinueWithGoogle,
    t.avatarGoogleExpired,
    t.avatarGoogleRestoreFailed,
    t.avatarRestoreGoogle,
    t.avatarRestoredToast,
    t.cancel,
    updatingAvatar,
  ]);

  const openAvatarMenu = useCallback(() => {
    if (updatingAvatar) return;
    Haptics.selectionAsync().catch(() => {});
    promptAvatarAction({
      hasAvatar: Boolean(user?.avatarUrl),
      hasGoogleAvatar: Boolean(user?.hasGoogleAvatar),
      labels: {
        title: t.avatarChangeAction,
        chooseLibrary: t.avatarChooseLibrary,
        takePhoto: t.avatarTakePhoto,
        restoreGoogle: t.avatarRestoreGoogle,
        removePhoto: t.avatarRemovePhoto,
        cancel: t.cancel,
      },
      onChooseLibrary: () => {
        void runPick('library');
      },
      onTakePhoto: () => {
        void runPick('camera');
      },
      onRestoreGoogle: () => {
        void runRestoreGoogle();
      },
      onRemove: () => {
        void runRemove();
      },
    });
  }, [
    runPick,
    runRemove,
    runRestoreGoogle,
    t.avatarChangeAction,
    t.avatarChooseLibrary,
    t.avatarRemovePhoto,
    t.avatarRestoreGoogle,
    t.avatarTakePhoto,
    t.cancel,
    updatingAvatar,
    user?.avatarUrl,
    user?.hasGoogleAvatar,
  ]);

  return { updatingAvatar, openAvatarMenu, runPick, runRemove, runRestoreGoogle };
}
