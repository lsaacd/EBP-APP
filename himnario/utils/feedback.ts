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

  const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  Linking.openURL(url).catch((err) => {
    console.error('Failed to open mail app:', err);
  });
};
