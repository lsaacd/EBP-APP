/**
 * WhatsNewCatalog — Versioned release highlights for the one-time WhatsNewSheet
 * (modeled after Duo's WhatsNewCatalog.swift). Strictly cross-free SF Symbols.
 */
import type { SFSymbol } from 'sf-symbols-typescript';
import type { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export const WHATS_NEW_VERSION = '2.0.0';
export const WHATS_NEW_STORAGE_KEY = '@himnario_last_seen_whats_new_v1';

export interface WhatsNewItem {
  id: string;
  iosIcon: SFSymbol;
  androidIcon: ComponentProps<typeof MaterialIcons>['name'];
  titleEs: string;
  titleEn: string;
  bodyEs: string;
  bodyEn: string;
}

export const WHATS_NEW_ITEMS: readonly WhatsNewItem[] = [
  {
    id: 'daily-verse-widget',
    iosIcon: 'square.grid.2x2.fill',
    androidIcon: 'widgets',
    titleEs: 'Widget de Versículo del Día',
    titleEn: 'Verse of the Day Widget',
    bodyEs: 'Agrega el versículo diario a tu pantalla de inicio o pantalla bloqueada con actualización automática cada día.',
    bodyEn: 'Pin the daily verse to your Home Screen or Lock Screen with automatic midnight updates.',
  },
  {
    id: 'one-tap-signin',
    iosIcon: 'person.crop.circle.badge.checkmark',
    androidIcon: 'verified-user',
    titleEs: 'Acceso rápido con Apple y Google',
    titleEn: 'One-Tap Apple & Google Sign-In',
    bodyEs: 'Inicia sesión en un toque para sincronizar favoritos, listas, amistades y tu iglesia local.',
    bodyEn: 'Sign in with a single tap to sync favorites, playlists, friends, and your local church.',
  },
  {
    id: 'sanctuary-brightness',
    iosIcon: 'sun.max.fill',
    androidIcon: 'brightness-6',
    titleEs: 'Brillo para el culto en Aa',
    titleEn: 'Sanctuary Brightness in Aa',
    bodyEs: 'Ajusta el brillo directamente al leer un himno; al salir, tu teléfono vuelve a su brillo normal.',
    bodyEn: 'Dim screen brightness right inside the Aa text sheet and automatically restore it when you leave.',
  },
  {
    id: 'smart-sort-indice',
    iosIcon: 'arrow.up.arrow.down.circle.fill',
    androidIcon: 'sort',
    titleEs: 'Orden inteligente e Índice de Coritos',
    titleEn: 'Native Sort Menus & Coritos Index',
    bodyEs: 'Ordena himnos, iglesias y listas al instante, y explora Himnos, Estribillos y Coritos en el Índice.',
    bodyEn: 'Sort hymns, churches, and playlists in one tap, and browse Hymns, Refrains, and Choruses in the Index.',
  },
];
