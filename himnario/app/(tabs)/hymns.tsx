/**
 * HymnListScreen component — Provides a searchable and filterable list of all hymns.
 *
 * Responsibility:
 * - Displays the full collection of hymns, choruses, and alphabetical index.
 * - Implements the smart search engine (typo-tolerant, accent-insensitive, number/prefix-aware, lyric snippets, highlighted matches).
 * - Provides category chips (Todos, Adoración, Alabanza, etc.).
 * - Shows saved-offline and audio availability indicators on list rows.
 * - Implements a Liquid Glass / Material 3 A–Z fast scroller (with a Himnos / Coritos switch in Índice) and hymn number scroller.
 * - Supports Instagram-style horizontal tab swiping via TabSwipeWrapper.
 *
 * @returns {React.JSX.Element} The rendered Hymn List screen.
 */
import React, { useState, useMemo, useRef, useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  View,
  FlatList,
  useWindowDimensions,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Platform,
  PanResponder,
  LayoutChangeEvent,
  Animated,
  Keyboard,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage, translateCategory, translateCategories } from '../../context/LanguageContext';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { getLocalizedHymns } from '../../data/alabanzasEnglish';
import { fonts } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../../utils/haptics';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { useHymnFilter } from '../../context/HymnFilterContext';
import { TOP_HYMNS_FILTER, rankByLikes, useTopHymns } from '../../utils/topHymns';
import { hasHymnAudio } from '../../data/audioRegistry';
import { offlineAudio } from '../../audio/offline-audio';
import GlassSurface from '../../components/GlassSurface';
import TabSwipeWrapper from '../../components/TabSwipeWrapper';
import HymnRowLink from '../../components/HymnRowLink';
import ListSortMenu, { type ListSortOption } from '../../components/ListSortMenu';
import { ANDROID_BOTTOM_BAR_HEIGHT } from '../../components/androidBottomLayout';
import {
  create as createSearchEngine,
  normalize as normalizeSearch,
  segmentTextByRanges,
  type SearchableHymn,
  type SearchResult,
} from '../../utils/search-engine';
import { getHymnScrollerLabel } from '../../utils/hymnScrollerLabel';

const ALPHABET = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
const SYSTEM_FONT = Platform.OS === 'ios' ? undefined : 'sans-serif';

const himnosSearchEngineEs = createSearchEngine(hymnsData as any[]);
const estribillosSearchEngineEs = createSearchEngine(estribillosData as any[]);

function mergeBilingualHits<T extends SearchableHymn>(
  primaryHits: SearchResult<T>[],
  secondaryHits: SearchResult<T>[],
  localizedById: Map<string, T>,
): SearchResult<T>[] {
  if (secondaryHits.length === 0) return primaryHits;
  const seen = new Set(primaryHits.map((r) => String(r.hymn.id)));
  const merged = [...primaryHits];
  for (const hit of secondaryHits) {
    const id = String(hit.hymn.id);
    if (!seen.has(id)) {
      seen.add(id);
      const localized = localizedById.get(id) ?? hit.hymn;
      merged.push({ ...hit, hymn: localized });
    }
  }
  return merged;
}

function HighlightedText({
  text,
  query,
  style,
  highlightColor,
  numberOfLines,
}: {
  text: string;
  query: string;
  style: any;
  highlightColor: string;
  numberOfLines?: number;
}) {
  const segments = useMemo(() => segmentTextByRanges(text, query), [text, query]);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((seg, idx) =>
        seg.highlight ? (
          <Text
            key={idx}
            style={{
              backgroundColor: highlightColor,
              ...fonts.boldItalic,
            }}
          >
            {seg.text}
          </Text>
        ) : (
          <Text key={idx}>{seg.text}</Text>
        )
      )}
    </Text>
  );
}

