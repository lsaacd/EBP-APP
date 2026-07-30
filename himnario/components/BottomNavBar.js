/**
 * BottomNavBar — Floating glass pill island with a sliding bubble indicator.
 *
 * Interaction Architecture:
 * Instead of 4 individual Pressables, the tab row is ONE shared gesture
 * surface managed by PanResponder. This enables the Apple Books "liquid
 * glass" sliding bubble where a single shared bubble tracks the finger
 * as it drags across tabs without lifting.
 *
 * Gesture lifecycle:
 * - onPanResponderGrant: finger touches down: snap bubble to tab, fade in.
 * - onPanResponderMove: finger slides: spring bubble to new tab.
 * - onPanResponderRelease: finger lifts: navigate, fade bubble out.
 * - onPanResponderTerminate: cancelled (call/notification): fade bubble out.
 *
 * Animation systems:
 * - scaleAnims[i]: icon spring bounce, triggered when the active route changes.
 * - bubbleX: shared translateX for the sliding bubble (native driver).
 * - bubbleOpacity: fade in/out on press start/end (native driver).
 *
 * Cross-platform considerations:
 * - iOS: two-layer shadow/clip wrappers, BlurView at CALayer borderRadius.
 * - Android: elevation skipped, higher glassTint opacity compensates for lack of blur.
 *
 * @returns {React.JSX.Element} The rendered navigation bar.
 */
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  PanResponder,
  DeviceEventEmitter,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MiniPlayer from './MiniPlayer';
import MusicPlayer from './MusicPlayer';
import { useNowPlaying } from '../context/NowPlayingContext';

const TABS = [
  { label: 'Inicio', icon: 'home', route: '/home' },
  { label: 'Himnos', icon: 'menu-book', route: '/hymns' },
  { label: 'Favoritos', icon: 'bookmark', route: '/favorites' },
  { label: 'Ajustes', icon: 'settings', route: '/settings' },
];

// ACTIVE_COLOR is defined inside the component (theme-reactive — see below)
const BUBBLE_WIDTH = 56;
const BUBBLE_HEIGHT = 63;
// Hard-coded layout constants (avoids async .measure() race condition)
// PILL_LEFT_MARGIN = left:20 set on pillShadow — always deterministic
// TAB_ROW_PADDING  = paddingHorizontal:8 on the tabRow style
const PILL_LEFT_MARGIN = 20;
const TAB_ROW_PADDING = 8;

