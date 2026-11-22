Pod::Spec.new do |s|
  s.name           = 'AppleLookAround'
  s.version        = '1.0.0'
  s.summary        = 'Native iOS 16+ MKLookAroundViewController integration for Himnario El Buen Pastor'
  s.description    = 'Presents native Apple Maps Look Around street-level imagery inside the app'
  s.author         = 'IDDV El Buen Pastor'
  s.homepage       = 'https://himnarioebp.com'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
