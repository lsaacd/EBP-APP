import AppIntents
internal import ExpoAppIntents

struct OpenHymnIntent: AppIntent {
  static let title: LocalizedStringResource = "Open Hymn"
  static let openAppWhenRun: Bool = true

  @Parameter(title: "Hymn", requestValueDialog: "Which hymn would you like to open?")
  var hymn: HymnEntity

  static var parameterSummary: some ParameterSummary {
    Summary("Open \(\.$hymn)")
  }

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    await AppIntentDispatcher.shared.dispatch(
      name: "openHymn",
      params: [
        "hymnId": .string(hymn.id),
        "title": .string(hymn.title),
      ]
    )

    return .result(dialog: "Opening \(hymn.title).")
  }
}