export default function HymnListScreen() {
  const router = useRouter();
  const { fontScale } = useWindowDimensions();
  const { theme, isDarkMode } = useTheme();
  const { t, language, hymnLanguage } = useLanguage();
  const englishHymnsData = useMemo(
    () => getLocalizedHymns(hymnsData as any[], 'en'),
    [],
  );
  const englishEstribillosData = useMemo(
    () => getLocalizedHymns(estribillosData as any[], 'en'),
    [],
  );
  const localizedHymnsData = hymnLanguage === 'en' ? englishHymnsData : (hymnsData as any[]);
  const localizedEstribillosData =
    hymnLanguage === 'en' ? englishEstribillosData : (estribillosData as any[]);

  const localizedHymnsById = useMemo(
    () => new Map(localizedHymnsData.map((h: any) => [String(h.id), h])),
    [localizedHymnsData],
  );
  const localizedEstribillosById = useMemo(
    () => new Map(localizedEstribillosData.map((h: any) => [String(h.id), h])),
    [localizedEstribillosData],
  );

  const himnosSearchEngineEn = useMemo(
    () => createSearchEngine(englishHymnsData),
    [englishHymnsData],
  );
  const estribillosSearchEngineEn = useMemo(
    () => createSearchEngine(englishEstribillosData),
    [englishEstribillosData],
  );
  const insets = useSafeAreaInsets();
  const ipadTopOffset = Platform.OS === 'ios' && Boolean((Platform as any).isPad) ? 50 : 0;
  const { search, setSearch, searchFilter, setSearchFilter, activeSubTab, setActiveSubTab } =
    useHymnFilter();
  const offline = useSyncExternalStore(offlineAudio.subscribe, offlineAudio.getSnapshot);

  const params = useLocalSearchParams<{ tab?: string; t?: string; focusSearch?: string }>();

  const [draggingLetter, setDraggingLetter] = useState<string | null>(null);
  const [indiceSection, setIndiceSection] = useState<'himnos' | 'estribillos' | 'coritos'>('himnos');
  const [indiceBodyHeight, setIndiceBodyHeight] = useState(0);
  const [hymnSort, setHymnSort] = useState<'number' | 'az' | 'audio'>('number');

  const hymnSortOptions = useMemo<readonly ListSortOption<'number' | 'az' | 'audio'>[]>(
    () => [
      { value: 'number', label: t.sortByNumber, shortLabel: t.sortByNumberShort, iosIcon: 'number' },
      { value: 'az', label: t.sortByAZ, shortLabel: t.sortByAZShort, iosIcon: 'textformat.abc' },
      { value: 'audio', label: t.sortAudioFirst, shortLabel: t.sortAudioFirstShort, iosIcon: 'speaker.wave.2' },
    ],
    [t.sortAudioFirst, t.sortAudioFirstShort, t.sortByAZ, t.sortByAZShort, t.sortByNumber, t.sortByNumberShort],
  );

  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flatListRef = useRef<any>(null);
  const indiceListRef = useRef<any>(null);
  const searchRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const chipsScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const overlayChipsScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const sliderTrackRef = useRef<React.ComponentRef<typeof View>>(null);
  const sidebarTrackRef = useRef<React.ComponentRef<typeof View>>(null);
  const { currentHymnId, miniPlayerHeight, showFullPlayer } = useNowPlaying();
  const [isFocused, setIsFocused] = useState(false);
  const blurAnim = useRef(new Animated.Value(0)).current;
  const isTopFilter = searchFilter === TOP_HYMNS_FILTER;
  const { likes: topLikes, loading: topLoading } = useTopHymns(isTopFilter);
  const isSearchActive =
    isFocused ||
    search.length > 0 ||
    (searchFilter !== 'Todos' && searchFilter !== 'All');

  useEffect(() => {
    if (params?.tab === 'himnos') {
      setActiveSubTab('himnos');
    }
  }, [params?.tab, params?.t, setActiveSubTab]);

  useEffect(() => {
    if (params?.focusSearch === '1') {
      const timer = setTimeout(() => {
        searchRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [params?.focusSearch, params?.t]);

  useEffect(() => {
    Animated.timing(blurAnim, {
      toValue: isSearchActive ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [blurAnim, isSearchActive]);

  const contentHeight = useRef(0);
  const scrollViewHeight = useRef(0);

  // Dynamically derive filter chips based on active tab
  const currentFilters = useMemo(() => {
    const dataSource = activeSubTab === 'estribillos' ? estribillosData : hymnsData;
    const tags = new Set<string>();
    dataSource.forEach((h) => {
      if (h.categories) {
        h.categories
          .split('•')
          .map((tag: string) => tag.trim())
          .filter(Boolean)
          .forEach((tag: string) => {
            tags.add(tag);
          });
      }
    });
    const sorted = Array.from(tags).sort((a, b) => {
      const labelA = translateCategory(a, language);
      const labelB = translateCategory(b, language);
      return labelA.localeCompare(labelB);
    });
    const allLabel = t.filterAll;

    if (searchFilter !== 'Todos' && searchFilter !== 'All' && sorted.includes(searchFilter)) {
      const filteredSorted = sorted.filter((tag) => tag !== searchFilter);
      return [allLabel, TOP_HYMNS_FILTER, searchFilter, ...filteredSorted];
    }

    return [allLabel, TOP_HYMNS_FILTER, ...sorted];
  }, [t, activeSubTab, language, searchFilter]);

  // ── Vertical scroll-position slider state ──────────────────────────────
  const [scrollFraction, setScrollFraction] = useState(0);
  const [sliderVisible, setSliderVisible] = useState(false);
  const sliderTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sliderTrackHeight, setSliderTrackHeight] = useState(0);
  const isDragging = useRef(false);
  const sliderTrackY = useRef(0);

  const handleScroll = useCallback((event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const maxY = contentHeight.current - scrollViewHeight.current;
    if (maxY > 0) {
      if (!isDragging.current) setScrollFraction(previous => Math.abs(previous - currentOffset / maxY) > 0.002 ? Math.min(1, Math.max(0, currentOffset / maxY)) : previous);
    }

    setSliderVisible(true);
    if (sliderTimeout.current) clearTimeout(sliderTimeout.current);
    if (!isDragging.current) {
      sliderTimeout.current = setTimeout(() => setSliderVisible(false), 2000);
    }
  }, []);

  const filtered = useMemo(() => {
    const base = activeSubTab === 'estribillos' ? localizedEstribillosData : localizedHymnsData;
    if (hymnSort === 'az') {
      return [...base].sort((a, b) =>
        normalizeSearch(a.title).localeCompare(normalizeSearch(b.title))
      );
    }
    if (hymnSort === 'audio') {
      return base
        .filter((h) => hasHymnAudio(String(h.id)))
        .sort((a, b) => Number(a.number) - Number(b.number));
    }
    return base;
  }, [activeSubTab, localizedEstribillosData, localizedHymnsData, hymnSort]);

  const scrubFrame = useRef<number | null>(null);
  const latestScrubFraction = useRef(0);
  const flushScrub = useCallback(() => {
    scrubFrame.current = null;
    const fraction = latestScrubFraction.current;
    setScrollFraction(fraction);
    const maxY = Math.max(0, contentHeight.current - scrollViewHeight.current);
    flatListRef.current?.scrollToOffset({ offset: fraction * maxY, animated: false });
  }, []);
  const queueScrub = useCallback((pageY: number) => {
    if (sliderTrackHeight <= 0) return;
    latestScrubFraction.current = Math.min(1, Math.max(0, (pageY - sliderTrackY.current) / sliderTrackHeight));
    if (scrubFrame.current === null) scrubFrame.current = requestAnimationFrame(flushScrub);
  }, [sliderTrackHeight, flushScrub]);
  const finishScrub = useCallback(() => {
    if (scrubFrame.current !== null) { cancelAnimationFrame(scrubFrame.current); flushScrub(); }
    isDragging.current = false;
    if (sliderTimeout.current) clearTimeout(sliderTimeout.current);
    sliderTimeout.current = setTimeout(() => setSliderVisible(false), 2000);
  }, [flushScrub]);
  useEffect(() => () => { if (scrubFrame.current !== null) cancelAnimationFrame(scrubFrame.current); }, []);
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => {
      isDragging.current = true;
      setSliderVisible(true);
      if (sliderTimeout.current) clearTimeout(sliderTimeout.current);
      queueScrub(event.nativeEvent.pageY);
    },
    onPanResponderMove: event => queueScrub(event.nativeEvent.pageY),
    onPanResponderRelease: finishScrub,
    onPanResponderTerminate: finishScrub,
  }), [queueScrub, finishScrub]);

  const measureSliderTrack = useCallback(() => {
    sliderTrackRef.current?.measure((_x, _y, _width, height, _pageX, pageY) => {
      if (height !== undefined && height > 0) setSliderTrackHeight(height);
      if (pageY !== undefined) sliderTrackY.current = pageY;
    });
  }, []);

  const onSliderTrackLayout = useCallback((e: LayoutChangeEvent) => {
    setSliderTrackHeight(e.nativeEvent.layout.height);
    setTimeout(measureSliderTrack, 100);
  }, [measureSliderTrack]);

  const handleFilterChange = (f: string) => {
    const isAll = f === 'Todos' || f === 'All';
    const activeIsAll = searchFilter === 'Todos' || searchFilter === 'All';
    const active = f === searchFilter || (isAll && activeIsAll);
    const defaultAll = t.filterAll;
    setSearchFilter(active && !isAll ? defaultAll : f);
    chipsScrollRef.current?.scrollTo({ x: 0, animated: true });
    overlayChipsScrollRef.current?.scrollTo({ x: 0, animated: true });
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
  };

  const globalSearchResults = useMemo(() => {
    const isAll = searchFilter === 'Todos' || searchFilter === 'All';
    if (!search.trim() && isAll) {
      return {
        himnos: [] as SearchResult<any>[],
        estribillos: [] as SearchResult<any>[],
      };
    }

    const matchesFilters = (h: any) => {
      if (isTopFilter) return true; // ranked below instead of filtered by category
      if (!isAll) {
        const hasCat =
          h.categories &&
          h.categories
            .split('•')
            .map((tag: string) => tag.trim())
            .some(
              (cat: string) =>
                cat === searchFilter || translateCategory(cat, language) === searchFilter
            );
        if (!hasCat) return false;
      }
      return true;
    };

    const rawQuery = search.trim();
    const primaryHimnosEngine =
      hymnLanguage === 'en' ? himnosSearchEngineEn : himnosSearchEngineEs;
    const secondaryHimnosEngine =
      hymnLanguage === 'en' ? himnosSearchEngineEs : himnosSearchEngineEn;
    const primaryEstribillosEngine =
      hymnLanguage === 'en' ? estribillosSearchEngineEn : estribillosSearchEngineEs;
    const secondaryEstribillosEngine =
      hymnLanguage === 'en' ? estribillosSearchEngineEs : estribillosSearchEngineEn;

    const himnosHits = rawQuery
      ? mergeBilingualHits(
          primaryHimnosEngine(rawQuery, { field: 'all' }),
          secondaryHimnosEngine(rawQuery, { field: 'all' }),
          localizedHymnsById,
        )
      : localizedHymnsData.map((h) => ({ hymn: h, score: 0, kind: '', snippet: '' }));
    const estribillosHits = rawQuery
      ? mergeBilingualHits(
          primaryEstribillosEngine(rawQuery, { field: 'all' }),
          secondaryEstribillosEngine(rawQuery, { field: 'all' }),
          localizedEstribillosById,
        )
      : localizedEstribillosData.map((h) => ({ hymn: h, score: 0, kind: '', snippet: '' }));

    if (isTopFilter) {
      // Most-liked first; the like count takes the place of the search snippet.
      const withCount = (items: SearchResult<any>[]) =>
        rankByLikes(items, topLikes).map((item) => ({
          ...item,
          snippet: t.hymnsMostLikedCount.replace('{n}', String(item.likes)),
        }));
      return { himnos: withCount(himnosHits), estribillos: withCount(estribillosHits) };
    }

    return {
      himnos: himnosHits.filter((r) => matchesFilters(r.hymn)),
      estribillos: estribillosHits.filter((r) => matchesFilters(r.hymn)),
    };
  }, [
    t,
    isTopFilter,
    topLikes,
    search,
    searchFilter,
    language,
    hymnLanguage,
    himnosSearchEngineEn,
    estribillosSearchEngineEn,
    localizedHymnsById,
    localizedEstribillosById,
    localizedHymnsData,
    localizedEstribillosData,
  ]);

  // ── Índice Logic (switches between Himnos, Estribillos 1–26, and Coritos 27+) ──
  const indiceData = useMemo(() => {
    const sourceList =
      indiceSection === 'estribillos'
        ? localizedEstribillosData.filter((h: any) => {
            const num = Number(h.number);
            return num >= 1 && num <= 26;
          })
        : indiceSection === 'coritos'
          ? localizedEstribillosData.filter((h: any) => Number(h.number) > 26)
          : localizedHymnsData;
    const sorted = [...sourceList].sort((a, b) =>
      normalizeSearch(a.title).localeCompare(normalizeSearch(b.title))
    );

    const grouped: any[] = [];
    grouped.push({
      type: 'main_header',
      title:
        indiceSection === 'estribillos'
          ? t.indiceEstribillosTitle || 'ÍNDICE ALFABÉTICO DE ESTRIBILLOS'
          : indiceSection === 'coritos'
            ? t.indiceCoritosTitle || 'ÍNDICE ALFABÉTICO DE CORITOS'
            : t.indiceHimnosTitle || 'ÍNDICE ALFABÉTICO DE HIMNOS',
      marginTop: 4,
    });

    let currentLetter = '';
    sorted.forEach((hymn) => {
      const letter = normalizeSearch(hymn.title).charAt(0).toUpperCase();
      const displayLetter = letter.match(/[A-Z]/) ? letter : letter || 'A';

      if (displayLetter !== currentLetter) {
        currentLetter = displayLetter;
        grouped.push({ type: 'header', letter: currentLetter, section: indiceSection });
      }
      grouped.push({ type: 'item', hymn });
    });

    return grouped;
  }, [t, indiceSection, localizedEstribillosData, localizedHymnsData]);

  // Fixed index row geometry makes distant letter jumps exact without measurement retries.
  // Account for the scrolling 52px ListHeaderComponent (`indiceToggleWrap`: 8 + 38 + 6).
  const indexLayouts = useMemo(() => {
    let offset = 52;
    return indiceData.map(item => {
      const length = (item.type === 'main_header' ? 96 : item.type === 'header' ? 54 : 44) * fontScale;
      const layout = { length, offset };
      offset += length;
      return layout;
    });
  }, [indiceData, fontScale]);
  const letterIndices = useMemo(() => {
    const indices: Record<string, number> = {};
    indices['#'] = 0;
    indiceData.forEach((item, index) => {
      if (item.type === 'header' && !(item.letter in indices)) {
        indices[item.letter] = index;
      }
    });
    return indices;
  }, [indiceData]);

  // ── Alphabet Sidebar Drag Logic (Workstream F) ──────────────────────────────
  const sidebarTrackY = useRef(0);
  const sidebarTrackHeight = useRef(0);
  const lastScrolledLetter = useRef<string | null>(null);

  const handleSidebarDrag = useCallback(
    (pageY: number) => {
      if (sidebarTrackHeight.current === 0) return;
      const relativeY = pageY - sidebarTrackY.current - 6;
      const fraction = Math.max(0, Math.min(1, relativeY / Math.max(1, sidebarTrackHeight.current - 12)));
      const index = Math.min(ALPHABET.length - 1, Math.floor(fraction * ALPHABET.length));
      const letter = ALPHABET[index];

      if (letter !== lastScrolledLetter.current) {
        lastScrolledLetter.current = letter;
        let targetLetter = letter;
        if (letterIndices[targetLetter] === undefined) {
          let found = false;
          for (let i = index; i < ALPHABET.length; i++) {
            if (letterIndices[ALPHABET[i]] !== undefined) {
              targetLetter = ALPHABET[i];
              found = true;
              break;
            }
          }
          if (!found) {
            for (let i = index; i >= 0; i--) {
              if (letterIndices[ALPHABET[i]] !== undefined) {
                targetLetter = ALPHABET[i];
                break;
              }
            }
          }
        }

        const targetIndex = letterIndices[targetLetter];
        if (targetIndex !== undefined && indiceListRef.current) {
          Haptics.selectionAsync().catch(() => {});
          indiceListRef.current.scrollToIndex({ index: targetIndex, animated: false, viewPosition: 0 });
        }
        setDraggingLetter(targetLetter);
        if (bubbleFadeTimer.current) {
          clearTimeout(bubbleFadeTimer.current);
          bubbleFadeTimer.current = null;
        }
        bubbleOpacity.stopAnimation();
        bubbleOpacity.setValue(1);
      }
    },
    [bubbleOpacity, letterIndices]
  );

  const finishSidebarDrag = useCallback(() => {
    lastScrolledLetter.current = null;
    if (bubbleFadeTimer.current) clearTimeout(bubbleFadeTimer.current);
    bubbleFadeTimer.current = setTimeout(() => {
      Animated.timing(bubbleOpacity, { toValue: 0, duration: 180, useNativeDriver: true })
        .start(({ finished }) => { if (finished) setDraggingLetter(null); });
    }, 120);
  }, [bubbleOpacity]);
  useEffect(() => () => {
    if (bubbleFadeTimer.current) clearTimeout(bubbleFadeTimer.current);
    if (sliderTimeout.current) clearTimeout(sliderTimeout.current);
  }, []);
  const alphabetPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => handleSidebarDrag(event.nativeEvent.pageY),
    onPanResponderMove: event => handleSidebarDrag(event.nativeEvent.pageY),
    onPanResponderRelease: finishSidebarDrag,
    onPanResponderTerminate: finishSidebarDrag,
  }), [handleSidebarDrag, finishSidebarDrag]);

  const renderHymnBadges = (hymnId: string | number) => {
    const idStr = String(hymnId);
    const isSaved = offline.savedIds.has(idStr);
    const hasAudio = hasHymnAudio(idStr);
    if (!isSaved && !hasAudio) return null;
    return (
      <View style={styles.badgesRow}>
        {isSaved ? (
          <View
            style={[
              styles.savedBadgePill,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(110,22,25,0.08)',
              },
            ]}
          >
            <MaterialIcons name="offline-pin" size={14} color={theme.primary} />
          </View>
        ) : hasAudio ? (
          <MaterialIcons
            name="volume-up"
            size={15}
            color={theme.outlineVariant}
            style={{ opacity: 0.75 }}
          />
        ) : null}
      </View>
    );
  };

  // ── Render Sections ──────────────────────────────────────────

  const selectSubTab = (nextKey: 'himnos' | 'estribillos' | 'indice') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSubTab(nextKey);
    setSearchFilter('Todos');
    setScrollFraction(0);
    latestScrubFraction.current = 0;
    chipsScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
    if (indiceListRef.current) {
      indiceListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  };

  const renderSubTabs = () => {
    return (
      <View style={styles.subTabBar}>
        {[
          { key: 'himnos', label: t.subTabHimnos || 'Himnos' },
          { key: 'estribillos', label: t.subTabEstribillos || 'Estribillos' },
          { key: 'indice', label: t.subTabIndice || 'Índice' },
        ].map((tab) => {
          const isActive = activeSubTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => selectSubTab(tab.key as any)}
              style={styles.subTabItem}
            >
              <Text
                style={[
                  styles.subTabText,
                  isActive && styles.subTabActiveText,
                  { color: isActive ? theme.primary : theme.onSurfaceVariant },
                ]}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const isPad = Platform.OS === 'ios' && Boolean((Platform as any).isPad);
  const activeMiniPlayer = Boolean(currentHymnId) && !showFullPlayer;
  const resolvedMiniPlayerHeight =
    miniPlayerHeight > 0 ? miniPlayerHeight : Platform.OS === 'android' ? 74 : 58;
  // Floating iOS 26 Liquid Glass tab bar clears ~60pt above the home-indicator safe area;
  // iPad keeps tabs at the top so only bottom safe-area breathing room is needed.
  const bottomNavClearance =
    Platform.OS === 'ios'
      ? isPad
        ? Math.max(insets.bottom, 20)
        : 60 + insets.bottom
      : insets.bottom + ANDROID_BOTTOM_BAR_HEIGHT;
  const hymnsScrollerBottom =
    bottomNavClearance + (activeMiniPlayer ? resolvedMiniPlayerHeight + 14 : 8);

  useEffect(() => {
    if (activeSubTab === 'indice') return;
    const timer = setTimeout(measureSliderTrack, 90);
    return () => clearTimeout(timer);
  }, [activeSubTab, hymnsScrollerBottom, measureSliderTrack]);

  const renderHimnos = () => {
    const totalHymns = filtered.length;
    const currentIndex = Math.max(
      0,
      Math.min(totalHymns - 1, Math.round(scrollFraction * (totalHymns - 1)))
    );
    const scrollerLabel = getHymnScrollerLabel(
      filtered,
      currentIndex,
      hymnSort,
    );

    return (
      <View style={styles.flex1}>
        <FlashList
          ref={flatListRef}
          data={filtered}
          extraData={`${language}-${offline.saved}-${hymnSort}`}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.scroll, { paddingRight: 28 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onContentSizeChange={(_w, h) => {
            contentHeight.current = h;
          }}
          onLayout={(e) => {
            scrollViewHeight.current = e.nativeEvent.layout.height;
          }}
          // @ts-ignore
          estimatedItemSize={93}
          drawDistance={800}
          ListHeaderComponent={
            <View style={[styles.searchCluster, { marginTop: 0 }]}>
              <ScrollView
                ref={chipsScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                <ListSortMenu
                  pill
                  value={hymnSort}
                  onChange={(nextSort) => {
                    setHymnSort(nextSort);
                    setScrollFraction(0);
                    latestScrubFraction.current = 0;
                    flatListRef.current?.scrollToOffset?.({ offset: 0, animated: false });
                  }}
                  options={hymnSortOptions}
                  menuTitle={t.sortMenuTitle}
                />
                {currentFilters.map((f) => {
                  const isAll = f === 'Todos' || f === 'All';
                  const activeIsAll = searchFilter === 'Todos' || searchFilter === 'All';
                  const active = f === searchFilter || (isAll && activeIsAll);
                  const displayLabel = isAll
                    ? t.filterAll
                    : f === TOP_HYMNS_FILTER
                      ? t.hymnsMostLiked
                      : translateCategory(f, language);
                  return (
                    <Pressable
                      key={f}
                      onPress={() => handleFilterChange(f)}
                      style={({ pressed }) => [
                        styles.amazonChipWrap,
                        pressed && { opacity: 0.78, transform: [{ scale: 0.97 }] },
                      ]}
                    >
                      {active ? (
                        <View
                          style={[
                            styles.chip,
                            styles.chipActiveSolid,
                            {
                              backgroundColor: theme.primary,
                              borderColor: theme.primary,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: theme.onPrimary },
                            ]}
                          >
                            {displayLabel}
                          </Text>
                        </View>
                      ) : Platform.OS === 'ios' ? (
                        <GlassSurface
                          isInteractive
                          glassEffectStyle="regular"
                          intensity={56}
                          tonalColor={
                            isDarkMode
                              ? 'rgba(255,255,255,0.09)'
                              : theme.surfaceVariants.containerHigh
                          }
                          style={[
                            styles.chip,
                            styles.chipIosGlass,
                            {
                              borderColor: isAll
                                ? theme.primary + '55'
                                : isDarkMode
                                  ? 'rgba(255,255,255,0.16)'
                                  : theme.outlineVariant + '44',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: theme.onSurface },
                            ]}
                          >
                            {displayLabel}
                          </Text>
                        </GlassSurface>
                      ) : (
                        <View
                          style={[
                            styles.chip,
                            styles.chipAndroidNative,
                            {
                              backgroundColor: theme.surfaceVariants.containerHighest,
                              borderColor: isAll
                                ? theme.primary + '55'
                                : theme.outlineVariant + '38',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: theme.onSurface },
                            ]}
                          >
                            {displayLabel}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          }
          renderItem={({ item: hymn }) => (
            <View key={hymn.id}>
              <HymnRowLink
                hymn={hymn}
                href={`/hymn/${hymn.id}`}
                style={styles.listItem}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.listNum, { color: theme.primary }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {hymn.number}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listTitle, { color: theme.onSurface }]}>
                    {hymn.title}
                  </Text>
                  <Text
                    style={[
                      styles.listTags,
                      { color: theme.onSurfaceVariant, opacity: 0.7 },
                    ]}
                  >
                    {translateCategories(hymn.categories, language)}
                  </Text>
                </View>
                {renderHymnBadges(hymn.id)}
              </HymnRowLink>
              <View
                style={[styles.divider, { backgroundColor: theme.outlineVariant + '1A' }]}
              />
            </View>
          )}
          ListFooterComponent={
            <View style={styles.quoteBlock}>
              <MaterialIcons
                name="auto-awesome"
                size={36}
                color={theme.primary}
                style={{ marginBottom: 16 }}
              />
              <Text style={[styles.quoteText, { color: theme.onSurface }]}>
                {t.footerQuoteText}
              </Text>
              <Text style={[styles.quoteAuthor, { color: theme.outline }]}>
                {t.footerQuoteAuthor}
              </Text>
              <View
                style={{ height: Math.max(32, insets.bottom + (currentHymnId ? 100 : 20)) }}
              />
            </View>
          }
        />

        {totalHymns > 10 && !isSearchActive && (
          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={
              t.hymnsHymnNumberScroller
            }
            accessibilityValue={{ text: scrollerLabel }}
            style={[
              styles.sliderContainer,
              {
                bottom: hymnsScrollerBottom,
                opacity: sliderVisible ? 1 : 0.35,
              },
            ]}
          >
            <View
              ref={sliderTrackRef}
              style={styles.sliderTrack}
              onLayout={onSliderTrackLayout}
              {...panResponder.panHandlers}
            >
              <View
                style={[
                  styles.sliderTrackLine,
                  { backgroundColor: isDarkMode ? '#ffffff22' : '#6e161922' },
                ]}
              />
              <View
                style={[
                  styles.sliderActiveLine,
                  {
                    backgroundColor: isDarkMode ? '#ffffff' : '#6e1619',
                    height: Math.max(12, scrollFraction * sliderTrackHeight),
                  },
                ]}
              />
            </View>
            {Platform.OS === 'ios' ? (
              <GlassSurface
                isInteractive
                glassEffectStyle="regular"
                intensity={55}
                style={styles.sliderPositionGlassPill}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={[
                    styles.sliderPositionPillText,
                    { color: isDarkMode ? '#ffffff' : '#6e1619' },
                  ]}
                >
                  {scrollerLabel}
                </Text>
              </GlassSurface>
            ) : (
              <View
                style={[
                  styles.sliderPositionAndroidPill,
                  { backgroundColor: theme.surfaceVariants.containerHighest },
                ]}
              >
                <Text
                  style={[
                    styles.sliderPositionPillText,
                    { color: theme.primary },
                  ]}
                >
                  {scrollerLabel}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Start below the 52pt [Himnos | Estribillos | Coritos] pill strip and extend
  // cleanly down to right above the floating bottom tab bar (or active MiniPlayer).
  const scrubberTopClearance = 54;
  const scrubberBottomClearance =
    bottomNavClearance + (activeMiniPlayer ? resolvedMiniPlayerHeight + 14 : 10);
  const scrubberAvailableHeight =
    indiceBodyHeight > 0
      ? Math.max(240, indiceBodyHeight - scrubberTopClearance - scrubberBottomClearance)
      : 480;
  const scrubberCapsuleHeight = Math.min(580, scrubberAvailableHeight);

  const measureSidebarTrack = useCallback(() => {
    sidebarTrackRef.current?.measure((_x, _y, _width, height, _pageX, pageY) => {
      if (height !== undefined && height > 0) sidebarTrackHeight.current = height;
      if (pageY !== undefined) sidebarTrackY.current = pageY;
    });
  }, []);

  useEffect(() => {
    if (activeSubTab !== 'indice') return;
    const timer = setTimeout(measureSidebarTrack, 90);
    return () => clearTimeout(timer);
  }, [activeSubTab, indiceSection, measureSidebarTrack, scrubberBottomClearance, scrubberCapsuleHeight]);

  const renderIndice = () => {
    const estribillosLabel = t.hymnsChoruses;
    const coritosLabel = t.hymnsCoritos;
    const himnosLabel = t.subTabHimnos || t.tabHymns;

    const indiceToggleHeader = (
      <View style={styles.indiceToggleWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          alwaysBounceHorizontal
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.indiceTogglePill}
        >
          {(
            [
              { key: 'himnos', label: himnosLabel },
              { key: 'estribillos', label: estribillosLabel },
              { key: 'coritos', label: coritosLabel },
            ] as const
          ).map((opt) => {
            const active = indiceSection === opt.key;
            return (
              <Pressable
                key={opt.key}
                style={({ pressed }) => [
                  styles.indiceToggleBtnWrap,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                ]}
                onPress={() => {
                  if (indiceSection === opt.key) return;
                  Haptics.selectionAsync().catch(() => {});
                  setIndiceSection(opt.key);
                  setTimeout(() => {
                    indiceListRef.current?.scrollToOffset?.({ offset: 0, animated: false });
                  }, 20);
                }}
              >
                {active ? (
                  <View
                    style={[
                      styles.indiceToggleOption,
                      styles.chipActiveSolid,
                      {
                        backgroundColor: theme.primary,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.indiceToggleText,
                        { color: theme.onPrimary },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>
                ) : Platform.OS === 'ios' ? (
                  <GlassSurface
                    isInteractive
                    glassEffectStyle="regular"
                    intensity={56}
                    tonalColor={
                      isDarkMode
                        ? 'rgba(255,255,255,0.09)'
                        : theme.surfaceVariants.containerHigh
                    }
                    style={[
                      styles.indiceToggleOption,
                      styles.chipIosGlass,
                      {
                        borderColor: isDarkMode
                          ? 'rgba(255,255,255,0.16)'
                          : theme.outlineVariant + '44',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.indiceToggleText,
                        { color: theme.onSurface },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </GlassSurface>
                ) : (
                  <View
                    style={[
                      styles.indiceToggleOption,
                      styles.chipAndroidNative,
                      {
                        backgroundColor: theme.surfaceVariants.containerHighest,
                        borderColor: theme.outlineVariant + '38',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.indiceToggleText,
                        { color: theme.onSurface },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );

    return (
      <View style={styles.flex1}>
        <View
          style={styles.indiceBody}
          onLayout={(e) => {
            const nextH = Math.round(e.nativeEvent.layout.height);
            if (nextH > 0 && Math.abs(nextH - indiceBodyHeight) > 1) {
              setIndiceBodyHeight(nextH);
            }
          }}
        >
          <View style={styles.indiceListContainer}>
            <FlatList
              ref={indiceListRef}
              data={indiceData}
              extraData={`${language}-${offline.saved}-${indiceSection}`}
              keyExtractor={(item, index) =>
                item.type +
                '_' +
                (item.section || 'none') +
                '_' +
                (item.letter || item.hymn?.id || index)
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({ ...indexLayouts[index], index })}
              initialNumToRender={24}
              maxToRenderPerBatch={24}
              windowSize={7}
              ListHeaderComponent={indiceToggleHeader}
              renderItem={({ item }) => {
                if (item.type === 'main_header') {
                  return (
                    <Text
                      style={[
                        styles.indiceMainHeader,
                        { color: theme.onSurface, height: 96 * fontScale, marginTop: 0, marginBottom: 0, textAlignVertical: 'center' },
                      ]}
                    >
                      {item.title}
                    </Text>
                  );
                }
                if (item.type === 'header') {
                  return (
                    <View style={[styles.indiceLetterHeader, { height: 54 * fontScale, marginTop: 0 }]}>
                      <Text
                        style={[
                          styles.indiceLetterText,
                          { color: isDarkMode ? '#fdf9f2' : '#4a3533' },
                        ]}
                      >
                        --{item.letter}--
                      </Text>
                    </View>
                  );
                }
                const isSaved = offline.savedIds.has(String(item.hymn.id));
                return (
                  <HymnRowLink
                    hymn={item.hymn}
                    href={`/hymn/${item.hymn.id}`}
                    style={[styles.indiceItemRow, { height: 44 * fontScale }]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.indiceItemTitle, { color: theme.onSurface }]}
                      numberOfLines={1}
                    >
                      {item.hymn.title}
                    </Text>
                    {isSaved && (
                      <MaterialIcons
                        name="offline-pin"
                        size={14}
                        color={theme.primary}
                        style={{ marginLeft: 6 }}
                      />
                    )}
                    <View
                      style={[
                        styles.indiceDotsWrapper,
                        {
                          borderBottomWidth: 1,
                          borderStyle: 'dotted',
                          borderColor: isDarkMode ? 'rgba(255,255,255,0.22)' : '#cbb8b2',
                        },
                      ]}
                    />
                    <Text style={[styles.indiceItemNumber, { color: theme.onSurface }]}>
                      {item.hymn.number}
                    </Text>
                  </HymnRowLink>
                );
              }}
              ListFooterComponent={
                <View style={styles.quoteBlock}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={36}
                    color={theme.primary}
                    style={{ marginBottom: 16 }}
                  />
                  <Text style={[styles.quoteText, { color: theme.onSurface }]}>
                    {t.footerQuoteText}
                  </Text>
                  <Text style={[styles.quoteAuthor, { color: theme.outline }]}>
                    {t.footerQuoteAuthor}
                  </Text>
                  <View
                    style={{
                      height: Math.max(32, insets.bottom + (currentHymnId ? 100 : 20)),
                    }}
                  />
                </View>
              }
            />
          </View>

          {/* Workstream F: Floating Glass / M3 Alphabet Sidebar (centered safely above MiniPlayer & bottom tabs) */}
          {!isSearchActive && (
            <View
              style={[
                styles.alphabetSidebarWrapper,
                {
                  paddingTop: scrubberTopClearance,
                  paddingBottom: scrubberBottomClearance,
                },
              ]}
            >
              <GlassSurface
                isInteractive
                glassEffectStyle="regular"
                intensity={65}
                tonalColor={theme.surfaceVariants.containerHighest}
                style={[styles.alphabetGlassCapsule, { height: scrubberCapsuleHeight }]}
              >
                <View
                  ref={sidebarTrackRef}
                  accessible
                  accessibilityRole="adjustable"
                  accessibilityLabel={
                    t.hymnsAlphabeticalIndex
                  }
                  accessibilityValue={{ text: draggingLetter || '' }}
                  style={styles.alphabetSidebar}
                  onLayout={(e) => {
                    sidebarTrackHeight.current = e.nativeEvent.layout.height;
                    setTimeout(measureSidebarTrack, 80);
                  }}
                  {...alphabetPanResponder.panHandlers}
                >
                  {ALPHABET.map((letter) => {
                    const hasLetter = letterIndices[letter] !== undefined;
                    const isCurrent = draggingLetter === letter;
                    return (
                      <View
                        key={letter}
                        style={[
                          styles.alphabetTouch,
                          isCurrent && {
                            backgroundColor: theme.primary,
                            borderRadius: 9,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.alphabetText,
                            {
                              color: isCurrent
                                ? theme.onPrimary
                                : hasLetter
                                ? theme.primary
                                : theme.outlineVariant + '66',
                            },
                          ]}
                          allowFontScaling={false}
                          numberOfLines={1}
                        >
                          {letter}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </GlassSurface>
            </View>
          )}
        </View>

        {draggingLetter && (
          <Animated.View
            style={[styles.draggingBubbleContainer, { opacity: bubbleOpacity }]}
            pointerEvents="none"
          >
            {Platform.OS === 'ios' ? (
              <GlassSurface
                isInteractive
                glassEffectStyle="regular"
                intensity={80}
                style={styles.draggingGlassBubble}
              >
                <Text style={[styles.draggingBubbleText, { color: theme.primary }]}>
                  {draggingLetter}
                </Text>
              </GlassSurface>
            ) : (
              <View style={[styles.draggingBubble, { backgroundColor: theme.primary }]}>
                <Text style={[styles.draggingBubbleText, { color: theme.onPrimary }]}>
                  {draggingLetter}
                </Text>
              </View>
            )}
          </Animated.View>
        )}
      </View>
    );
  };

  const renderEstribillos = () => {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons
          name="library-music"
          size={64}
          color={theme.primary + '80'}
          style={{ marginBottom: 24 }}
        />
        <Text style={[styles.emptyTitle, { color: theme.onSurface }]}>
          {t.estribillosComingSoon || 'Próximamente'}
        </Text>
        <Text style={[styles.emptySub, { color: theme.onSurfaceVariant }]}>
          {t.estribillosComingSoonSub || 'Los estribillos se agregarán pronto a esta sección.'}
        </Text>
      </View>
    );
  };

  const renderSearchResultSection = (
    items: SearchResult<any>[],
    title: string,
    iconName: 'music-note' | 'queue-music',
    keyPrefix: string
  ) => {
    if (items.length === 0) return null;
    const highlightBg = isDarkMode ? 'rgba(255, 214, 102, 0.25)' : 'rgba(110, 22, 25, 0.14)';

    return (
      <View style={{ marginBottom: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <MaterialIcons name={iconName} size={18} color={theme.primary} />
          <Text
            style={{
              ...fonts.sansBold,
              fontSize: 13,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: theme.primary,
            }}
          >
            {title}
          </Text>
          <View
            style={{
              flex: 1,
              height: StyleSheet.hairlineWidth,
              backgroundColor: theme.primary + '30',
              marginLeft: 8,
            }}
          />
        </View>
        {items.map((result, index) => {
          const { hymn, snippet } = result;
          return (
            <HymnRowLink
              key={`${keyPrefix}-${hymn.id}`}
              hymn={hymn}
              href={`/hymn/${hymn.id}`}
              activeOpacity={0.6}
              onNavigate={() => {
                Keyboard.dismiss();
                searchRef.current?.blur();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 14,
                backgroundColor: isDarkMode
                  ? theme.surfaceVariants.containerLow
                  : theme.surfaceVariants.containerLowest,
                borderTopLeftRadius: index === 0 ? 14 : 0,
                borderTopRightRadius: index === 0 ? 14 : 0,
                borderBottomLeftRadius: index === items.length - 1 ? 14 : 0,
                borderBottomRightRadius: index === items.length - 1 ? 14 : 0,
                borderBottomWidth:
                  index < items.length - 1 ? StyleSheet.hairlineWidth : 0,
                borderBottomColor: theme.outlineVariant + '40',
              }}
            >
              <Text
                style={{
                  ...fonts.bold,
                  fontSize: 20,
                  width: 48,
                  color: theme.primary,
                  textAlign: 'center',
                }}
              >
                {hymn.number}
              </Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <HighlightedText
                  text={hymn.title}
                  query={search}
                  highlightColor={highlightBg}
                  numberOfLines={1}
                  style={{
                    ...fonts.regularItalic,
                    fontSize: 17,
                    color: theme.onSurface,
                    lineHeight: 22,
                  }}
                />
                {snippet ? (
                  <HighlightedText
                    text={snippet}
                    query={search}
                    highlightColor={highlightBg}
                    numberOfLines={2}
                    style={{
                      ...fonts.sansRegular,
                      fontSize: 12,
                      color: theme.onSurfaceVariant,
                      lineHeight: 17,
                      marginTop: 3,
                    }}
                  />
                ) : hymn.categories ? (
                  <Text
                    style={{
                      ...fonts.sansRegular,
                      fontSize: 11,
                      color: theme.onSurfaceVariant + 'AA',
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {translateCategories(hymn.categories, language)}
                  </Text>
                ) : null}
              </View>
              {renderHymnBadges(hymn.id)}
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={theme.outlineVariant}
                style={{ marginLeft: 6 }}
              />
            </HymnRowLink>
          );
        })}
      </View>
    );
  };

  return (
    <TabSwipeWrapper
      currentTab="hymns"
      style={[styles.root, { backgroundColor: theme.background }]}
      shouldIgnoreTouch={(_pageX, pageY) => pageY < insets.top + 195}
    >
      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(1,1,1,0.92)' : 'rgba(250,245,238,0.95)',
          isDarkMode ? 'rgba(1,1,1,0.0)' : 'rgba(250,245,238,0.0)',
        ]}
        style={[styles.statusBarScrim, { height: insets.top + 28 }]}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        {/* Unified Top Search Bar */}
        <View
          style={{
            paddingTop: insets.top + ipadTopOffset,
            zIndex: 10,
            paddingHorizontal: 16,
            paddingBottom: 4,
          }}
        >
          <View
            style={[
              styles.searchRow,
              { backgroundColor: theme.surfaceVariants.containerLow, marginBottom: 0 },
            ]}
          >
            <TouchableOpacity
              onPress={() => searchRef.current?.focus()}
              activeOpacity={0.4}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="search"
                size={28}
                color={theme.outline}
                style={{ marginRight: 8 }}
              />
            </TouchableOpacity>
            <TextInput
              ref={searchRef}
              placeholder={t.searchPlaceholder}
              placeholderTextColor={theme.outlineVariant + 'AA'}
              style={[styles.searchInput, { color: theme.onSurface }]}
              value={search}
              onChangeText={handleSearchChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              returnKeyType="search"
              autoCorrect={true}
              spellCheck={true}
              keyboardAppearance={isDarkMode ? 'dark' : 'light'}
              enablesReturnKeyAutomatically={true}
            />
            {isSearchActive && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleSearchChange('');
                  const defaultAll = t.filterAll;
                  setSearchFilter(defaultAll);
                  searchRef.current?.blur();
                }}
                style={{ padding: 4 }}
              >
                <MaterialIcons name="cancel" size={22} color={theme.outline} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Blur Overlay & Search Results */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { zIndex: 5, opacity: blurAnim, top: insets.top + ipadTopOffset + 60 },
          ]}
          pointerEvents={isSearchActive ? 'auto' : 'none'}
        >
          <View style={{ flex: 1 }}>
            <Pressable
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor:
                    Platform.OS === 'android'
                      ? isDarkMode
                        ? 'rgba(1,1,1,0.97)'
                        : 'rgba(252,249,242,0.97)'
                      : isDarkMode
                        ? 'rgba(1,1,1,0.72)'
                        : 'rgba(252,249,242,0.78)',
                },
              ]}
              onPress={() => {
                Keyboard.dismiss();
                handleSearchChange('');
                const defaultAll = t.filterAll;
                setSearchFilter(defaultAll);
                searchRef.current?.blur();
              }}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 55 : 100}
                tint={isDarkMode ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            </Pressable>

            <View style={{ flex: 1, zIndex: 10 }}>
              {/* Category Chips only inside Search View */}
              <View style={{ paddingTop: 10, paddingBottom: 8 }}>
                <ScrollView
                  ref={overlayChipsScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.chips, { paddingHorizontal: 16 }]}
                  keyboardShouldPersistTaps="handled"
                >
                  {currentFilters.map((f) => {
                    const isAll = f === 'Todos' || f === 'All';
                    const activeIsAll = searchFilter === 'Todos' || searchFilter === 'All';
                    const active = f === searchFilter || (isAll && activeIsAll);
                    const displayLabel = isAll
                    ? t.filterAll
                    : f === TOP_HYMNS_FILTER
                      ? t.hymnsMostLiked
                      : translateCategory(f, language);
                    return (
                      <Pressable
                        key={`overlay-chip-${f}`}
                        onPress={() => handleFilterChange(f)}
                        style={({ pressed }) => [
                          styles.amazonChipWrap,
                          pressed && { opacity: 0.78, transform: [{ scale: 0.97 }] },
                        ]}
                      >
                        {active ? (
                          <View
                            style={[
                              styles.chip,
                              styles.chipActiveSolid,
                              {
                                backgroundColor: theme.primary,
                                borderColor: theme.primary,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                { color: theme.onPrimary },
                              ]}
                            >
                              {displayLabel}
                            </Text>
                          </View>
                        ) : Platform.OS === 'ios' ? (
                          <GlassSurface
                            isInteractive
                            glassEffectStyle="regular"
                            intensity={56}
                            tonalColor={
                              isDarkMode
                                ? 'rgba(255,255,255,0.09)'
                                : theme.surfaceVariants.containerHigh
                            }
                            style={[
                              styles.chip,
                              styles.chipIosGlass,
                              {
                                borderColor: isAll
                                  ? theme.primary + '55'
                                  : isDarkMode
                                    ? 'rgba(255,255,255,0.16)'
                                    : theme.outlineVariant + '44',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                { color: theme.onSurface },
                              ]}
                            >
                              {displayLabel}
                            </Text>
                          </GlassSurface>
                        ) : (
                          <View
                            style={[
                              styles.chip,
                              styles.chipAndroidNative,
                              {
                                backgroundColor: theme.surfaceVariants.containerHighest,
                                borderColor: isAll
                                  ? theme.primary + '55'
                                  : theme.outlineVariant + '38',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                { color: theme.onSurface },
                              ]}
                            >
                              {displayLabel}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Results List */}
              {(globalSearchResults.himnos.length > 0 ||
                globalSearchResults.estribillos.length > 0) && (
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 8,
                    paddingBottom: 350,
                  }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Results count pill */}
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <View
                      style={{
                        backgroundColor: isDarkMode
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(110,22,25,0.08)',
                        paddingHorizontal: 14,
                        paddingVertical: 5,
                        borderRadius: 20,
                      }}
                    >
                      <Text
                        style={{
                          ...fonts.sansMedium,
                          fontSize: 12,
                          letterSpacing: 0.5,
                          color: theme.primary,
                        }}
                      >
                        {globalSearchResults.himnos.length +
                          globalSearchResults.estribillos.length}{' '}
                        {language === 'es'
                          ? globalSearchResults.himnos.length +
                              globalSearchResults.estribillos.length !==
                            1
                            ? t.searchResultsCount_other || 'resultados'
                            : t.searchResultsCount_one || 'resultado'
                          : globalSearchResults.himnos.length +
                              globalSearchResults.estribillos.length !==
                            1
                          ? t.searchResultsCount_other || 'results'
                          : t.searchResultsCount_one || 'result'}
                      </Text>
                    </View>
                  </View>

                  {activeSubTab === 'estribillos' ? (
                    <>
                      {renderSearchResultSection(
                        globalSearchResults.estribillos,
                        t.sectionEstribillos || 'Estribillos',
                        'queue-music',
                        'estribillo'
                      )}
                      {renderSearchResultSection(
                        globalSearchResults.himnos,
                        t.sectionHimnos || 'Himnos',
                        'music-note',
                        'himno'
                      )}
                    </>
                  ) : (
                    <>
                      {renderSearchResultSection(
                        globalSearchResults.himnos,
                        t.sectionHimnos || 'Himnos',
                        'music-note',
                        'himno'
                      )}
                      {renderSearchResultSection(
                        globalSearchResults.estribillos,
                        t.sectionEstribillos || 'Estribillos',
                        'queue-music',
                        'estribillo'
                      )}
                    </>
                  )}
                </ScrollView>
              )}

              {globalSearchResults.himnos.length === 0 &&
                globalSearchResults.estribillos.length === 0 && (
                  <View
                    style={{ flex: 1, alignItems: 'center', paddingTop: 80, zIndex: 10 }}
                    pointerEvents="none"
                  >
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDarkMode
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(110,22,25,0.06)',
                        marginBottom: 20,
                      }}
                    >
                      {isTopFilter && topLoading ? (
                        <ActivityIndicator color={theme.primary} />
                      ) : (
                        <MaterialIcons
                          name={isTopFilter && !search.trim() ? 'favorite-border' : 'search-off'}
                          size={40}
                          color={theme.primary + '70'}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        color: theme.onSurface,
                        fontSize: 17,
                        ...fonts.sansSemiBold,
                        marginBottom: 6,
                      }}
                    >
                      {isTopFilter && !search.trim() ? t.hymnsMostLikedEmpty : t.hymnsNoResultsFound}
                    </Text>
                    <Text
                      style={{
                        color: theme.onSurfaceVariant + '99',
                        fontSize: 14,
                        ...fonts.sansRegular,
                        textAlign: 'center',
                        paddingHorizontal: 40,
                      }}
                    >
                      {isTopFilter && !search.trim()
                        ? t.hymnsMostLikedEmptySub
                        : language === 'es'
                        ? search
                          ? `No se encontraron himnos ni estribillos para "${search}"`
                          : 'Escribe un número, título o frase de la letra'
                        : search
                        ? `No hymns or choruses found for "${search}"`
                        : 'Type a hymn number, title, or lyric phrase'}
                    </Text>
                  </View>
                )}
            </View>
          </View>
        </Animated.View>

        {/* Tabs */}
        <View style={{ zIndex: 1 }}>{renderSubTabs()}</View>

        <View style={{ flex: 1, zIndex: 1 }}>
          {(activeSubTab === 'himnos' ||
            (activeSubTab === 'estribillos' && estribillosData.length > 0)) &&
            renderHimnos()}
          {activeSubTab === 'indice' && renderIndice()}
          {activeSubTab === 'estribillos' &&
            estribillosData.length === 0 &&
            renderEstribillos()}
        </View>
      </SafeAreaView>
    </TabSwipeWrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex1: { flex: 1 },
  statusBarScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },

  // ── Sub-Tabs ───────────────────────────────────────────────
  subTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.22)',
  },
  subTabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  subTabText: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '500',
    fontSize: 15.5,
    letterSpacing: -0.2,
  },
  subTabActiveText: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 16,
    right: 16,
    height: 3,
    borderRadius: 3,
  },

  // ── Himnos List ────────────────────────────────────────────
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  searchCluster: { marginBottom: 30 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontFamily: SYSTEM_FONT,
    fontWeight: '400',
    fontSize: 16,
    letterSpacing: -0.15,
  },
  chips: { gap: 8, paddingRight: 12, alignItems: 'center' },
  amazonChipWrap: {
    borderRadius: 12,
  },
  chip: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActiveSolid: {
    borderWidth: 1,
  },
  chipIosGlass: {
    borderRadius: 20,
  },
  chipAndroidNative: {
    borderWidth: 1,
    elevation: 1,
  },
  chipText: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '700',
    fontSize: 14.5,
    letterSpacing: -0.25,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 20,
  },
  listNum: {
    ...fonts.bold,
    fontSize: 24,
    width: 56,
  },
  listTitle: {
    ...fonts.regularItalic,
    fontSize: 20,
    marginBottom: 4,
    lineHeight: 26,
  },
  listTags: {
    ...fonts.sansRegular,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedBadgePill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, width: '100%' },
  quoteBlock: {
    alignItems: 'center',
    paddingVertical: 80,
    opacity: 0.3,
  },
  quoteText: {
    ...fonts.regularItalic,
    fontSize: 18,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 8,
    lineHeight: 26,
  },
  quoteAuthor: {
    ...fonts.sansRegular,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sliderContainer: {
    position: 'absolute',
    top: 58,
    right: 2,
    width: 54,
    zIndex: 100,
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  sliderTrackLine: {
    position: 'absolute',
    width: 6,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  sliderActiveLine: {
    position: 'absolute',
    width: 6,
    top: 0,
    borderRadius: 3,
  },
  sliderPositionGlassPill: {
    marginTop: 8,
    minWidth: 50,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sliderPositionAndroidPill: {
    marginTop: 8,
    minWidth: 50,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    elevation: 2,
  },
  sliderPositionPillText: {
    ...fonts.sansBold,
    fontSize: 10,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // ── Índice & Glass A-Z Scroller (Workstream F) ─────────────
  indiceToggleWrap: {
    paddingTop: 8,
    paddingBottom: 6,
  },
  indiceTogglePill: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: 'center',
  },
  indiceToggleBtnWrap: {
    borderRadius: 999,
  },
  indiceToggleOption: {
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  indiceToggleText: {
    fontFamily: SYSTEM_FONT,
    fontWeight: '700',
    fontSize: 14.5,
    letterSpacing: -0.25,
  },
  indiceBody: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 0,
  },
  indiceListContainer: {
    flex: 1,
  },
  indiceMainHeader: {
    ...fonts.bold,
    fontSize: 22,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
    paddingLeft: 24,
    paddingRight: 10,
    letterSpacing: 1,
  },
  indiceLetterHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingLeft: 24,
    paddingRight: 10,
    marginTop: 8,
  },
  indiceLetterText: {
    ...fonts.bold,
    fontSize: 18,
    letterSpacing: 1.5,
  },
  indiceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 24,
    paddingRight: 10,
  },
  indiceItemTitle: {
    ...fonts.regular,
    fontSize: 19,
    maxWidth: '72%',
  },
  indiceDotsWrapper: {
    flex: 1,
    height: 1,
    marginHorizontal: 10,
    marginTop: 5,
    overflow: 'hidden',
  },
  indiceDots: {
    ...fonts.regular,
    fontSize: 16,
    letterSpacing: 2,
  },
  indiceItemNumber: {
    ...fonts.bold,
    fontSize: 19,
    fontVariant: ['tabular-nums'],
  },
  alphabetSidebarWrapper: {
    paddingRight: 6,
    paddingLeft: 2,
    justifyContent: 'center',
  },
  alphabetGlassCapsule: {
    width: 28,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  alphabetSidebar: {
    flex: 1,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  alphabetTouch: {
    flex: 1,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alphabetText: {
    ...fonts.sansBold,
    fontSize: 11,
    lineHeight: 14,
    includeFontPadding: false,
  },

  // ── Empty State (Estribillos) ─────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: -80,
  },
  emptyTitle: {
    ...fonts.bold,
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySub: {
    ...fonts.sansRegular,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },

  // ── Dragging Bubble ───────────────────────────────────────
  draggingBubbleContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draggingGlassBubble: {
    width: 82,
    height: 82,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  draggingBubble: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  draggingBubbleText: {
    ...fonts.bold,
    fontSize: 36,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 40,
  },
});
