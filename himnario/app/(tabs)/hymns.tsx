/**
 * HymnListScreen component — Provides a searchable and filterable list of all hymns.
 *
 * Responsibility:
 * - Displays the full collection of hymns, choruses, and alphabetical index.
 * - Implements the smart search engine (typo-tolerant, accent-insensitive, number/prefix-aware, lyric snippets, highlighted matches).
 * - Provides category chips and "Con audio" filter chip.
 * - Shows saved-offline and audio availability indicators.
 * - Implements a Liquid Glass / Material 3 A–Z fast scroller and hymn number scroller.
 *
 * @returns {React.JSX.Element} The rendered Hymn List screen.
 */
import React, { useState, useMemo, useRef, useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
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
import { fonts } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { useHymnFilter } from '../../context/HymnFilterContext';
import { hasHymnAudio } from '../../data/audioRegistry';
import { offlineAudio } from '../../audio/offline-audio';
import GlassSurface from '../../components/GlassSurface';
import {
  create as createSearchEngine,
  normalize as normalizeSearch,
  segmentTextByRanges,
  type SearchField,
  type SearchResult,
} from '../../utils/search-engine';

const ALPHABET = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

const himnosSearchEngine = createSearchEngine(hymnsData as any[]);
const estribillosSearchEngine = createSearchEngine(estribillosData as any[]);

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
              fontFamily: fonts.boldItalic,
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
  const { theme, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const { search, setSearch, searchFilter, setSearchFilter, activeSubTab, setActiveSubTab } =
    useHymnFilter();
  const offline = useSyncExternalStore(offlineAudio.subscribe, offlineAudio.getSnapshot);

  const params = useLocalSearchParams<{ tab?: string; t?: string; focusSearch?: string }>();

  const [draggingLetter, setDraggingLetter] = useState<string | null>(null);
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [onlyWithAudio, setOnlyWithAudio] = useState(false);

  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flatListRef = useRef<any>(null);
  const indiceListRef = useRef<any>(null);
  const searchRef = useRef<TextInput>(null);
  const chipsScrollRef = useRef<ScrollView>(null);
  const overlayChipsScrollRef = useRef<ScrollView>(null);
  const sliderTrackRef = useRef<View>(null);
  const sidebarTrackRef = useRef<View>(null);
  const { currentHymnId } = useNowPlaying();
  const [isFocused, setIsFocused] = useState(false);
  const blurAnim = useRef(new Animated.Value(0)).current;
  const isSearchActive =
    isFocused ||
    search.length > 0 ||
    onlyWithAudio ||
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
    const allLabel = language === 'es' ? 'Todos' : 'All';

    if (searchFilter !== 'Todos' && searchFilter !== 'All' && sorted.includes(searchFilter)) {
      const filteredSorted = sorted.filter((tag) => tag !== searchFilter);
      return [allLabel, searchFilter, ...filteredSorted];
    }

    return [allLabel, ...sorted];
  }, [activeSubTab, language, searchFilter]);

  // ── Vertical scroll-position slider state ──────────────────────────────
  const [scrollFraction, setScrollFraction] = useState(0);
  const [sliderVisible, setSliderVisible] = useState(false);
  const sliderTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sliderTrackHeight, setSliderTrackHeight] = useState(0);
  const isDragging = useRef(false);
  const sliderTrackY = useRef(0);
  const lastSliderHymnNum = useRef<number | null>(null);

  const handleScroll = useCallback((event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const maxY = contentHeight.current - scrollViewHeight.current;
    if (maxY > 0) {
      setScrollFraction(Math.min(1, Math.max(0, currentOffset / maxY)));
    }

    setSliderVisible(true);
    if (sliderTimeout.current) clearTimeout(sliderTimeout.current);
    if (!isDragging.current) {
      sliderTimeout.current = setTimeout(() => setSliderVisible(false), 2000);
    }
  }, []);

  const filtered = useMemo(() => {
    return activeSubTab === 'estribillos' ? estribillosData : hymnsData;
  }, [activeSubTab]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          isDragging.current = true;
          setSliderVisible(true);
          if (sliderTimeout.current) clearTimeout(sliderTimeout.current);
          if (sliderTrackHeight <= 0) return;
          const touchY = evt.nativeEvent.pageY - sliderTrackY.current;
          const fraction = Math.min(1, Math.max(0, touchY / sliderTrackHeight));
          setScrollFraction(fraction);
          const maxY = contentHeight.current - scrollViewHeight.current;
          if (maxY > 0) {
            flatListRef.current?.scrollToOffset({ offset: fraction * maxY, animated: false });
          }
        },
        onPanResponderMove: (evt) => {
          if (sliderTrackHeight <= 0) return;
          const touchY = evt.nativeEvent.pageY - sliderTrackY.current;
          const fraction = Math.min(1, Math.max(0, touchY / sliderTrackHeight));
          setScrollFraction(fraction);
          const idx = Math.max(
            0,
            Math.min(filtered.length - 1, Math.round(fraction * (filtered.length - 1)))
          );
          const num = Number(filtered[idx]?.number ?? 1);
          if (lastSliderHymnNum.current !== num) {
            lastSliderHymnNum.current = num;
            Haptics.selectionAsync().catch(() => {});
          }
          const maxY = contentHeight.current - scrollViewHeight.current;
          if (maxY > 0) {
            flatListRef.current?.scrollToOffset({ offset: fraction * maxY, animated: false });
          }
        },
        onPanResponderRelease: () => {
          isDragging.current = false;
          lastSliderHymnNum.current = null;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          if (sliderTimeout.current) clearTimeout(sliderTimeout.current);
          sliderTimeout.current = setTimeout(() => setSliderVisible(false), 2000);
        },
      }),
    [filtered, sliderTrackHeight]
  );

  const onSliderTrackLayout = useCallback((e: LayoutChangeEvent) => {
    setSliderTrackHeight(e.nativeEvent.layout.height);
    setTimeout(() => {
      sliderTrackRef.current?.measure((_x, _y, _width, _height, _pageX, pageY) => {
        if (pageY !== undefined) sliderTrackY.current = pageY;
      });
    }, 100);
  }, []);

  const handleFilterChange = (f: string) => {
    const isAll = f === 'Todos' || f === 'All';
    const activeIsAll = searchFilter === 'Todos' || searchFilter === 'All';
    const active = f === searchFilter || (isAll && activeIsAll);
    const defaultAll = language === 'es' ? 'Todos' : 'All';
    setSearchFilter(active && !isAll ? defaultAll : f);
    chipsScrollRef.current?.scrollTo({ x: 0, animated: true });
    overlayChipsScrollRef.current?.scrollTo({ x: 0, animated: true });
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
  };

  const globalSearchResults = useMemo(() => {
    const isAll = searchFilter === 'Todos' || searchFilter === 'All';
    if (!search.trim() && isAll && !onlyWithAudio) {
      return {
        himnos: [] as SearchResult<any>[],
        estribillos: [] as SearchResult<any>[],
      };
    }

    const matchesFilters = (h: any) => {
      if (onlyWithAudio && !hasHymnAudio(String(h.id))) {
        return false;
      }
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
    const himnosHits = rawQuery
      ? himnosSearchEngine(rawQuery, { field: searchField })
      : hymnsData.map((h) => ({ hymn: h, score: 0, kind: '', snippet: '' }));
    const estribillosHits = rawQuery
      ? estribillosSearchEngine(rawQuery, { field: searchField })
      : estribillosData.map((h) => ({ hymn: h, score: 0, kind: '', snippet: '' }));

    return {
      himnos: himnosHits.filter((r) => matchesFilters(r.hymn)),
      estribillos: estribillosHits.filter((r) => matchesFilters(r.hymn)),
    };
  }, [search, searchFilter, searchField, onlyWithAudio, language]);

  // ── Índice Logic ─────────────────────────────────────────────
  const indiceData = useMemo(() => {
    const sortedHimnos = [...hymnsData].sort((a, b) =>
      normalizeSearch(a.title).localeCompare(normalizeSearch(b.title))
    );
    const sortedEstribillos = [...estribillosData].sort((a, b) =>
      normalizeSearch(a.title).localeCompare(normalizeSearch(b.title))
    );

    const grouped: any[] = [];

    grouped.push({
      type: 'main_header',
      title: t.indiceEstribillosTitle || 'ÍNDICE ALFABÉTICO DE ESTRIBILLOS Y CORITOS',
    });
    let currentLetter = '';
    sortedEstribillos.forEach((hymn) => {
      const letter = normalizeSearch(hymn.title).charAt(0).toUpperCase();
      const displayLetter = letter.match(/[A-Z]/) ? letter : letter || 'A';

      if (displayLetter !== currentLetter) {
        currentLetter = displayLetter;
        grouped.push({ type: 'header', letter: currentLetter, section: 'estribillos' });
      }
      grouped.push({ type: 'item', hymn });
    });

    grouped.push({
      type: 'main_header',
      title: t.indiceHimnosTitle || 'ÍNDICE ALFABÉTICO DE HIMNOS',
      marginTop: 24,
    });
    currentLetter = '';
    sortedHimnos.forEach((hymn) => {
      const letter = normalizeSearch(hymn.title).charAt(0).toUpperCase();
      const displayLetter = letter.match(/[A-Z]/) ? letter : letter || 'A';

      if (displayLetter !== currentLetter) {
        currentLetter = displayLetter;
        grouped.push({ type: 'header', letter: currentLetter, section: 'himnos' });
      }
      grouped.push({ type: 'item', hymn });
    });

    return grouped;
  }, [t]);

  const letterIndices = useMemo(() => {
    const indices: Record<string, number> = {};
    indices['#'] = 0;
    indiceData.forEach((item, index) => {
      if (item.type === 'header' && item.section === 'himnos' && !(item.letter in indices)) {
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
      const relativeY = pageY - sidebarTrackY.current;
      const fraction = Math.max(0, Math.min(1, relativeY / sidebarTrackHeight.current));
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
          indiceListRef.current.scrollToIndex({ index: targetIndex, animated: false });
        }
        setDraggingLetter(targetLetter);
        if (bubbleFadeTimer.current) {
          clearTimeout(bubbleFadeTimer.current);
          bubbleFadeTimer.current = null;
        }
        bubbleOpacity.setValue(1);
      }
    },
    [bubbleOpacity, letterIndices]
  );

  const alphabetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => handleSidebarDrag(evt.nativeEvent.pageY),
        onPanResponderMove: (evt) => handleSidebarDrag(evt.nativeEvent.pageY),
        onPanResponderRelease: () => {
          lastScrolledLetter.current = null;
          if (bubbleFadeTimer.current) clearTimeout(bubbleFadeTimer.current);
          bubbleFadeTimer.current = setTimeout(() => {
            Animated.timing(bubbleOpacity, {
              toValue: 0,
              duration: 280,
              useNativeDriver: true,
            }).start(({ finished }) => {
              if (finished) setDraggingLetter(null);
            });
          }, 180);
        },
      }),
    [bubbleOpacity, handleSidebarDrag]
  );

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

  const renderSubTabs = () => (
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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSubTab(tab.key as any);
              setSearchFilter('Todos');
              chipsScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
              if (flatListRef.current) {
                flatListRef.current.scrollToOffset({ offset: 0, animated: false });
              }
              if (indiceListRef.current) {
                indiceListRef.current.scrollToOffset({ offset: 0, animated: false });
              }
            }}
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

  const renderHimnos = () => {
    const totalHymns = filtered.length;
    const currentIndex = Math.max(
      0,
      Math.min(totalHymns - 1, Math.round(scrollFraction * (totalHymns - 1)))
    );
    const currentHymnNumber = filtered[currentIndex]?.number ?? 1;
    const lastHymnNumber = filtered[totalHymns - 1]?.number ?? totalHymns;

    return (
      <View style={styles.flex1}>
        <FlashList
          ref={flatListRef}
          data={filtered}
          extraData={`${language}-${offline.saved}`}
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
          drawDistance={5000}
          ListHeaderComponent={
            <View style={[styles.searchCluster, { marginTop: 0 }]}>
              <ScrollView
                ref={chipsScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setOnlyWithAudio((v) => !v);
                  }}
                  style={[
                    styles.chip,
                    styles.audioChip,
                    {
                      backgroundColor: onlyWithAudio
                        ? theme.primary
                        : theme.surfaceVariants.containerHighest,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="volume-up"
                    size={15}
                    color={onlyWithAudio ? theme.onPrimary : theme.primary}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      { color: onlyWithAudio ? theme.onPrimary : theme.onSurface },
                    ]}
                  >
                    {t.filterWithAudio}
                  </Text>
                </TouchableOpacity>

                {currentFilters.map((f) => {
                  const isAll = f === 'Todos' || f === 'All';
                  const activeIsAll = searchFilter === 'Todos' || searchFilter === 'All';
                  const active = f === searchFilter || (isAll && activeIsAll);
                  const displayLabel = isAll ? t.filterAll : translateCategory(f, language);
                  return (
                    <TouchableOpacity
                      key={f}
                      onPress={() => handleFilterChange(f)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active
                            ? theme.primary
                            : theme.surfaceVariants.containerHighest,
                        },
                        isAll &&
                          !active && {
                            borderWidth: 1,
                            borderColor: theme.primary + '44',
                            backgroundColor: 'transparent',
                          },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? theme.onPrimary : theme.onSurface },
                        ]}
                      >
                        {displayLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          }
          renderItem={({ item: hymn }) => (
            <View key={hymn.id}>
              <TouchableOpacity
                style={styles.listItem}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/hymn/${hymn.id}`);
                }}
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
              </TouchableOpacity>
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
              language === 'es' ? 'Deslizador numérico de himnos' : 'Hymn number scroller'
            }
            accessibilityValue={{ text: `${currentHymnNumber} / ${lastHymnNumber}` }}
            style={[
              styles.sliderContainer,
              {
                bottom:
                  insets.bottom +
                  (currentHymnId ? 152 : 82) +
                  (Platform.OS === 'android' ? 50 : 0),
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
                  {currentHymnNumber}/{lastHymnNumber}
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
                  {currentHymnNumber}/{lastHymnNumber}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderIndice = () => {
    return (
      <View style={styles.flex1}>
        <View style={styles.indiceBody}>
          <View style={styles.indiceListContainer}>
            <FlashList
              ref={indiceListRef}
              data={indiceData}
              extraData={`${language}-${offline.saved}`}
              keyExtractor={(item, index) =>
                item.type +
                '_' +
                (item.section || 'none') +
                '_' +
                (item.letter || item.hymn?.id || index)
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              // @ts-ignore
              estimatedItemSize={40}
              drawDistance={1500}
              renderItem={({ item }) => {
                if (item.type === 'main_header') {
                  return (
                    <Text
                      style={[
                        styles.indiceMainHeader,
                        { color: theme.onSurface, marginTop: item.marginTop || 0 },
                      ]}
                    >
                      {item.title}
                    </Text>
                  );
                }
                if (item.type === 'header') {
                  return (
                    <View style={styles.indiceLetterHeader}>
                      <Text
                        style={[styles.indiceLetterText, { color: theme.onSurfaceVariant }]}
                      >
                        --{item.letter}--
                      </Text>
                    </View>
                  );
                }
                const isSaved = offline.savedIds.has(String(item.hymn.id));
                return (
                  <TouchableOpacity
                    style={styles.indiceItemRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/hymn/${item.hymn.id}`);
                    }}
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
                        size={13}
                        color={theme.primary}
                        style={{ marginLeft: 5 }}
                      />
                    )}
                    <View style={styles.indiceDotsWrapper}>
                      <Text
                        style={[styles.indiceDots, { color: theme.outlineVariant }]}
                        numberOfLines={1}
                        ellipsizeMode="clip"
                      >
                        {'.'.repeat(1000)}
                      </Text>
                    </View>
                    <Text style={[styles.indiceItemNumber, { color: theme.onSurface }]}>
                      {item.hymn.number}
                    </Text>
                  </TouchableOpacity>
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
              ListHeaderComponent={<View style={{ height: 16 }} />}
            />
          </View>

          {/* Workstream F: Floating Glass / M3 Alphabet Sidebar */}
          {!isSearchActive && (
            <View
              style={[
                styles.alphabetSidebarWrapper,
                {
                  marginBottom: insets.bottom + (currentHymnId ? 136 : 74),
                },
              ]}
            >
              <GlassSurface
                isInteractive
                intensity={65}
                tonalColor={theme.surfaceVariants.containerHighest}
                style={[
                  styles.alphabetGlassCapsule,
                  {
                    borderColor: isDarkMode
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(110,22,25,0.14)',
                  },
                ]}
              >
                <View
                  ref={sidebarTrackRef}
                  accessible
                  accessibilityRole="adjustable"
                  accessibilityLabel={
                    language === 'es' ? 'Índice alfabético' : 'Alphabetical index'
                  }
                  accessibilityValue={{ text: draggingLetter || '' }}
                  style={styles.alphabetSidebar}
                  onLayout={(e) => {
                    sidebarTrackHeight.current = e.nativeEvent.layout.height;
                    setTimeout(() => {
                      sidebarTrackRef.current?.measure(
                        (_x, _y, _width, _height, _pageX, pageY) => {
                          if (pageY !== undefined) sidebarTrackY.current = pageY;
                        }
                      );
                    }, 100);
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
                          adjustsFontSizeToFit
                          numberOfLines={1}
                          minimumFontScale={0.5}
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
                intensity={80}
                style={[
                  styles.draggingGlassBubble,
                  {
                    borderColor: isDarkMode
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(110,22,25,0.2)',
                  },
                ]}
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
              fontFamily: 'PublicSans_700Bold',
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
            <TouchableOpacity
              key={`${keyPrefix}-${hymn.id}`}
              activeOpacity={0.6}
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
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Keyboard.dismiss();
                searchRef.current?.blur();
                router.push(`/hymn/${hymn.id}`);
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
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
                    fontFamily: fonts.regularItalic,
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
                      fontFamily: 'PublicSans_400Regular',
                      fontSize: 12,
                      color: theme.onSurfaceVariant,
                      lineHeight: 17,
                      marginTop: 3,
                    }}
                  />
                ) : hymn.categories ? (
                  <Text
                    style={{
                      fontFamily: 'PublicSans_400Regular',
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
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
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
            paddingTop: insets.top,
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
                  setOnlyWithAudio(false);
                  setSearchField('all');
                  const defaultAll = language === 'es' ? 'Todos' : 'All';
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
            { zIndex: 5, opacity: blurAnim, top: insets.top + 60 },
          ]}
          pointerEvents={isSearchActive ? 'auto' : 'none'}
        >
          <View style={{ flex: 1 }}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                Keyboard.dismiss();
                handleSearchChange('');
                setOnlyWithAudio(false);
                setSearchField('all');
                const defaultAll = language === 'es' ? 'Todos' : 'All';
                setSearchFilter(defaultAll);
                searchRef.current?.blur();
              }}
            >
              <BlurView
                intensity={Platform.OS === 'ios' ? 45 : 100}
                tint={isDarkMode ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            </Pressable>

            <View style={{ flex: 1, zIndex: 10 }}>
              {/* Search Field Scopes + Con Audio + Category Chips inside Search View */}
              <View style={{ paddingTop: 8, paddingBottom: 6, gap: 8 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.chips, { paddingHorizontal: 16 }]}
                  keyboardShouldPersistTaps="handled"
                >
                  {(
                    [
                      { key: 'all', label: language === 'es' ? 'Todo' : 'All' },
                      { key: 'title', label: language === 'es' ? 'Título' : 'Title' },
                      { key: 'lyrics', label: language === 'es' ? 'Letra' : 'Lyrics' },
                      { key: 'number', label: '#' },
                    ] as const
                  ).map((scope) => {
                    const active = searchField === scope.key;
                    return (
                      <TouchableOpacity
                        key={scope.key}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setSearchField(scope.key);
                        }}
                        style={[
                          styles.scopeChip,
                          {
                            backgroundColor: active
                              ? theme.primary
                              : isDarkMode
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(110,22,25,0.08)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.scopeChipText,
                            { color: active ? theme.onPrimary : theme.primary },
                          ]}
                        >
                          {scope.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setOnlyWithAudio((v) => !v);
                    }}
                    style={[
                      styles.scopeChip,
                      styles.audioChip,
                      {
                        backgroundColor: onlyWithAudio
                          ? theme.primary
                          : isDarkMode
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(110,22,25,0.08)',
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="volume-up"
                      size={14}
                      color={onlyWithAudio ? theme.onPrimary : theme.primary}
                    />
                    <Text
                      style={[
                        styles.scopeChipText,
                        { color: onlyWithAudio ? theme.onPrimary : theme.primary },
                      ]}
                    >
                      {t.filterWithAudio}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

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
                    const displayLabel = isAll ? t.filterAll : translateCategory(f, language);
                    return (
                      <TouchableOpacity
                        key={`overlay-chip-${f}`}
                        onPress={() => handleFilterChange(f)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active
                              ? theme.primary
                              : theme.surfaceVariants.containerHighest,
                          },
                          isAll &&
                            !active && {
                              borderWidth: 1,
                              borderColor: theme.primary + '44',
                              backgroundColor: 'transparent',
                            },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: active ? theme.onPrimary : theme.onSurface },
                          ]}
                        >
                          {displayLabel}
                        </Text>
                      </TouchableOpacity>
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
                          fontFamily: 'PublicSans_500Medium',
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
                        t.sectionEstribillos || 'Estribillos y Coritos',
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
                        t.sectionEstribillos || 'Estribillos y Coritos',
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
                      <MaterialIcons name="search-off" size={40} color={theme.primary + '70'} />
                    </View>
                    <Text
                      style={{
                        color: theme.onSurface,
                        fontSize: 17,
                        fontFamily: 'PublicSans_600SemiBold',
                        marginBottom: 6,
                      }}
                    >
                      {language === 'es' ? 'Sin resultados' : 'No results found'}
                    </Text>
                    <Text
                      style={{
                        color: theme.onSurfaceVariant + '99',
                        fontSize: 14,
                        fontFamily: 'PublicSans_400Regular',
                        textAlign: 'center',
                        paddingHorizontal: 40,
                      }}
                    >
                      {language === 'es'
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
    </View>
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
    borderColor: '#0000001A',
  },
  subTabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  subTabText: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 15,
  },
  subTabActiveText: {
    fontFamily: 'PublicSans_700Bold',
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
    fontFamily: 'PublicSans_400Regular',
    fontSize: 16,
  },
  chips: { gap: 10, paddingRight: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
  },
  audioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipText: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 14,
  },
  scopeChip: {
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 999,
  },
  scopeChipText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 20,
  },
  listNum: {
    fontFamily: fonts.bold,
    fontSize: 24,
    width: 56,
  },
  listTitle: {
    fontFamily: fonts.regularItalic,
    fontSize: 20,
    marginBottom: 4,
    lineHeight: 26,
  },
  listTags: {
    fontFamily: 'PublicSans_400Regular',
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
    fontFamily: fonts.regularItalic,
    fontSize: 18,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 8,
    lineHeight: 26,
  },
  quoteAuthor: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sliderContainer: {
    position: 'absolute',
    top: 130,
    right: 6,
    width: 68,
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
    marginTop: 10,
    minWidth: 58,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sliderPositionAndroidPill: {
    marginTop: 10,
    minWidth: 58,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    elevation: 2,
  },
  sliderPositionPillText: {
    fontFamily: 'PublicSans_700Bold',
    fontSize: 10,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // ── Índice & Glass A-Z Scroller (Workstream F) ─────────────
  indiceBody: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 16,
  },
  indiceListContainer: {
    flex: 1,
    paddingLeft: 24,
    paddingRight: 8,
  },
  indiceMainHeader: {
    fontFamily: fonts.bold,
    fontSize: 22,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
    letterSpacing: 1,
  },
  indiceLetterHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  indiceLetterText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: 2,
  },
  indiceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  indiceItemTitle: {
    fontFamily: fonts.regular,
    fontSize: 18,
    maxWidth: '72%',
  },
  indiceDotsWrapper: {
    flex: 1,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  indiceDots: {
    fontFamily: fonts.regular,
    fontSize: 16,
    letterSpacing: 2,
  },
  indiceItemNumber: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  alphabetSidebarWrapper: {
    paddingRight: 6,
    paddingLeft: 2,
    justifyContent: 'center',
  },
  alphabetGlassCapsule: {
    flex: 1,
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
    fontFamily: 'PublicSans_700Bold',
    fontSize: 10.5,
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
    fontFamily: fonts.bold,
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: 'PublicSans_400Regular',
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
    fontFamily: fonts.bold,
    fontSize: 36,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 40,
  },
});
