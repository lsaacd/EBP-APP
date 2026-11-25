import AppIntents

/// Compiled App Shortcuts for Siri, Shortcuts, and Spotlight.
/// Every phrase must include `\(.applicationName)` and at most one parameter.
struct AppShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: OpenHymnIntent(),
      phrases: [
        "Open \(\.$hymn) in \(.applicationName)",
        "Open a hymn in \(.applicationName)",
        "Abrir \(\.$hymn) en \(.applicationName)",
        "Abrir un himno en \(.applicationName)",
      ],
      shortTitle: "Open Hymn",
      systemImageName: "book.closed.fill"
    )
    AppShortcut(
      intent: ShowDailyVerseIntent(),
      phrases: [
        "Show today's verse in \(.applicationName)",
        "Verse of the day in \(.applicationName)",
        "Versículo del día en \(.applicationName)",
        "Mostrar versículo de hoy en \(.applicationName)",
      ],
      shortTitle: "Verse of the Day",
      systemImageName: "text.quote"
    )
    AppShortcut(
      intent: OpenChurchesIntent(),
      phrases: [
        "Find churches in \(.applicationName)",
        "Open churches map in \(.applicationName)",
        "Buscar iglesias en \(.applicationName)",
        "Mapa de iglesias en \(.applicationName)",
      ],
      shortTitle: "Find Churches",
      systemImageName: "building.columns"
    )
  }
}
