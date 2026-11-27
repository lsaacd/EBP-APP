import CoreLocation
import ExpoModulesCore
import MapKit
import UIKit

// Look Around is presented with Apple's own MKLookAroundViewController, full
// screen and directly (not embedded in a host controller). Embedded, MapKit
// treats it as a static preview that only becomes interactive after a tap;
// presented directly it is interactive immediately and brings its own close
// button and place label.
public class AppleLookAroundModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppleLookAround")

    AsyncFunction("isAvailable") { (lat: Double, lng: Double, promise: Promise) in
      if #available(iOS 16.0, *) {
        let coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        let request = MKLookAroundSceneRequest(coordinate: coordinate)
        request.getSceneWithCompletionHandler { scene, _ in
          promise.resolve(scene != nil)
        }
      } else {
        promise.resolve(false)
      }
    }

    // `secondaryTitle` and `doneLabel` are accepted for compatibility with the
    // JavaScript already shipped; Apple's full-screen UI supplies its own.
    AsyncFunction("presentLookAround") { (lat: Double, lng: Double, primaryTitle: String?, secondaryTitle: String?, doneLabel: String?, promise: Promise) in
      if #available(iOS 16.0, *) {
        let coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)

        // Asking for the place (a map item) rather than a bare coordinate lets
        // MapKit choose the vantage point and heading that face the building.
        let mapItem = MKMapItem(placemark: MKPlacemark(coordinate: coordinate))
        if let title = primaryTitle, !title.isEmpty {
          mapItem.name = title
        }

        let placeRequest = MKLookAroundSceneRequest(mapItem: mapItem)
        placeRequest.getSceneWithCompletionHandler { placeScene, _ in
          if let scene = placeScene {
            Self.present(scene: scene, promise: promise)
            return
          }
          // No scene for the place: fall back to the nearest imagery.
          let nearbyRequest = MKLookAroundSceneRequest(coordinate: coordinate)
          nearbyRequest.getSceneWithCompletionHandler { nearbyScene, _ in
            guard let scene = nearbyScene else {
              promise.resolve(false)
              return
            }
            Self.present(scene: scene, promise: promise)
          }
        }
      } else {
        promise.resolve(false)
      }
    }

    // Computes real road driving distance (meters) and traffic-aware travel time
    // (seconds) via Apple MapKit MKDirections, matching Apple Maps exactly.
    AsyncFunction("getDrivingEstimate") { (fromLat: Double, fromLng: Double, toLat: Double, toLng: Double, promise: Promise) in
      let sourceCoord = CLLocationCoordinate2D(latitude: fromLat, longitude: fromLng)
      let destCoord = CLLocationCoordinate2D(latitude: toLat, longitude: toLng)
      guard CLLocationCoordinate2DIsValid(sourceCoord), CLLocationCoordinate2DIsValid(destCoord) else {
        promise.resolve(nil)
        return
      }
      let request = MKDirections.Request()
      request.source = MKMapItem(placemark: MKPlacemark(coordinate: sourceCoord))
      request.destination = MKMapItem(placemark: MKPlacemark(coordinate: destCoord))
      request.transportType = .automobile
      let directions = MKDirections(request: request)
      directions.calculateETA { response, _ in
        if let eta = response, eta.distance > 0, eta.expectedTravelTime > 0 {
          promise.resolve([
            "distanceMeters": eta.distance,
            "expectedTravelTimeSeconds": eta.expectedTravelTime
          ])
          return
        }
        MKDirections(request: request).calculate { routeResponse, _ in
          if let route = routeResponse?.routes.first, route.distance > 0 {
            promise.resolve([
              "distanceMeters": route.distance,
              "expectedTravelTimeSeconds": route.expectedTravelTime
            ])
          } else {
            promise.resolve(nil)
          }
        }
      }
    }
  }

  @available(iOS 16.0, *)
  private static func present(scene: MKLookAroundScene, promise: Promise) {
    DispatchQueue.main.async {
      guard let topVC = Self.topViewController(), !topVC.isBeingDismissed else {
        promise.resolve(false)
        return
      }
      let lookAround = MKLookAroundViewController(scene: scene)
      lookAround.isNavigationEnabled = true
      lookAround.showsRoadLabels = true
      lookAround.modalPresentationStyle = .fullScreen
      topVC.present(lookAround, animated: true) {
        promise.resolve(true)
      }
    }
  }

  private static func topViewController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let activeScenes = scenes.filter { $0.activationState == .foregroundActive }
    let searchScenes = activeScenes.isEmpty ? scenes : activeScenes
    let keyWindow = searchScenes
      .flatMap { $0.windows }
      .first { $0.isKeyWindow } ?? searchScenes.flatMap { $0.windows }.first
    var top = keyWindow?.rootViewController
    while let presented = top?.presentedViewController {
      top = presented
    }
    return top
  }
}
