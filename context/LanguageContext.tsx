import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'es' | 'en';

const STORAGE_KEY = '@himnario_language';

// ─── All translatable UI strings ────────────────────────────────────────────
export const strings = {
  es: {
    appName: 'Himnario El Buen Pastor',
    // Home
    exploreAll: 'Explora Todos Los Himnos',
    exploreCollection: 'EXPLORAR COLECCIÓN COMPLETA',
    availableSongs: 'Alabanzas Disponibles',
    availableSongsSub: 'Reproducir himnos con audio',
    recentHymns: 'Himnos Recientes',
    clearHistory: 'LIMPIAR',
    recentEmpty: 'Aquí aparecerán los himnos que hayas abierto.',
    // Hymn list
    searchPlaceholder: 'Buscar por número o título...',
    filterAll: 'Todos',
    // Favorites
    myFavorites: 'Mis Favoritos',
    savedForQuickAccess: 'Himnos guardados para acceso rápido',
    noFavoritesYet: 'Aún no has guardado himnos en esta colección.',
    exploreHymns: 'Explorar Himnos',
    hymnsSaved_one: 'himno guardado',
    hymnsSaved_other: 'himnos guardados',
    // Playlists
    myPlaylists: 'Mis Listas',
    playlistsTitle: 'Listas de Reproducción',
    noPlaylistsYet: 'Aún no has creado ninguna lista.',
    createPlaylist: 'Crear nueva lista',
    newPlaylistName: 'Nombre de la lista',
    cancel: 'Cancelar',
    create: 'Crear',
    addToPlaylist: 'Añadir a lista...',
    hymnAddedToPlaylist: 'Añadido a la lista',
    hymnRemovedFromPlaylist: 'Eliminado de la lista',
    // Available songs
    availableSongsTitle: 'Alabanzas disponibles',
    availableSongsSubTitle: 'Himnos con acompañamiento de audio',
    noSongsYet: 'Aún no hay alabanzas disponibles.',
    noSongsBody: 'Cuando se agreguen archivos de audio, aparecerán aquí.',
    // Hymn detail controls
    textSize: 'TEXTO',
    darkMode: 'OSCURO',
    lightMode: 'CLARO',
    audio: 'AUDIO',
    hymnNotFound: 'Himno no encontrado',
    audioError: 'No se pudo reproducir el audio.',
    // Settings
    settings: 'Ajustes y Preferencias',
    settingsSub: 'Personaliza tu experiencia de alabanza',
    appearance: 'APARIENCIA',
    darkModeTitle: 'Modo Oscuro',
    darkModeSub: 'Cambia al tema nocturno',
    lightModeTitle: 'Modo Claro',
    lightModeSub: 'Cambia al tema diurno',
    fontSize: 'Tamaño de Fuente',
    appIconTheme: 'Icono de la Aplicación',
    appIconThemeSub: 'Personaliza el color del icono en tu pantalla de inicio',
    iconWhite: 'Blanco',
    iconBlack: 'Negro',
    iconRed: 'Rojo',
    general: 'GENERAL',
    language: 'Idioma',
    languageSub: 'Configura el idioma de la app',
    about: 'Acerca del Himnario',
    aboutSub: 'Versión, créditos e historia',
    reportError: 'Reportar un error',
    reportErrorSub: 'Envía sugerencias o reporta algún error en las letras o audios',
    reportHymnError: '¿Encontraste un error? Reportar por correo',
    rateApp: 'Califica esta App',
    rateAppSub: 'Si esta app ha sido de bendición, comparte tu experiencia para que otros la encuentren.',
    rateAppButton: 'Dejar una Reseña',
    signatureQuote: '"Alaba a Dios con todo tu corazón"',
    // Bottom nav
    tabHome: 'Inicio',
    tabHymns: 'Himnos',
    tabFavorites: 'Favoritos',
    tabSettings: 'Ajustes',
    // Sub-tabs within Hymns
    subTabHimnos: 'Himnos',
    subTabEstribillos: 'Estribillos',
    subTabIndice: 'Índice',
    // Estribillos empty state
    estribillosComingSoon: 'Próximamente',
    estribillosComingSoonSub: 'Los estribillos se agregarán pronto a esta sección.',
    // Índice
    indiceTitle: 'ÍNDICE',
    // Language picker sheet
    spanish: 'Español',
    english: 'English',
    // About modal
    aboutVersion: 'Versión 1.0.0',
    aboutTagline: 'Solo A Dios La Gloria',
    aboutDescription:
      'Himnario El Buen Pastor es una colección digital de himnos de alabanza de la Iglesia del Dios Vivo, Columna y Apoyo de la Verdad "El Buen Pastor" — fundada sobre la Roca inamovible que es Jesucristo, la Piedra Angular. \n\nCada himno en esta colección es una expresión de fe en el glorioso Nombre de nuestro Señor y Salvador Jesucristo, bajo cuyo nombre hemos sido sanados, liberados y perdonados. Porque como dice Su Palabra: "Edificados sobre el fundamento de los apóstoles y profetas, siendo la principal piedra del ángulo Jesucristo mismo;" — Efesios 2:20 \n\nEstos himnos son los mismos que han resonado en nuestros cultos, en nuestras vigilias, en momentos donde solo el Nombre de Jesucristo era el ancla del alma. Incluye letras completas para adorar, para preparar el culto, o para llevar los himnos a donde vayas — porque la alabanza no termina cuando termina el servicio. \n\nY si hoy el camino se siente pesado, que estos himnos te recuerden que el Señor Jesucristo aún reina, aún sana, y aún viene. \n\n"Así que, ofrezcamos por medio de él á Dios siempre sacrificio de alabanza, es á saber, fruto de labios que confiesen á su nombre." — Hebreos 13:15 \n\nQue Su gracia te sostenga, Su paz te guarde, y Su Nombre sea siempre tu fortaleza. Amén.',
    aboutBuiltBy: 'Desarrollado por',
    aboutBuiltByName: 'Iglesia del Dios Vivo, Columna y Apoyo de la Verdad "El Buen Pastor"',
    aboutCopyright: '© 2026 El Buen Pastor. Todos los derechos reservados.',
    aboutFirstRelease: 'Primera versión — Publicación inicial',
    aboutChangelog: 'Novedades en esta versión',
    aboutChangelogItems: [
      'Catálogo completo de himnos con letras',
      'Sistema de favoritos con persistencia local',
      'Historial de himnos recientes',
      'Alabanzas con reproducción de audio',
      'Modo oscuro y tamaño de fuente ajustable',
      'Soporte de idioma Español / English',
    ],
    close: 'Cerrar',
    done: 'Listo',
    // Doctrine card
    doctrineCardTitle: 'Nombre, Lema, Fundamento y Finalidad',
    doctrineCardSub: 'Conoce la identidad de nuestra Iglesia',
    // Doctrine modal
    doctrineModalTitle: 'Nombre, Lema, Fundamento y Finalidad',
    doctrineIntro: 'Alabar al Señor quiere decir "hablar bien de Dios". A través de este Himnario, la Iglesia del Dios Vivo Columna y Apoyo de la Verdad "El Buen Pastor", proclama con todas sus fuerzas el Bien maravilloso que de Jesucristo ha recibido, pues solamente Él es digno de recibir toda alabanza. A Jesucristo Nuestro Señor sea la gloria y el imperio por los siglos de los siglos. Amén.',
    doctrineVerse: '"Te alabaré, oh Jehová, con todo mi corazón; Contaré todas tus maravillas. Alegrareme y Regocijareme en ti: Cantaré a tu nombre, oh Altísimo"\n(Salmo 9:1-2; Efesios 5:19; 1 Cor. 14:15)',
    doctrineName: 'Nombre',
    doctrineNameBody: 'El título que se le aplicará a esta Iglesia será el mismo que el Espíritu Santo le dio a la primitiva Iglesia por instrumentalidad del apóstol Pablo en 1 Timoteo 3:15... Iglesia del Dios Vivo, columna y apoyo de la verdad. Y para distinguirla de otro movimiento con nombre similar, hemos acordado agregarle un título más... "El Buen Pastor".\n\nPorque El Buen Pastor es Dios mismo hecho carne (Juan 14:7).',
    doctrineMotto: 'Lema',
    doctrineMottoBody: 'Nuestro lema será: verdad, honestidad, justicia, santidad y caridad.\n\nEs un deber para todos los miembros de la Iglesia del Dios Vivo, columna y apoyo de la verdad "El Buen Pastor", observar un patrón de conducta dentro de la verdad, apegado a la honestidad en todas sus actividades, con pensamientos y acciones dentro de la justicia, viviendo delante de Dios una vida de santidad en todo, y practicar con todos la caridad.\n\n"Por lo demás hermanos, todo lo que es verdadero, todo lo que es honesto, todo lo justo, todo lo puro, todo lo amable, todo lo que es de buen nombre, si hay virtud alguna... en esto pensad... Y el Dios de paz será con vosotros" (Filipenses 4:8-9).',
    doctrineFoundation: 'Fundamento',
    doctrineFoundationBody: 'Esta Iglesia tiene su fundamento en "apóstoles y profetas siendo la principal piedra del ángulo Jesucristo mismo" (Efesios 2:20). La piedra que reprobaron los edificadores, esta ha sido hecha cabeza del ángulo... (1 Pedro 2:7). Y nadie puede poner otro fundamento que el que esta puesto, el cual es Jesucristo (1 Corintios 3:11).\n\nAsí que el fundamento, la base o cimiento de esta Iglesia esta en el Verbo de Dios o sea la Palabra de Dios, el cual dijo en San Juan 5:39: "Escudriñad las Escrituras porque a vosotros os parece que en ellas tenéis la vida eterna; y ellas son las que dan testimonio de mí".\n\nEsta Iglesia cree que las Sagradas Escrituras del Antiguo y del Nuevo Testamento son el testimonio de la Palabra de Dios escrita; y las considera como la única regla infalible de fe.\n\nEsta Iglesia ha sido edificada por Jesucristo en la roca fundamental de la fe; para que sea la sal de la tierra y la luz del mundo (Mat. 5:13,15).',
    doctrinePurpose: 'Finalidad',
    doctrinePurposeBody: 'Nuestra finalidad objetiva es ver establecida en nuestra Iglesia la santidad, la fraternidad, la honestidad y la justicia en todos nuestros actos, y que todos los componentes estemos unidos formando un cuerpo, como es uno el cuerpo del Señor Jesús (Sal. 133:1-3; Juan 17:21,23; 1 Cor. 12:25,27).\n\nExiste otra finalidad y es uno de los principios fundamentales de nuestra Iglesia: Avivar la predicación del santo evangelio de nuestro Señor Jesucristo (Mar. 16:15; Juan 17:20; 1 Cor. 9:16,18).\n\nEl Señor en su plan divino fundó su Iglesia con el fin de congregar en ella los que han de ser salvos (Hech. 2:47).',
    nowPlaying: 'REPRODUCIENDO',
  },
  en: {
    appName: 'El Buen Pastor Hymnal',
    // Home
    exploreAll: 'Explore All Hymns',
    exploreCollection: 'BROWSE FULL COLLECTION',
    availableSongs: 'Available Hymns',
    availableSongsSub: 'Play hymns with audio',
    recentHymns: 'Recent Hymns',
    clearHistory: 'CLEAR',
    recentEmpty: 'Hymns you open will appear here.',
    // Hymn list
    searchPlaceholder: 'Search by number or title...',
    filterAll: 'All',
    // Favorites
    myFavorites: 'My Favorites',
    savedForQuickAccess: 'Saved hymns for quick access',
    noFavoritesYet: "You haven't saved any hymns yet.",
    exploreHymns: 'Browse Hymns',
    hymnsSaved_one: 'hymn saved',
    hymnsSaved_other: 'hymns saved',
    // Playlists
    myPlaylists: 'My Playlists',
    playlistsTitle: 'Playlists',
    noPlaylistsYet: "You haven't created any playlists yet.",
    createPlaylist: 'Create new playlist',
    newPlaylistName: 'Playlist name',
    cancel: 'Cancel',
    create: 'Create',
    addToPlaylist: 'Add to playlist...',
    hymnAddedToPlaylist: 'Added to playlist',
    hymnRemovedFromPlaylist: 'Removed from playlist',
    // Available songs
    availableSongsTitle: 'Available hymns',
    availableSongsSubTitle: 'Hymns with audio accompaniment',
    noSongsYet: 'No hymns available yet.',
    noSongsBody: 'When audio files are added, they will appear here.',
    // Hymn detail controls
    textSize: 'TEXT',
    darkMode: 'DARK',
    lightMode: 'LIGHT',
    audio: 'AUDIO',
    hymnNotFound: 'Hymn not found',
    audioError: 'Could not play the audio.',
    // Settings
    settings: 'Settings & Preferences',
    settingsSub: 'Customize your worship experience',
    appearance: 'APPEARANCE',
    darkModeTitle: 'Dark Mode',
    darkModeSub: 'Switch to night theme',
    lightModeTitle: 'Light Mode',
    lightModeSub: 'Switch to day theme',
    fontSize: 'Font Size',
    appIconTheme: 'App Icon Theme',
    appIconThemeSub: 'Customize the icon color on your home screen',
    iconWhite: 'White',
    iconBlack: 'Black',
    iconRed: 'Red',
    general: 'GENERAL',
    language: 'Language',
    languageSub: 'Set the app language',
    about: 'About the Hymnal',
    aboutSub: 'Version, credits and history',
    reportError: 'Report an Error',
    reportErrorSub: 'Send suggestions or report an error in lyrics or audio',
    reportHymnError: 'Found an error? Report via email',
    rateApp: 'Rate this App',
    rateAppSub: 'If this app has been a blessing, share your experience so others can find it.',
    rateAppButton: 'Leave a Review',
    signatureQuote: '"Praise God with all your heart"',
    // Bottom nav
    tabHome: 'Home',
    tabHymns: 'Hymns',
    tabFavorites: 'Favorites',
    tabSettings: 'Settings',
    // Sub-tabs within Hymns
    subTabHimnos: 'Hymns',
    subTabEstribillos: 'Choruses',
    subTabIndice: 'Index',
    // Estribillos empty state
    estribillosComingSoon: 'Coming Soon',
    estribillosComingSoonSub: 'Choruses will be added to this section soon.',
    // Índice
    indiceTitle: 'INDEX',
    // Language picker sheet
    spanish: 'Español',
    english: 'English',
    // About modal
    aboutVersion: 'Version 1.0.0',
    aboutTagline: 'Solo A Dios La Gloria',
    aboutDescription:
      'El Buen Pastor Himnario is a digital collection of praise hymns from the Church of the Living God, Pillar and Ground of the Truth "El Buen Pastor" — founded upon the unmovable Rock that is Jesus Christ, the Chief Cornerstone. \n\nEvery hymn in this collection is an expression of faith in the glorious Name of our Lord and Savior Jesus Christ — the Name under which we have been healed, set free, and forgiven. For as His Word declares: "Built upon the foundation of the apostles and prophets, Jesus Christ himself being the chief corner stone;" — Ephesians 2:20 \n\nThese are the same hymns that have echoed through our services, our prayer vigils, in moments when the Name of Jesus Christ was the only anchor the soul had. It includes full lyrics to worship, to prepare for service, or to carry these hymns wherever you go — because praise does not end when the service does. \n\nAnd if the road feels heavy today, let these hymns remind you that the Lord Jesus Christ still reigns, still heals, and is still coming. \n\n"By him therefore let us offer the sacrifice of praise to God continually, that is, the fruit of our lips giving thanks to his name." — Hebrews 13:15 \n\nMay His grace sustain you, His peace guard you, and His Name be your fortress forevermore. Amen.',
    aboutBuiltBy: 'Developed by',
    aboutBuiltByName: 'Iglesia del Dios Vivo, Columna y Apoyo de la Verdad "El Buen Pastor"',
    aboutCopyright: '© 2026 El Buen Pastor. All rights reserved.',
    aboutFirstRelease: 'First release — Initial launch',
    aboutChangelog: "What's new in this version",
    aboutChangelogItems: [
      'Full hymn catalog with complete lyrics',
      'Favorites system with local persistence',
      'Recently viewed hymns history',
      'Hymns with audio playback',
      'Dark mode and adjustable font size',
      'Spanish / English language support',
    ],
    close: 'Close',
    done: 'Done',
    // Doctrine card
    doctrineCardTitle: 'Name, Motto, Foundation & Purpose',
    doctrineCardSub: 'Learn about the identity of our Church',
    // Doctrine modal
    doctrineModalTitle: 'Name, Motto, Foundation & Purpose',
    doctrineIntro: 'To praise the Lord means to "speak well of God." Through this Hymnal, the Church of the Living God, Pillar and Ground of the Truth "El Buen Pastor," proclaims with all its strength the wonderful Good it has received from Jesus Christ, for only He is worthy to receive all praise. To Jesus Christ our Lord be the glory and the dominion forever and ever. Amen.',
    doctrineVerse: '"I will praise thee, O Lord, with my whole heart; I will shew forth all thy marvellous works. I will be glad and rejoice in thee: I will sing praise to thy name, O thou most High"\n(Psalm 9:1-2; Ephesians 5:19; 1 Cor. 14:15)',
    doctrineName: 'Name',
    doctrineNameBody: 'The title applied to this Church shall be the same that the Holy Spirit gave to the early Church through the apostle Paul in 1 Timothy 3:15... Church of the Living God, pillar and ground of the truth. And to distinguish it from another movement with a similar name, we have agreed to add another title... "El Buen Pastor" (The Good Shepherd).\n\nBecause The Good Shepherd is God Himself made flesh (John 14:7).',
    doctrineMotto: 'Motto',
    doctrineMottoBody: 'Our motto shall be: truth, honesty, justice, holiness, and charity.\n\nIt is a duty for all members of the Church of the Living God, Pillar and Ground of the Truth "El Buen Pastor," to observe a pattern of conduct within the truth, committed to honesty in all activities, with thoughts and actions within justice, living before God a life of holiness in everything, and practicing charity with all.\n\n"Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue... think on these things... And the God of peace shall be with you" (Philippians 4:8-9).',
    doctrineFoundation: 'Foundation',
    doctrineFoundationBody: 'This Church has its foundation in "the apostles and prophets, Jesus Christ himself being the chief corner stone" (Ephesians 2:20). The stone which the builders rejected, the same is made the head of the corner... (1 Peter 2:7). And no man can lay another foundation than that which is laid, which is Jesus Christ (1 Corinthians 3:11).\n\nThus the foundation, the base and cornerstone of this Church rests in the Word of God, who said in John 5:39: "Search the scriptures; for in them ye think ye have eternal life: and they are they which testify of me."\n\nThis Church believes that the Holy Scriptures of the Old and New Testament are the testimony of the written Word of God; and considers them as the only infallible rule of faith.\n\nThis Church has been built by Jesus Christ on the fundamental rock of faith; to be the salt of the earth and the light of the world (Matt. 5:13,15).',
    doctrinePurpose: 'Purpose',
    doctrinePurposeBody: 'Our objective purpose is to see established in our Church holiness, fraternity, honesty and justice in all our acts, and that all members be united forming one body, as the body of the Lord Jesus is one (Ps. 133:1-3; John 17:21,23; 1 Cor. 12:25,27).\n\nThere is another purpose and it is one of the fundamental principles of our Church: To stir up the preaching of the holy gospel of our Lord Jesus Christ (Mark 16:15; John 17:20; 1 Cor. 9:16,18).\n\nThe Lord in His divine plan founded His Church for the purpose of gathering in it those who are to be saved (Acts 2:47).',
    nowPlaying: 'NOW PLAYING',
  },
};

export type Strings = typeof strings.es;

interface LanguageContextType {
  language: Language;
  t: Strings;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  t: strings.es,
  setLanguage: () => { },
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw === 'en' || raw === 'es') setLanguageState(raw);
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, t: strings[language], setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
