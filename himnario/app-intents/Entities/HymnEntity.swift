import AppIntents
internal import ExpoAppIntents
import Foundation

private func normalizeHymnSearchText(_ value: String) -> String {
  return
    value
    .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
    .trimmingCharacters(in: .whitespacesAndNewlines)
}

struct HymnEntity: AppEntity {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Hymn"
  static let defaultQuery = HymnQuery()

  var id: String
  @Property(title: "Title")
  var title: String
  var subtitle: String?
  var synonyms: [String]

  var displayRepresentation: DisplayRepresentation {
    if let subtitle {
      if #available(iOS 17.0, *) {
        return DisplayRepresentation(
          title: "\(title)",
          subtitle: "\(subtitle)",
          synonyms: synonyms.map { LocalizedStringResource(stringLiteral: $0) }
        )
      }
      return DisplayRepresentation(title: "\(title)", subtitle: "\(subtitle)")
    }

    if #available(iOS 17.0, *) {
      return DisplayRepresentation(
        title: "\(title)",
        synonyms: synonyms.map { LocalizedStringResource(stringLiteral: $0) }
      )
    }
    return DisplayRepresentation(title: "\(title)")
  }

  init(record: AppIntentEntityRecord) {
    self.id = record.id
    self.subtitle = record.subtitle
    self.synonyms = record.synonyms
    self.title = record.title
  }

  private var searchableTerms: [String] {
    return [id, title] + synonyms
  }

  func matches(_ searchText: String) -> Bool {
    let normalizedSearch = normalizeHymnSearchText(searchText)
    guard !normalizedSearch.isEmpty else {
      return false
    }

    return searchableTerms.map(normalizeHymnSearchText).contains { term in
      normalizedSearch == term || normalizedSearch.contains(term) || term.contains(normalizedSearch)
    }
  }
}
