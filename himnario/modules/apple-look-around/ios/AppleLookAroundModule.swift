import ExpoModulesCore
import MapKit
import UIKit

@available(iOS 16.0, *)
private final class LookAroundHostViewController: UIViewController {
  private let scene: MKLookAroundScene
  private let primaryTitle: String?
  private let secondaryTitle: String?
  private let doneLabel: String

  init(scene: MKLookAroundScene, primaryTitle: String?, secondaryTitle: String?, doneLabel: String) {
    self.scene = scene
    self.primaryTitle = primaryTitle
    self.secondaryTitle = secondaryTitle
    self.doneLabel = doneLabel
    super.init(nibName: nil, bundle: nil)
    self.modalPresentationStyle = .fullScreen
  }

  required init?(coder: NSCoder) {
    return nil
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .black

    let lookAroundVC = MKLookAroundViewController(scene: scene)
    lookAroundVC.isNavigationEnabled = true
    lookAroundVC.showsRoadLabels = true
    lookAroundVC.badgePosition = .topLeading

    addChild(lookAroundVC)
    lookAroundVC.view.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(lookAroundVC.view)
    NSLayoutConstraint.activate([
      lookAroundVC.view.topAnchor.constraint(equalTo: view.topAnchor),
      lookAroundVC.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
      lookAroundVC.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      lookAroundVC.view.trailingAnchor.constraint(equalTo: view.trailingAnchor)
    ])
    lookAroundVC.didMove(toParent: self)

    // Top-right translucent "Done / Listo" pill button
    let doneBlur = UIVisualEffectView(effect: UIBlurEffect(style: .systemUltraThinMaterialDark))
    doneBlur.translatesAutoresizingMaskIntoConstraints = false
    doneBlur.layer.cornerRadius = 20
    doneBlur.clipsToBounds = true
    view.addSubview(doneBlur)

    let doneButton = UIButton(type: .system)
    doneButton.translatesAutoresizingMaskIntoConstraints = false
    doneButton.setTitle(doneLabel, for: .normal)
    doneButton.setTitleColor(.white, for: .normal)
    doneButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .semibold)
    doneButton.contentEdgeInsets = UIEdgeInsets(top: 8, left: 18, bottom: 8, right: 18)
    doneButton.addTarget(self, action: #selector(handleDismiss), for: .touchUpInside)
    doneBlur.contentView.addSubview(doneButton)

    NSLayoutConstraint.activate([
      doneBlur.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
      doneBlur.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
      doneBlur.heightAnchor.constraint(equalToConstant: 40),
      doneButton.topAnchor.constraint(equalTo: doneBlur.contentView.topAnchor),
      doneButton.bottomAnchor.constraint(equalTo: doneBlur.contentView.bottomAnchor),
      doneButton.leadingAnchor.constraint(equalTo: doneBlur.contentView.leadingAnchor),
      doneButton.trailingAnchor.constraint(equalTo: doneBlur.contentView.trailingAnchor)
    ])

    // Bottom translucent address bar matching Apple Maps Look Around UI
    if let title = primaryTitle, !title.isEmpty {
      let bottomBlur = UIVisualEffectView(effect: UIBlurEffect(style: .systemUltraThinMaterialDark))
      bottomBlur.translatesAutoresizingMaskIntoConstraints = false
      bottomBlur.layer.cornerRadius = 22
      bottomBlur.clipsToBounds = true
      bottomBlur.isUserInteractionEnabled = false
      view.addSubview(bottomBlur)

      let stack = UIStackView()
      stack.axis = .vertical
      stack.alignment = .center
      stack.spacing = 2
      stack.translatesAutoresizingMaskIntoConstraints = false

      let titleLabel = UILabel()
      titleLabel.text = title
      titleLabel.textColor = .white
      titleLabel.font = UIFont.systemFont(ofSize: 16, weight: .bold)
      titleLabel.textAlignment = .center
      titleLabel.numberOfLines = 1
      stack.addArrangedSubview(titleLabel)

      if let sub = secondaryTitle, !sub.isEmpty {
        let subLabel = UILabel()
        subLabel.text = sub
        subLabel.textColor = UIColor.white.withAlphaComponent(0.75)
        subLabel.font = UIFont.systemFont(ofSize: 13, weight: .medium)
        subLabel.textAlignment = .center
        subLabel.numberOfLines = 1
        stack.addArrangedSubview(subLabel)
      }

      bottomBlur.contentView.addSubview(stack)
      NSLayoutConstraint.activate([
        bottomBlur.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 16),
        bottomBlur.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
        bottomBlur.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -12),
        stack.topAnchor.constraint(equalTo: bottomBlur.contentView.topAnchor, constant: 12),
        stack.bottomAnchor.constraint(equalTo: bottomBlur.contentView.bottomAnchor, constant: -12),
        stack.leadingAnchor.constraint(equalTo: bottomBlur.contentView.leadingAnchor, constant: 16),
        stack.trailingAnchor.constraint(equalTo: bottomBlur.contentView.trailingAnchor, constant: -16)
      ])
    }
  }

  @objc private func handleDismiss() {
    dismiss(animated: true)
  }
}

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

    AsyncFunction("presentLookAround") { (lat: Double, lng: Double, primaryTitle: String?, secondaryTitle: String?, doneLabel: String?, promise: Promise) in
      if #available(iOS 16.0, *) {
        let coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        let request = MKLookAroundSceneRequest(coordinate: coordinate)
        request.getSceneWithCompletionHandler { scene, _ in
          guard let validScene = scene else {
            promise.resolve(false)
            return
          }
          DispatchQueue.main.async {
            guard let topVC = Self.topViewController() else {
              promise.resolve(false)
              return
            }
            let host = LookAroundHostViewController(
              scene: validScene,
              primaryTitle: primaryTitle,
              secondaryTitle: secondaryTitle,
              doneLabel: (doneLabel?.isEmpty == false) ? doneLabel! : "Listo"
            )
            topVC.present(host, animated: true) {
              promise.resolve(true)
            }
          }
        }
      } else {
        promise.resolve(false)
      }
    }
  }

  private static func topViewController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let keyWindow = scenes
      .flatMap { $0.windows }
      .first { $0.isKeyWindow } ?? scenes.flatMap { $0.windows }.first
    var top = keyWindow?.rootViewController
    while let presented = top?.presentedViewController {
      top = presented
    }
    return top
  }
}
