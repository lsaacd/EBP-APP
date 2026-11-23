/**
 * SheetGrabber — the translucent pill that floats just above a bottom sheet's
 * top edge.
 *
 * Default: absolutely positioned; render it as the first child of the sheet
 * container, which must not clip its overflow.
 * `inline`: a normal 16pt-tall row; render it as a sibling directly above a
 * sheet that does clip (give it the sheet's own transform so they move as one).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

export const SHEET_GRABBER_CLEARANCE = 24;

export default function SheetGrabber({ inline = false }: { inline?: boolean }) {
  return (
    <View pointerEvents="none" style={inline ? styles.inline : styles.floating}>
      <View style={styles.pill} />
    </View>
  );
}

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    top: -SHEET_GRABBER_CLEARANCE,
    left: 0,
    right: 0,
    height: SHEET_GRABBER_CLEARANCE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  inline: {
    width: '100%',
    height: SHEET_GRABBER_CLEARANCE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    width: 33,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
    shadowColor: '#000000',
    shadowOpacity: 0.34,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});
