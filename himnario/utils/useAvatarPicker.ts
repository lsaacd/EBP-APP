import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { pickAvatarBase64, promptAvatarAction } from './avatarUpload';
import { showSuccessToast } from './toast';
import * as Haptics from './haptics';

export function useAvatarPicker() {
  const { user, uploadAvatar, removeAvatar } = useAuth();
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

  const openAvatarMenu = useCallback(() => {
    if (updatingAvatar) return;
    Haptics.selectionAsync().catch(() => {});
    promptAvatarAction({
      hasAvatar: Boolean(user?.avatarUrl),
      labels: {
        title: t.avatarChangeAction,
        chooseLibrary: t.avatarChooseLibrary,
        takePhoto: t.avatarTakePhoto,
        removePhoto: t.avatarRemovePhoto,
        cancel: t.cancel,
      },
      onChooseLibrary: () => {
        void runPick('library');
      },
      onTakePhoto: () => {
        void runPick('camera');
      },
      onRemove: () => {
        void runRemove();
      },
    });
  }, [
    runPick,
    runRemove,
    t.avatarChangeAction,
    t.avatarChooseLibrary,
    t.avatarRemovePhoto,
    t.avatarTakePhoto,
    t.cancel,
    updatingAvatar,
    user?.avatarUrl,
  ]);

  return { updatingAvatar, openAvatarMenu, runPick, runRemove };
}
