import AppIntents
internal import ExpoAppIntents

struct OpenChurchesIntent: AppIntent {
  static let title: LocalizedStringResource = "Find Churches"
  static let openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    await AppIntentDispatcher.shared.dispatch(name: "openChurches")
    return .result(dialog: "Opening the churches map.")
  }
}
