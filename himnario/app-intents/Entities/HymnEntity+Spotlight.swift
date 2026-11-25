import AppIntents
@preconcurrency import CoreSpotlight
internal import ExpoAppIntents
import UniformTypeIdentifiers

extension HymnEntity: AppIntentEntityRecordConvertible {}

@available(iOS 18.0, macOS 15.0, *)
@available(tvOS, unavailable)
extension HymnEntity: IndexedEntity {
  static let spotlightDomainIdentifier = "com.elbuenpastor.hymn"

  var attributeSet: CSSearchableItemAttributeSet {
    let attributes = CSSearchableItemAttributeSet(contentType: .text)
    attributes.title = title
    attributes.displayName = title
    attributes.contentDescription = subtitle
    attributes.domainIdentifier = Self.spotlightDomainIdentifier
    attributes.keywords = [id, title] + synonyms
    return attributes
  }
}