export default function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  // Active tab colour: burgundy in light mode, white in dark mode
  const ACTIVE_COLOR = isDarkMode ? '#ffffff' : '#6e1619';
  const insets = useSafeAreaInsets();

  // Build translated TABS from route list + language context
  const TABS = [
    { label: t.tabHome, icon: 'home', route: '/home' },
    { label: t.tabHymns, icon: 'menu-book', route: '/hymns' },
    { label: t.tabFavorites, icon: 'bookmark', route: '/favorites' },
    { label: t.tabSettings, icon: 'settings', route: '/settings' },
  ];

  // Keep stable refs for PanResponder closures ─────────────────────────
  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);
  const tabRowWidth = useRef(0); // populated by onLayout — no .measure() needed
  const hoveredIdx = useRef(-1);
  const tabWidths = useRef(new Array(TABS.length).fill(BUBBLE_WIDTH));

  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);
  useEffect(() => { routerRef.current = router; }, [router]);

  // Ref-based release handler — always holds a FRESH closure so the stale
  // PanResponder (created once via useRef) can call up-to-date logic.
  const releaseHandlerRef = useRef(() => { });
  releaseHandlerRef.current = () => {
    const idx = hoveredIdx.current;
    if (idx >= 0) {
      const routes = ['/home', '/hymns', '/favorites', '/settings'];
      const route = routes[idx];
      const current = pathnameRef.current;
      if (route && route !== current && !current.startsWith(route + '/')) {
        routerRef.current.replace(route);
      } else if (route) {
        DeviceEventEmitter.emit('scroll-to-top', { route });
      }
    }
  };

  // ── Animations ────────────────────────────────────────────────────────
  const scaleAnims = useRef(TABS.map(() => new Animated.Value(1))).current;
  // ── Bubble animations ───────────────────────────────────────────────────
  // CRITICAL RULE: All three values (bubbleX, bubbleOpacity, bubbleWidth)
  // are applied to the SAME <Animated.View>. React Native requires that
  // every animated prop on a single node uses the SAME driver.
  // bubbleWidth animates 'width' — a layout prop — which CAN'T go native.
  // Therefore ALL three must be useNativeDriver:false.
  // scaleAnims are on SEPARATE <Animated.View> nodes so they can stay native.
  const bubbleX = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleWidth = useRef(new Animated.Value(BUBBLE_WIDTH)).current;

  const activeIndex = TABS.findIndex(
    (t) => pathname === t.route || pathname.startsWith(t.route + '/')
  );

  // Icon spring bounce on route change (unrelated to gesture)
  useEffect(() => {
    if (activeIndex < 0) return;
    Animated.sequence([
      Animated.spring(scaleAnims[activeIndex], {
        toValue: 1.20, useNativeDriver: true, speed: 40, bounciness: 14,
      }),
      Animated.spring(scaleAnims[activeIndex], {
        toValue: 1, useNativeDriver: true, speed: 28, bounciness: 6,
      }),
    ]).start();
  }, [activeIndex]);

  // ── Gesture helpers ────────────────────────────────────────────────────
  //
  // WHY HARD MATH instead of .measure():
  // .measure() is async and fires before layout is committed on first render,
  // returning 0 or stale values. Since we already know the pill is positioned
  // with left:20 (PILL_LEFT_MARGIN) and paddingHorizontal:8 (TAB_ROW_PADDING),
  // we can compute the finger's slot index with pure arithmetic — no async.
  //
  const getTabIndex = (pageX) => {
    if (!tabRowWidth.current) return 0;
    const activeWidth = tabRowWidth.current - TAB_ROW_PADDING * 2; // content area
    const relativeX = pageX - PILL_LEFT_MARGIN - TAB_ROW_PADDING; // inside content
    const slotW = activeWidth / TABS.length;
    return Math.max(0, Math.min(TABS.length - 1, Math.floor(relativeX / slotW)));
  };

  // Centers the bubble over slot [idx], accounting for the 8px padding offset
  const bubbleXForTab = (idx) => {
    if (!tabRowWidth.current) return 0;
    const activeWidth = tabRowWidth.current - TAB_ROW_PADDING * 2;
    const slotW = activeWidth / TABS.length;
    return TAB_ROW_PADDING + idx * slotW + slotW / 2 - BUBBLE_WIDTH / 2;
  };

  const springBubbleTo = (idx) => {
    const targetWidth = tabWidths.current[idx] || BUBBLE_WIDTH;

    // Both springs use useNativeDriver:false — must match bubbleWidth
    // which animates 'width' (a layout prop, JS-only).
    Animated.spring(bubbleX, {
      toValue: bubbleXForTab(idx),
      useNativeDriver: false, // must match the other bubble anims
      speed: 22,
      bounciness: 4,
    }).start();

    Animated.spring(bubbleWidth, {
      toValue: Math.max(targetWidth, BUBBLE_WIDTH),
      useNativeDriver: false,
      speed: 28,
      bounciness: 2,
    }).start();
  };

  const showBubble = () => {
    Animated.timing(bubbleOpacity, {
      toValue: 1, duration: 80, useNativeDriver: false, // same View as bubbleX/Width
    }).start();
  };

  const hideBubble = () => {
    Animated.timing(bubbleOpacity, {
      toValue: 0, duration: 220, useNativeDriver: false,
    }).start();
  };

  // ── PanResponder (created once, reads refs for live values) ──────────
  const panResponder = useRef(
    PanResponder.create({
      // Capture the gesture before any child can claim it
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (e) => {
        const idx = getTabIndex(e.nativeEvent.pageX); // pageX = screen-absolute
        hoveredIdx.current = idx;
        bubbleX.setValue(bubbleXForTab(idx));
        bubbleWidth.setValue(Math.max(tabWidths.current[idx] || BUBBLE_WIDTH, BUBBLE_WIDTH));
        showBubble();
      },

      onPanResponderMove: (e) => {
        const idx = getTabIndex(e.nativeEvent.pageX); // pageX = screen-absolute
        if (idx !== hoveredIdx.current) {
          hoveredIdx.current = idx;
          springBubbleTo(idx);
        }
      },

      onPanResponderRelease: () => {
        releaseHandlerRef.current();
        hideBubble();
        hoveredIdx.current = -1;
      },

      // Called if the OS interrupts (incoming call, notification, etc.)
      onPanResponderTerminate: () => {
        hideBubble();
        hoveredIdx.current = -1;
      },
    })
  ).current;

  // ── Glass values ──────────────────────────────────────────────────────
  const isIOS = Platform.OS === 'ios';

  // Glass tint — sits on top of the blur kernel as a colour wash
  // iOS:     subtle white wash (blur does the heavy lifting)
  // Android: opaque fill (no blur on Android, tint IS the background)
  const glassTint = isDarkMode
    ? isIOS ? 'rgba(1,1,1,0.45)' : 'rgba(1,1,1,0.88)'        // #010101 dark pill
    : isIOS ? 'rgba(255,255,255,0.05)' : 'rgba(252,249,242,0.92)'; // parchment light pill

  // Bubble colour: matches the glass card surface for a cohesive "dent" effect
  const bubbleColor = theme.surfaceVariants.containerLow;

  const borderColor = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.50)';
  const blurTint = isDarkMode ? 'dark' : 'light';  // prevents white bleed in dark mode
  const blurIntensity = isIOS ? 5 : 10;
  const shadowOpacityVal = isIOS ? (isDarkMode ? 0.35 : 0.10) : 0;
  const shadowColor = '#000000';

  //Height margin of bottom of the screen for the NavBar or Pill Container 
  const pillBottom = Math.max(22);

  const { showFullPlayer, closeFullPlayer, currentHymnId } = useNowPlaying();

  return (
    <View style={styles.overlay} pointerEvents="box-none">

      {/* ── Global Music Player Modal ─────────────────────────── */}
      {/* IMPORTANT: Only MOUNT the Modal when it should be visible.
          React Native's <Modal visible={false}> on Android can leave an
          invisible touch-intercepting layer behind after dismissal,
          causing scrolling and touch events on the underlying screen
          to freeze until the modal is interacted with again.          */}
      {currentHymnId && showFullPlayer && (
        <MusicPlayer
          visible={true}
          hymnId={currentHymnId}
          onClose={() => closeFullPlayer()}
          onViewLyrics={(id) => routerRef.current.push(`/hymns/${id}`)}
        />
      )}

      {/* ── Mini Player — floats directly on top of the pill with 0px gap ── */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: pillBottom + 61 }}>
        <MiniPlayer />
      </View>

      {/* LAYER A: shadow wrapper — NO overflow:hidden (would clip iOS shadow) */}
      <View
        style={[
          styles.pillShadow,
          { bottom: pillBottom, shadowColor, shadowOpacity: shadowOpacityVal },
        ]}
        pointerEvents="auto"
      >
        {/* LAYER B: clip wrapper — overflow:hidden clips blur to pill radius */}
        <View style={[styles.pillClip, { borderColor }]}>

          {/* Blur kernel — own borderRadius clips UIVisualEffectView (iOS) */}
          <BlurView
            intensity={blurIntensity}
            tint={blurTint}
            style={[StyleSheet.absoluteFill, styles.blurSelf]}
          />

          {/* Colour wash over the blur */}
          <View
            style={[StyleSheet.absoluteFill, styles.blurSelf, { backgroundColor: glassTint }]}
          />

          {/* ── Tab gesture surface ───────────────────────────────────────
              onLayout captures the row width once on mount. No .measure()
              needed — offset is computed from PILL_LEFT_MARGIN constant.  */}
          <View
            style={styles.tabRow}
            onLayout={(e) => { tabRowWidth.current = e.nativeEvent.layout.width; }}
            {...panResponder.panHandlers}
          >

            {/* ── SHARED SLIDING BUBBLE ──────────────────────────────
                position:absolute — behind all tab items in z-order.
                translateX (native driver) slides it left/right.
                width (JS driver) morphs to match the hovered tab's
                measured content width, so it wraps snugly around each
                label — shorter for "Inicio", wider for "Favoritos".  */}
            <Animated.View
              style={[
                styles.bubble,
                {
                  backgroundColor: bubbleColor,
                  opacity: bubbleOpacity,
                  width: bubbleWidth,    // adaptive — JS animated
                  transform: [{ translateX: bubbleX }], // native animated
                },
              ]}
              pointerEvents="none"
            />

            {/* ── Tab items ─────────────────────────────────────────── */}
            {TABS.map((tab, i) => {
              const isActive = i === activeIndex;
              const iconColor = isActive
                ? ACTIVE_COLOR
                : isDarkMode
                  ? 'rgba(243,240,234,0.55)'
                  : 'rgba(28,28,24,0.45)';

              return (
                <View
                  key={tab.route}
                  style={styles.tabItem}
                  // Measure each tab's rendered width so the bubble can
                  // morph to match it as the finger slides
                  onLayout={(e) => {
                    tabWidths.current[i] = e.nativeEvent.layout.width;
                  }}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={tab.label}
                  accessibilityState={{ selected: isActive }}
                >
                  <Animated.View style={{ transform: [{ scale: scaleAnims[i] }] }}>
                    <MaterialIcons name={tab.icon} size={28} color={iconColor} />
                  </Animated.View>

                  <Text
                    style={[
                      styles.label,
                      {
                        color: iconColor,
                        fontFamily: 'PublicSans_700Bold'

                      },
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </View>
              );
            })}

          </View>{/* end tabRow / gesture surface */}

        </View>{/* end pillClip */}
      </View>{/* end pillShadow */}

    </View>
  );
}

const PILL_RADIUS = 50;

const styles = StyleSheet.create({

  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },

  pillShadow: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: PILL_RADIUS,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 22,
    backgroundColor: 'transparent',
  },

  pillClip: {
    borderRadius: PILL_RADIUS,
    overflow: 'hidden',
    borderWidth: 0.5,
  },

  blurSelf: {
    borderRadius: PILL_RADIUS,
  },

  // ── Gesture surface ──────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },

  // ── Shared sliding bubble ────────────────────────────────────────────
  // Absolutely positioned; translateX drives horizontal position.
  // Vertically centered via top/height calculation:
  //   paddingVertical:12 → inner height = iconSize22 + gap4 + label10 + 2*12 = 60
  //   bubble height 48 → top = (60 - 48) / 2 = 6
  bubble: {
    position: 'absolute',
    top: 8,
    left: -16,
    width: BUBBLE_WIDTH,
    height: BUBBLE_HEIGHT,
    borderRadius: 12,
  },

  // ── Tab item ─────────────────────────────────────────────────────────
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },

  label: {
    fontSize: 11,
    letterSpacing: -0.1,
  },
});
