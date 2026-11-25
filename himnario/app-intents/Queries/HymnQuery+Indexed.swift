import AppIntents
@preconcurrency import CoreSpotlight
internal import ExpoAppIntents

@available(iOS 18.0, macOS 15.0, *)
extension HymnQuery: EnumerableEntityQuery {
  func allEntities() async throws -> [HymnEntity] {
    return try await AppIntentEntityStore.shared
      .entities(ofKind: "hymn")
      .map(HymnEntity.init(record:))
  }
}

#if compiler(>=6.4)
@available(iOS 27.0, macOS 27.0, *)
extension HymnQuery: IndexedEntityQuery {
  func reindexEntities(
    for identifiers: [HymnEntity.ID],
    indexDescription: CSSearchableIndexDescription
  ) async throws {
    try await AppEntityIdentifierRegistry.shared.updateIndexFromCatalog(
      kind: "hymn",
      matching: identifiers
    )
  }

  func reindexAllEntities(indexDescription: CSSearchableIndexDescription) async throws {
    try await AppEntityIdentifierRegistry.shared.replaceIndexFromCatalog(kind: "hymn")
  }
}
#endif
