import AppIntents
internal import ExpoAppIntents

struct HymnQuery: EntityStringQuery {
  func entities(for identifiers: [String]) async throws -> [HymnEntity] {
    return try await AppIntentEntityStore.shared
      .entities(ofKind: "hymn", matching: identifiers)
      .map(HymnEntity.init(record:))
  }

  func suggestedEntities() async throws -> [HymnEntity] {
    let all = try await AppIntentEntityStore.shared
      .entities(ofKind: "hymn")
      .map(HymnEntity.init(record:))
    return Array(all.prefix(25))
  }

  func entities(matching string: String) async throws -> [HymnEntity] {
    let all = try await AppIntentEntityStore.shared
      .entities(ofKind: "hymn")
      .map(HymnEntity.init(record:))
    return all.filter { $0.matches(string) }
  }
}
