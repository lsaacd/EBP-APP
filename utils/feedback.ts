import { Linking } from 'react-native';

/**
 * Sends a feedback email to support using the mailto: protocol.
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
      body = `Hola,\n\nEncontré un detalle en la alabanza #${hymnNumber} ("${hymnTitle}"):\n\n[Por favor describe el error de letra o audio aquí]\n\n— Enviado desde Himnario El Buen Pastor`;
    } else {
      subject = `Report error in Hymn #${hymnNumber} — ${hymnTitle}`;
      body = `Hello,\n\nI found an issue in hymn #${hymnNumber} ("${hymnTitle}"):\n\n[Please describe the lyric or audio error here]\n\n— Sent from El Buen Pastor Hymnal`;
    }
  } else {
    if (language === 'es') {
      subject = 'Reportar error o sugerencia en Himnario EBP';
      body = `Hola,\n\nMe gustaría reportar el siguiente detalle o sugerencia:\n\nAlabanza # (si aplica):\nDetalle:\n\n— Enviado desde Himnario El Buen Pastor`;
    } else {
      subject = 'Report an error or suggestion in El Buen Pastor Hymnal';
      body = `Hello,\n\nI would like to report the following issue or suggestion:\n\nHymn # (if applicable):\nDetails:\n\n— Sent from El Buen Pastor Hymnal`;
    }
  }

  const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  Linking.openURL(url).catch((err) => {
    console.error('Failed to open mail app:', err);
  });
};
