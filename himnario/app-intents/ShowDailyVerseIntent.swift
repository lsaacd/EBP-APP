import AppIntents
internal import ExpoAppIntents

struct ShowDailyVerseIntent: AppIntent {
  static let title: LocalizedStringResource = "Show Verse of the Day"
  static let openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    await AppIntentDispatcher.shared.dispatch(name: "showDailyVerse")
    return .result(dialog: "Opening today's verse.")
  }
}
