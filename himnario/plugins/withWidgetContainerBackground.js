const { withXcodeProject } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Ensures the iOS 17+ `.containerBackground(for: .widget)` modifier is always
 * present on `DailyVerseWidget.swift` (workaround for expo/expo#46200 where
 * JS-declared containerBackground can be omitted in the generated widget entry).
 *
 * Colors match our Sacred Ink widget palette:
 * - Light: #FAF5EE (warm parchment cream)
 * - Dark:  #121214 (deep sanctuary obsidian)
 */
const ENTRY = 'WidgetsEntryView(entry: entry)';
const PATCHED = `if #available(iOS 17.0, *) {
        WidgetsEntryView(entry: entry)
          .containerBackground(for: .widget) {
            Color(UIColor { traits in
              traits.userInterfaceStyle == .dark
                ? UIColor(red: 18 / 255, green: 18 / 255, blue: 20 / 255, alpha: 1)
                : UIColor(red: 250 / 255, green: 245 / 255, blue: 238 / 255, alpha: 1)
            })
          }
      } else {
        WidgetsEntryView(entry: entry)
      }`;

module.exports = function withWidgetContainerBackground(config) {
  return withXcodeProject(config, (modConfig) => {
    const file = path.join(
      modConfig.modRequest.platformProjectRoot,
      'ExpoWidgetsTarget',
      'DailyVerseWidget.swift',
    );
    if (fs.existsSync(file)) {
      const source = fs.readFileSync(file, 'utf8');
      if (source.includes(ENTRY) && !source.includes('containerBackground')) {
        fs.writeFileSync(file, source.replace(ENTRY, PATCHED));
      }
    }
    return modConfig;
  });
};
