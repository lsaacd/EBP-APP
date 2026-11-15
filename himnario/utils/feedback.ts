import { Alert, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

const FEEDBACK_BASE_URL = 'https://himnarioebp.com/feedback.html';

export const openFeedbackForm = async (
  hymnNumber?: string | number,
  hymnTitle?: string
) => {
  const params = new URLSearchParams({ form: 'audio' });
  if (hymnNumber !== undefined) {
    params.set('hymn', `#${hymnNumber}`);
  }
  if (hymnTitle !== undefined) {
    params.set('title', hymnTitle);
  }
  const formUrl = `${FEEDBACK_BASE_URL}?${params.toString()}`;

  try {
    await WebBrowser.openBrowserAsync(formUrl);
  } catch {
    Linking.openURL(formUrl).catch((err) => {
      console.error('Failed to open feedback form:', err);
    });
  }
};

/**
 * Prompts the user to report an error or send a suggestion via the quick web form
 * (which requires no email setup on their phone) or via their email app (with automatic
 * fallback to the web form if mailto: fails).
 *
 * @param language - Current language code ('es' or 'en')
 * @param hymnNumber - Optional hymn or estribillo number (e.g. 45 or 'E32')
 * @param hymnTitle - Optional hymn or estribillo title
 */
export const sendFeedbackEmail = (
  language: 'es' | 'en',
  hymnNumber?: string | number,
  hymnTitle?: string
) => {
  const email = 'isaacduran167@gmail.com';
  let subject = '';
  let body = '';

  if (hymnNumber !== undefined && hymnTitle !== undefined) {
    if (language === 'es') {
      subject = `Reportar error en Alabanza #${hymnNumber} — ${hymnTitle}`;
      body = `Paz de Dios hermano,\n\nTe saludo en el amor de nuestro Señor Jesucristo. Encontré un detalle en la alabanza #${hymnNumber} ("${hymnTitle}"):\n\n[Por favor describe el error de letra o audio aquí]\n\nDios te bendiga,\n— Enviado desde Himnario El Buen Pastor`;
    } else {
      subject = `Report error in Hymn #${hymnNumber} — ${hymnTitle}`;
      body = `Peace of God brother,\n\nGreetings in the love of our Lord Jesus Christ. I found an issue in hymn #${hymnNumber} ("${hymnTitle}"):\n\n[Please describe the lyric or audio error here]\n\nMay God bless you,\n— Sent from El Buen Pastor Hymnal`;
    }
  } else {
    if (language === 'es') {
      subject = 'Reportar error o sugerencia en Himnario EBP';
      body = `Paz de Dios hermano,\n\nTe saludo en el amor de nuestro Señor Jesucristo. Me gustaría compartir la siguiente observación o sugerencia:\n\nAlabanza # (si aplica):\nDetalle:\n\nDios te bendiga,\n— Enviado desde Himnario El Buen Pastor`;
    } else {
      subject = 'Report an error or suggestion in El Buen Pastor Hymnal';
      body = `Peace of God brother,\n\nGreetings in the love of our Lord Jesus Christ. I would like to share the following issue or suggestion:\n\nHymn # (if applicable):\nDetails:\n\nMay God bless you,\n— Sent from El Buen Pastor Hymnal`;
    }
  }

  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const openMailWithFallback = () => {
    Linking.openURL(mailtoUrl).catch(() => {
      void openFeedbackForm(hymnNumber, hymnTitle);
    });
  };

  Alert.alert(
    language === 'es' ? 'Reportar error o sugerencia' : 'Report error or suggestion',
    language === 'es'
      ? 'Elige cómo deseas enviarnos tu reporte. El formulario rápido funciona directamente sin necesidad de tener correo configurado en tu teléfono.'
      : 'Choose how you would like to send your report. The quick form works directly without needing an email app configured on your phone.',
    [
      {
        text: language === 'es' ? 'Formulario rápido (Recomendado)' : 'Quick Form (Recommended)',
        isPreferred: true,
        onPress: () => {
          void openFeedbackForm(hymnNumber, hymnTitle);
        },
      },
      {
        text: language === 'es' ? 'Enviar por correo electrónico' : 'Send via Email App',
        onPress: openMailWithFallback,
      },
      {
        text: language === 'es' ? 'Cancelar' : 'Cancel',
        style: 'cancel',
      },
    ],
    { cancelable: true }
  );
};
