/**
 * HymnListScreen component — Provides a searchable and filterable list of all hymns.
 *
 * Responsibility:
 * - Displays the full collection of hymns.
 * - Implements a search bar for filtering by title or number.
 * - Provides category chips for filtering by hymn genre (Adoración, Evangelismo, etc.).
 * - Integrates audio playback for hymns that have a valid audio URL.
 * - Displays a decorative quote at the bottom of the list.
 *
 * @returns {React.JSX.Element} The rendered Hymn List screen.
 */
import React, { useState, useMemo, useRef, useCallback } from 'react';
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
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { hymnsData, estribillosData } from '../../data/alabanzasPaginas';
import { fonts } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNowPlaying } from '../../context/NowPlayingContext';
import { hasHymnAudio } from '../../data/audioRegistry';

const hasAudio = (hymn: any) => hasHymnAudio(String(hymn.id));

const normalizeString = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¡!¿?,.;:'"()\-]/g, "").toLowerCase().trim();



const ALPHABET = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export default function HymnListScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [activeSubTab, setActiveSubTab] = useState<'himnos' | 'estribillos' | 'indice'>('himnos');
  const params = useLocalSearchParams<{ tab?: string; t?: string }>();

  React.useEffect(() => {
    if (params?.tab === 'himnos') {
      setActiveSubTab('himnos');
    }
  }, [params?.tab, params?.t]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [draggingLetter, setDraggingLetter] = useState<string | null>(null);
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flatListRef = useRef<any>(null);
  const indiceListRef = useRef<any>(null);
  const searchRef = useRef<TextInput>(null);
  const chipsScrollRef = useRef<ScrollView>(null);
  const sliderTrackRef = useRef<View>(null);
  const sidebarTrackRef = useRef<View>(null);
  const { openPlayer, currentHymnId } = useNowPlaying();
  const [isFocused, setIsFocused] = useState(false);
  const contentHeight = useRef(0);
  const scrollViewHeight = useRef(0);

  // Dynamically derive filter chips based on active tab
  const currentFilters = useMemo(() => {
    const dataSource = activeSubTab === 'estribillos' ? estribillosData : hymnsData;
    const tags = new Set<string>();
    dataSource.forEach((h) => {
      if (h.categories) {
        h.categories.split('•').map((t: string) => t.trim()).filter(Boolean).forEach((tag: string) => {
          tags.add(tag);
        });
      }
    });
    return ['Todos', ...Array.from(tags).sort((a, b) => a.localeCompare(b))];
  }, [activeSubTab, hymnsData, estribillosData]);

  // ── Vertical scroll-position slider state ──────────────────────────────
  const [scrollFraction, setScrollFraction] = useState(0);
  const [sliderVisible, setSliderVisible] = useState(false);
  const sliderTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sliderTrackHeight, setSliderTrackHeight] = useState(0);
  const isDragging = useRef(false);
  const sliderTrackY = useRef(0); // absolute Y of track on screen

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

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isDragging.current = true;
        setSliderVisible(true);
        if (sliderTimeout.current) clearTimeout(sliderTimeout.current);
        const touchY = evt.nativeEvent.pageY - sliderTrackY.current;
        const fraction = Math.min(1, Math.max(0, touchY / sliderTrackHeight));
        setScrollFraction(fraction);
        const maxY = contentHeight.current - scrollViewHeight.current;
        if (maxY > 0) {
          flatListRef.current?.scrollToOffset({ offset: fraction * maxY, animated: false });
        }
      },
      onPanResponderMove: (evt) => {
        const touchY = evt.nativeEvent.pageY - sliderTrackY.current;
        const fraction = Math.min(1, Math.max(0, touchY / sliderTrackHeight));
        setScrollFraction(fraction);
        const maxY = contentHeight.current - scrollViewHeight.current;
        if (maxY > 0) {
          flatListRef.current?.scrollToOffset({ offset: fraction * maxY, animated: false });
        }
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (sliderTimeout.current) clearTimeout(sliderTimeout.current);
        sliderTimeout.current = setTimeout(() => setSliderVisible(false), 2000);
      },
    }),
    [sliderTrackHeight]);

  const onSliderTrackLayout = useCallback((e: LayoutChangeEvent) => {
    setSliderTrackHeight(e.nativeEvent.layout.height);
    setTimeout(() => {
      sliderTrackRef.current?.measure((x, y, width, height, pageX, pageY) => {
        if (pageY !== undefined) sliderTrackY.current = pageY;
      });
    }, 100);
  }, []);

  const filtered = useMemo(() => {
    const dataSource = activeSubTab === 'estribillos' ? estribillosData : hymnsData;
    return dataSource.filter((h) => {
      const matchFilter =
        activeFilter === 'Todos' ||
        activeFilter === 'All' ||
        (h.categories && h.categories.split('•').map((t: string) => t.trim()).includes(activeFilter));

      const q = normalizeString(search);
      const matchSearch =
        !q ||
        normalizeString(h.title).includes(q) ||
        String(h.number).includes(q);

      return matchFilter && matchSearch;
    });
  }, [search, activeFilter, activeSubTab, hymnsData, estribillosData]);

  const handleFilterChange = (f: string) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
    const active = f === activeFilter;
    setActiveFilter(active && f !== 'Todos' ? 'Todos' : f);
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
    // Delay scroll to allow FlashList to update its internal data layout first
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
      if (indiceListRef.current) {
        indiceListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    }, 100);
  };

  // ── Índice Logic ─────────────────────────────────────────────
  const indiceData = useMemo(() => {
    const sortedHimnos = [...hymnsData].sort((a, b) => normalizeString(a.title).localeCompare(normalizeString(b.title)));
    const sortedEstribillos = [...estribillosData].sort((a, b) => normalizeString(a.title).localeCompare(normalizeString(b.title)));
    
    const grouped: any[] = [];
    
    // Header item (Título ÍNDICE ESTRIBILLOS)
    grouped.push({ type: 'main_header', title: 'ÍNDICE ALFABÉTICO DE ESTRIBILLOS Y CORITOS' });
    let currentLetter = '';
    sortedEstribillos.forEach(hymn => {
      const q = normalizeString(search);
      if (q && !normalizeString(hymn.title).includes(q) && !String(hymn.number).includes(q)) return;

      const letter = normalizeString(hymn.title).charAt(0).toUpperCase();
      const displayLetter = letter.match(/[A-Z]/) ? letter : (letter || 'A');

      if (displayLetter !== currentLetter) {
        currentLetter = displayLetter;
        grouped.push({ type: 'header', letter: currentLetter, section: 'estribillos' });
      }
      grouped.push({ type: 'item', hymn });
    });

    // Header item (Título ÍNDICE HIMNOS)
    grouped.push({ type: 'main_header', title: 'ÍNDICE ALFABÉTICO DE HIMNOS', marginTop: 24 });
    currentLetter = '';
    sortedHimnos.forEach(hymn => {
      const q = normalizeString(search);
      if (q && !normalizeString(hymn.title).includes(q) && !String(hymn.number).includes(q)) return;

      const letter = normalizeString(hymn.title).charAt(0).toUpperCase();
      const displayLetter = letter.match(/[A-Z]/) ? letter : (letter || 'A');

      if (displayLetter !== currentLetter) {
        currentLetter = displayLetter;
        grouped.push({ type: 'header', letter: currentLetter, section: 'himnos' });
      }
      grouped.push({ type: 'item', hymn });
    });

    return grouped;
  }, [search, hymnsData, estribillosData]);

  const letterIndices = useMemo(() => {
    const indices: Record<string, number> = {};
    indices['#'] = 0; // '#' scrolls to the very top (Estribillos y Coritos section)
    indiceData.forEach((item, index) => {
      if (item.type === 'header' && item.section === 'himnos' && !(item.letter in indices)) {
        indices[item.letter] = index;
      }
    });
    return indices;
  }, [indiceData]);

  const scrollToLetter = (letter: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const index = letterIndices[letter];
    if (index !== undefined && indiceListRef.current) {
      indiceListRef.current.scrollToIndex({ index, animated: false });
    }
  };

  // ── Alphabet Sidebar Drag Logic ──────────────────────────────
  const sidebarTrackY = useRef(0);
  const sidebarTrackHeight = useRef(0);
  const lastScrolledLetter = useRef<string | null>(null);

  const handleSidebarDrag = (pageY: number) => {
    if (sidebarTrackHeight.current === 0) return;
    const relativeY = pageY - sidebarTrackY.current;
    const fraction = Math.max(0, Math.min(1, relativeY / sidebarTrackHeight.current));
    const index = Math.min(ALPHABET.length - 1, Math.floor(fraction * ALPHABET.length));
    const letter = ALPHABET[index];

    if (letter !== lastScrolledLetter.current) {
      lastScrolledLetter.current = letter;
      // Find the closest available letter if this one is empty
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        indiceListRef.current.scrollToIndex({ index: targetIndex, animated: false });
      }
      setDraggingLetter(targetLetter);
      // Cancel any pending fade-out and snap to full opacity while dragging
      if (bubbleFadeTimer.current) { clearTimeout(bubbleFadeTimer.current); bubbleFadeTimer.current = null; }
      bubbleOpacity.setValue(1);
    }
  };

  const alphabetPanResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleSidebarDrag(evt.nativeEvent.pageY),
      onPanResponderMove: (evt) => handleSidebarDrag(evt.nativeEvent.pageY),
      onPanResponderRelease: () => {
        lastScrolledLetter.current = null;
        // Keep the bubble visible briefly, then fade out
        if (bubbleFadeTimer.current) clearTimeout(bubbleFadeTimer.current);
        bubbleFadeTimer.current = setTimeout(() => {
          Animated.timing(bubbleOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (finished) setDraggingLetter(null);
          });
        }, 200);
      },
    }),
    [letterIndices]);

  // ── Render Sections ──────────────────────────────────────────

  const renderSubTabs = () => (
    <View style={styles.subTabBar}>
      {[
        { key: 'himnos', label: t.subTabHimnos || 'Himnos' },
        { key: 'estribillos', label: t.subTabEstribillos || 'Estribillos' },
        { key: 'indice', label: t.subTabIndice || 'Índice' }
      ].map(tab => {
        const isActive = activeSubTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSubTab(tab.key as any);
              setSearch('');
              setActiveFilter('Todos');
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
            <Text style={[
              styles.subTabText,
              isActive && styles.subTabActiveText,
              { color: isActive ? theme.primary : theme.onSurfaceVariant }
            ]}>
              {tab.label}
            </Text>
            {isActive && <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderHimnos = () => {
    const totalHymns = filtered.length;
    const currentIndex = Math.max(0, Math.min(totalHymns - 1, Math.round(scrollFraction * (totalHymns - 1))));
    const currentHymnNumber = filtered[currentIndex]?.number ?? 1;
    const lastHymnNumber = filtered[totalHymns - 1]?.number ?? totalHymns;

    return (
      <View style={styles.flex1}>
        <FlashList
          ref={flatListRef}
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.scroll, { paddingRight: 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          scrollEventThrottle={16}
          drawDistance={1500}
          // @ts-ignore
          estimatedItemSize={93}
          onScroll={handleScroll}
          onContentSizeChange={(_w, h) => { contentHeight.current = h; }}
          onLayout={(e) => { scrollViewHeight.current = e.nativeEvent.layout.height; }}
          ListHeaderComponent={
            <View style={styles.searchCluster}>
              <View style={[styles.searchRow, { backgroundColor: theme.surfaceVariants.containerLow }]}>
                <TouchableOpacity onPress={() => searchRef.current?.focus()} activeOpacity={0.4} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialIcons name="search" size={28} color={theme.outline} style={{ marginRight: 8 }} />
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
                {(isFocused || search.length > 0) && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleSearchChange('');
                      searchRef.current?.blur();
                    }}
                    style={{ padding: 4 }}
                  >
                    <MaterialIcons name="cancel" size={22} color={theme.outline} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                ref={chipsScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                {currentFilters.map((f) => {
                  const active = f === activeFilter;
                  const displayLabel = f === 'Todos' ? t.filterAll : f;
                  return (
                    <TouchableOpacity
                      key={f}
                      onPress={() => handleFilterChange(f)}
                      style={[
                        styles.chip,
                        { backgroundColor: active ? theme.primary : theme.surfaceVariants.containerHighest },
                        f === 'Todos' && !active && { borderWidth: 1, borderColor: theme.primary + '44', backgroundColor: 'transparent' }
                      ]}
                    >
                      <Text style={[styles.chipText, { color: active ? theme.onPrimary : theme.onSurface }]}>
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
                <Text style={[styles.listNum, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {hymn.number}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listTitle, { color: theme.onSurface }]}>
                    {hymn.title}
                  </Text>
                  <Text style={[styles.listTags, { color: theme.onSurfaceVariant, opacity: 0.7 }]}>
                    {hymn.categories}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: theme.outlineVariant + '1A' }]} />
            </View>
          )}
          ListFooterComponent={
            <View style={styles.quoteBlock}>
              <MaterialIcons name="auto-awesome" size={36} color={theme.primary} style={{ marginBottom: 16 }} />
              <Text style={[styles.quoteText, { color: theme.onSurface }]}>
                "Cantad alegres a Dios, habitantes de toda la tierra."
              </Text>
              <Text style={[styles.quoteAuthor, { color: theme.outline }]}>
                SALMO 100:1
              </Text>
              <View style={{ height: Math.max(32, insets.bottom + (currentHymnId ? 100 : 20)) }} />
            </View>
          }
        />
        {totalHymns > 10 && (
          <View
            style={[
              styles.sliderContainer,
              {
                bottom: insets.bottom + (currentHymnId ? 152 : 82) + (Platform.OS === 'android' ? 50 : 0),
                opacity: sliderVisible ? 1 : 0.25,
              },
            ]}
          >
            <View ref={sliderTrackRef} style={styles.sliderTrack} onLayout={onSliderTrackLayout} {...panResponder.panHandlers}>
              <View style={[styles.sliderTrackLine, { backgroundColor: isDarkMode ? '#ffffff20' : '#6e161920' }]} />
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
            <View style={styles.sliderPositionLabel}>
              <Text style={[styles.sliderPositionText, { color: isDarkMode ? '#ffffff' : '#6e1619' }]}>
                {currentHymnNumber}/{lastHymnNumber}
              </Text>
            </View>
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
              keyExtractor={(item, index) => item.type + '_' + (item.section || 'none') + '_' + (item.letter || item.hymn?.id || index)}
              // @ts-ignore
              estimatedItemSize={40}
              drawDistance={1500}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                if (item.type === 'main_header') {
                  return (
                    <Text style={[styles.indiceMainHeader, { color: theme.onSurface, marginTop: item.marginTop || 0 }]}>
                      {item.title}
                    </Text>
                  );
                }
                if (item.type === 'header') {
                  return (
                    <View style={styles.indiceLetterHeader}>
                      <Text style={[styles.indiceLetterText, { color: theme.onSurfaceVariant }]}>
                        --{item.letter}--
                      </Text>
                    </View>
                  );
                }
                return (
                  <TouchableOpacity
                    style={styles.indiceItemRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/hymn/${item.hymn.id}`);
                    }}
                  >
                    <Text style={[styles.indiceItemTitle, { color: theme.onSurface }]} numberOfLines={1}>
                      {item.hymn.title}
                    </Text>
                    <View style={styles.indiceDotsWrapper}>
                      <Text style={[styles.indiceDots, { color: theme.outlineVariant }]} numberOfLines={1} ellipsizeMode="clip">
                        {'.'.repeat(1000)}
                      </Text>
                    </View>
                    <Text style={[styles.indiceItemNumber, { color: theme.onSurface }]}>
                      {item.hymn.number}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={<View style={{ height: insets.bottom + (currentHymnId ? 152 : 82) + (Platform.OS === 'android' ? 50 : 0) }} />}
              ListHeaderComponent={
                <View style={styles.indiceSearchContainer}>
                  <View style={[styles.searchRow, { backgroundColor: theme.surfaceVariants.containerLow, marginBottom: 0 }]}>
                    <TouchableOpacity onPress={() => searchRef.current?.focus()} activeOpacity={0.4} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <MaterialIcons name="search" size={28} color={theme.outline} style={{ marginRight: 8 }} />
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
                      keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                    />
                    {(isFocused || search.length > 0) && (
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          handleSearchChange('');
                          searchRef.current?.blur();
                        }}
                        style={{ padding: 4 }}
                      >
                        <MaterialIcons name="cancel" size={22} color={theme.outline} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              }
            />
          </View>

          {/* Alphabet Sidebar */}
          <View
            ref={sidebarTrackRef}
            style={[styles.alphabetSidebar, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fcf9f2' }]}
            onLayout={(e) => {
              sidebarTrackHeight.current = e.nativeEvent.layout.height;
              setTimeout(() => {
                sidebarTrackRef.current?.measure((x, y, width, height, pageX, pageY) => {
                  if (pageY !== undefined) sidebarTrackY.current = pageY;
                });
              }, 100);
            }}
            {...alphabetPanResponder.panHandlers}
          >
            {ALPHABET.map(letter => {
              const hasLetter = letterIndices[letter] !== undefined;
              return (
                <View
                  key={letter}
                  style={styles.alphabetTouch}
                >
                  <Text
                    style={[
                      styles.alphabetText,
                      { color: hasLetter ? theme.primary : theme.outlineVariant + '66' }
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
        </View>

        {draggingLetter && (
          <Animated.View style={[styles.draggingBubbleContainer, { opacity: bubbleOpacity }]}>
            <View style={[styles.draggingBubble, { backgroundColor: theme.primary }]}>
              <Text style={[styles.draggingBubbleText, { color: theme.onPrimary }]}>
                {draggingLetter}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    );
  };

  const renderEstribillos = () => {
    // Currently empty state since there is no estribillosData yet
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="library-music" size={64} color={theme.primary + '80'} style={{ marginBottom: 24 }} />
        <Text style={[styles.emptyTitle, { color: theme.onSurface }]}>
          {t.estribillosComingSoon || 'Próximamente'}
        </Text>
        <Text style={[styles.emptySub, { color: theme.onSurfaceVariant }]}>
          {t.estribillosComingSoonSub || 'Los estribillos se agregarán pronto a esta sección.'}
        </Text>
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
        <View style={{ paddingTop: insets.top }}>
          {renderSubTabs()}
        </View>

        {(activeSubTab === 'himnos' || (activeSubTab === 'estribillos' && estribillosData.length > 0)) && renderHimnos()}
        {activeSubTab === 'indice' && renderIndice()}
        {activeSubTab === 'estribillos' && estribillosData.length === 0 && renderEstribillos()}
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
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PublicSans_400Regular',
    fontSize: 16,
  },
  chips: { gap: 12, paddingRight: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
  },
  chipText: {
    fontFamily: 'PublicSans_500Medium',
    fontSize: 14,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 24,
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
    right: 4,
    width: 36,
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
  sliderPositionLabel: {
    marginTop: 12,
    height: 60,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderPositionText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 10,
    transform: [{ rotate: '90deg' }],
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // ── Índice ───────────────────────────────────────────────
  indiceSearchContainer: {
    paddingBottom: 8,
  },
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
    maxWidth: '75%',
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
  alphabetSidebar: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  alphabetTouch: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alphabetText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 11,
  },

  // ── Empty State (Estribillos) ─────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: -80, // Offset to center visually
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
    pointerEvents: 'none',
  },
  draggingBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    fontSize: 32,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 36, // Slightly taller than fontSize to center Newsreader
  },
});
