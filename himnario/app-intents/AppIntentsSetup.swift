internal import ExpoAppIntents
internal import ExpoModulesCore

/// Registered Expo inline module that wires app-target App Intents code to expo-app-intents.
/// Do not change the name of this class.
final class AppIntentsSetup: Module {
  public func definition() -> ExpoModulesCore.ModuleDefinition {
    Name("AppIntentsSetup")

    OnCreate {
      #if !os(tvOS)
      if #available(iOS 18.0, macOS 15.0, *) {
        AppEntityIdentifierRegistry.shared.registerIndexed("hymn", as: HymnEntity.self)
      } else {
        AppEntityIdentifierRegistry.shared.register("hymn", as: HymnEntity.self)
      }
      #endif

      Task {
        await AppIntentDispatcher.shared.setShortcutsRefreshHandler {
          AppShortcuts.updateAppShortcutParameters()
        }
        AppShortcuts.updateAppShortcutParameters()
      }
    }
  }
}
