# Hyyzo Flutter — `pubspec.yaml` Complete Reference & Dependency Guide

This document provides an in-depth breakdown of every single dependency, development package, asset configuration, and build setting configured in the Hyyzo Flutter project's `pubspec.yaml`.

---

## 1. Project Metadata & SDK Environment

| Key | Value / Setting | Explanation |
| :--- | :--- | :--- |
| **`name`** | `hyyzo` | The Dart package name used across internal import statements (e.g., `import 'package:hyyzo/...'`). |
| **`description`** | `A new Flutter project.` | Short summary describing the application repository. |
| **`publish_to`** | `"none"` | Protects the project from accidental publication to the public `pub.dev` package registry. |
| **`version`** | `2.4.11+841` | The application version. `2.4.11` is the semantic version shown to users (`versionName` on Android / `CFBundleShortVersionString` on iOS), and `841` is the incrementing build number (`versionCode` on Android / `CFBundleVersion` on iOS). |
| **`environment.sdk`** | `">=3.0.0 <4.0.0"` | Requires Dart 3.0 or higher up to (excluding) Dart 4.0. |

---

## 2. Core Flutter Packages

| Package | Version / Source | Detailed Explanation |
| :--- | :--- | :--- |
| **`flutter`** | `sdk: flutter` | The core Flutter SDK containing the UI widget library, rendering pipeline, animation framework, gesture recognizers, and platform channels. |
| **`flutter_localizations`** | `sdk: flutter` | Provides built-in localization and internationalization support for widgets (e.g., Material/Cupertino dialogs, calendars, date pickers, RTL layout direction). |

---

## 3. State Management & Architecture

| Package | Version | Detailed Explanation |
| :--- | :--- | :--- |
| **`flutter_bloc`** | `^9.1.1` | The primary state management framework implementing the BLoC (Business Logic Component) pattern. Separates business logic from UI widgets, enabling clean architecture, testability, and state predictability. |
| **`bloc`** | `^9.1.1` | Core business logic state stream management library powering `flutter_bloc`. |
| **`bloc_concurrency`** | `^0.3.0` | Provides advanced event transformers for BLoC (e.g., `droppable()`, `restartable()`, `concurrent()`, `sequential()`). Used to debounce search input, prevent duplicate button taps, and manage API request queuing. |
| **`hydrated_bloc`** | *(latest)* | Automatically persists and restores BLoC states to local disk storage across application restarts and app terminations. |
| **`provider`** | `^6.0.4` | Dependency injection and lightweight state management wrapper used for injecting services, view models, and repositories down the widget tree. |
| **`rxdart`** | `^0.28.0` | ReactiveX stream extensions for Dart (such as `BehaviorSubject`, `PublishSubject`, `debounceTime`, `throttle`, and `combineLatest`). |
| **`equatable`** | `^2.0.5` | Implements value-based object equality comparison (`==` and `hashCode`) without boilerplate code. Prevents unnecessary UI rebuilds when BLoC state values haven't changed. |

---

## 4. Networking & Real-Time Communication

| Package | Version | Detailed Explanation |
| :--- | :--- | :--- |
| **`dio`** | `^5.1.2` | Advanced HTTP client for Flutter supporting request/response interceptors, global headers, request cancellation tokens, timeouts, and multipart file uploads. |
| **`http`** | `^1.2.2` | Composable, multi-platform Dart HTTP package used for standard HTTP calls, payload fetching, and utility scripts. |
| **`pretty_dio_logger`** | *(latest)* | Interceptor for Dio that prints formatted, colored, and human-readable request headers, query parameters, bodies, and responses directly into the debug console. |
| **`socket_io_client`** | `^3.1.4` | WebSocket client connecting to the backend Socket.IO server for real-time bidirectional communication (e.g., live cashback updates, dynamic notifications). |
| **`connectivity_plus`** | *(latest)* | Detects device network connectivity status changes (WiFi, Mobile Cellular, Ethernet, VPN, None) to adapt UI and handle offline states. |

---

## 5. Firebase & Cloud Services

| Package | Version | Detailed Explanation |
| :--- | :--- | :--- |
| **`firebase_core`** | `^4.3.0` | The foundational Firebase package required to initialize Firebase apps and configure cloud connections on Android & iOS. |
| **`firebase_auth`** | `^6.1.3` | Manages user authentication flows, phone number OTP verification, token refreshes, and auth session persistence. |
| **`cloud_firestore`** | `^6.1.1` | Real-time cloud NoSQL database used for live data synchronization, user document caching, and dynamic configurations. |
| **`firebase_messaging`** | `^16.1.0` | Firebase Cloud Messaging (FCM) integration for receiving foreground, background, and terminated push notifications and payload handling. |
| **`firebase_analytics`** | `^12.1.0` | Google Analytics for Firebase SDK. Tracks user conversion funnels, screen views, affiliate click events, and revenue metrics. |
| **`firebase_remote_config`** | `^6.0.1` | Manages dynamic server-side feature flags, promotional banners, commission percentages, and config values without releasing a new app build. |
| **`firebase_crashlytics`** | `^5.0.7` | Real-time crash reporting, uncaught exception tracking, and non-fatal error logging for production stability monitoring. |
| **`firebase_in_app_messaging`** | `^0.9.2` | Displays contextual, rich in-app banners and modal promotions based on user behavior triggers. |
| **`firebase_app_installations`** | `any` | Generates and manages Firebase Installation IDs (FID) used to authenticate client app instances with Firebase services. |

---

## 6. Local Storage & Caching

| Package | Version | Detailed Explanation |
| :--- | :--- | :--- |
| **`hive`** | `^2.2.3` | Fast, lightweight, pure-Dart NoSQL key-value database used for offline caching, user profile persistence, and cashback transaction caching. |
| **`hive_flutter`** | `^1.1.0` | Flutter extensions for Hive, offering reactive `ValueListenableBuilder` integration and automatic box initialization. |
| **`shared_preferences`** | `^2.0.15` | Wrapper around platform-specific persistent key-value storage (`SharedPreferences` on Android, `NSUserDefaults` on iOS) for auth tokens, flags, and user preferences. |
| **`flutter_cache_manager`** | `^3.3.0` | Generic cache manager for downloading and storing network files and images on local disk with automatic expiration and cache cleanup. |
| **`path_provider`** | *(latest)* | Finds persistent and temporary file directories on Android, iOS, and desktop (e.g., `TemporaryDirectory`, `ApplicationDocumentsDirectory`). |

---

## 7. Navigation & Deep Linking

| Package | Version | Detailed Explanation |
| :--- | :--- | :--- |
| **`go_router`** | `^17.2.3` | Declarative routing package providing deep link handling, nested route matching, query parameter parsing, and route guards. |
| **`app_links`** | `^6.4.0` | Intercepts incoming Universal Links (iOS) and Android App Links / Custom URL Schemes (e.g., `hyyzo://deal/123`) to navigate users directly to specific screens. |
| **`url_launcher`** | `^6.1.7` | Launches external URLs in the default web browser, WhatsApp, phone dialer (`tel:`), SMS app (`sms:`), or email client (`mailto:`). |

---

## 8. Attribution, Marketing Analytics & Tracking

| Package | Version | Detailed Explanation |
| :--- | :--- | :--- |
| **`appsflyer_sdk`** | `^6.17.7+1` | Attribution and marketing analytics SDK for measuring user acquisitions, affiliate campaigns, deep link campaigns, and conversion attribution. |
| **`facebook_app_events`** | `^0.30.2` | Meta/Facebook SDK for logging app events, ad installs, and conversions for Meta ad campaign optimization. |
| **`clarity_flutter`** | `^1.7.1` | Microsoft Clarity integration for screen heatmaps, user session recordings, and behavioral UX analysis. |
| **`android_play_install_referrer`** | `^0.4.0` | Retrieves Google Play Install Referrer parameters to attribute the original referral code or ad campaign on first install. |
| **`install_referrer`** | `^1.2.1` | Cross-platform install referrer tracking utility for attribution tracking. |
| **`play_install_referrer`** | *(latest)* | Dedicated Google Play Referrer API client. |
| **`app_tracking_transparency`** | `^2.0.7` | Displays Apple's required App Tracking Transparency (ATT) permission prompt on iOS 14.5+ devices before tracking user advertising IDs (IDFA). |

---

## 9. Hardware, Device Info & Platform Integration

| Package | Version | Detailed Explanation |
| :--- | :--- | :--- |
| **`device_info_plus`** | `^12.1.0` | Retrieves hardware and OS specs (device model, manufacturer, Android SDK version, iOS version) for debugging and device fingerprinting. |
| **`android_id`** | `^0.4.0` | Securely accesses the 64-bit Android Hardware ID (`ANDROID_ID`) for device identification and fraud prevention. |
| **`package_info_plus`** | `^9.0.0` | Reads app package information at runtime (App Name, Package Name, Version Name, Build Number). |
| **`permission_handler`** | `^12.0.1` | Unified API for requesting, checking, and handling system permissions (Camera, Photos, Notifications, Contacts, Storage). |
| **`app_settings`** | *(latest)* | Opens native system settings pages (e.g., App Notification Settings, Battery Optimization, Location settings) directly from the app. |
| **`flutter_contacts`** | `^1.1.9+2` | Reads device contacts to power referral features ("Invite Friends from Contacts"). |
| **`get_ip_address`** | `^0.0.5` | Fetches the user's public IP address for fraud detection and region-based verification. |
| **`win32`** | `^5.5.4` | FFI bindings to Windows Win32 APIs for Windows execution support. |
| **`credential_manager`** | `^3.0.1` | Android Credential Manager API integration for passkeys, saved passwords, and Google One Tap authentication. |
| **`sms_autofill`** | `^2.4.1` | Android SMS Retriever API implementation for automatic OTP auto-fill without asking users for broad SMS reading permissions. |
| **`phone_number_hint`** | `^0.0.6` | Displays Google Play Services phone number selector modal during user registration/login. |
| **`flutter_local_notifications`** | `^19.4.2` | Displays customizable local notifications with channels, custom sounds, and action buttons. |

---

## 10. UI Components, Animations & Media

| Package | Version | Detailed Explanation |
| :--- | :--- | :--- |
| **`flutter_screenutil`** | *(latest)* | Adapts screen and font sizes dynamically across different device screen resolutions and aspect ratios. |
| **`carousel_slider`** | `^5.0.0` | Touch-enabled carousel slider widget used for promotional banners and featured deal cards. |
| **`confetti`** | `^0.8.0` | Celebration particle effect animations triggered on successful cashback claims, scratch card wins, and rewards. |
| **`marqueer`** | *(latest)* | Smooth scrolling marquee / ticker widget for flash deal alerts, announcements, and coupon tickers. |
| **`dotted_border`** | `^3.1.0` | Draws dotted or dashed borders around promo code cards, coupons, and profit link containers. |
| **`step_progress_indicator`** | `^1.0.2` | Step-by-step progress bar showing cashback tracking lifecycle stages (e.g., Tracked → Confirmed → Paid). |
| **`percent_indicator`** | `^4.2.2` | Circular and linear progress indicators displaying reward progress and milestone achievements. |
| **`lottie`** | `^3.3.2` | Renders Adobe After Effects JSON animations for loading indicators, success popups, and celebration screens. |
| **`animated_text_kit`** | `^4.2.2` | Pre-built text animations (typewriter, fade, scale, rotate) for dynamic promotional headers. |
| **`shimmer`** | *(latest)* | Skeleton loading shimmer effect displayed while waiting for asynchronous API responses. |
| **`flutter_svg`** | `^2.0.9` | High-performance SVG rendering library for displaying vector icons and graphics crisply on all screen densities. |
| **`cached_network_image`** | `^3.2.1` | Loads, displays, and caches remote network images with placeholder animations and error fallback widgets. |
| **`readmore`** | `^3.0.0` | Expandable text widget that truncates long store descriptions and cashback rules with "Read more / Read less" controls. |
| **`fluttertoast`** | `^8.0.5` | Displays lightweight, non-intrusive toast messages (e.g., "Link copied to clipboard"). |
| **`clipboard`** | `^2.0.2` | Provides simple copy-to-clipboard and paste functionalities for referral links and coupons. |
| **`share_plus`** | `^12.0.0` | Opens native platform share sheets to share deals, products, and referral links via external apps. |
| **`custom_refresh_indicator`** | `^4.0.1` | Custom pull-to-refresh container allowing animated brand-themed loading spinners. |
| **`flutter_icon_dynamic`** | `^0.0.2` | Dynamically updates the app launcher icon on iOS and Android at runtime (used for festive seasons and special sales). |
| **`fl_chart`** | `^1.2.0` | Data visualization library used for rendering earnings charts, monthly cashback graphs, and reward analytics. |
| **`visibility_detector`** | `^0.4.0+2` | Detects when a widget enters or leaves the visible viewport (used for view impression tracking and auto-playing media). |
| **`device_preview`** | *(latest)* | In-app device preview environment for testing responsive layouts across multiple device frames. |
| **`flutter_ex_kit`** | `^0.0.6` | Utility extension library providing helper methods for Dart types and Flutter context. |
| **`image_picker`** | `^1.1.2` | Takes photos with the camera or selects images from gallery (used for profile pictures and missing cashback invoice uploads). |
| **`webview_flutter`** | `^4.13.1` | Embedded web view widget for affiliate store browsing, partner checkouts, and web-based terms & conditions. |
| **`youtube_player_flutter`** | `^9.1.1` | Embedded YouTube video player for playing educational tutorials and store guide videos inline. |
| **`chewie`** | *(latest)* | Video player UI controller wrapped around `video_player` providing playback controls, full screen, and progress bars. |
| **`flutter_html`** / **`flutter_widget_from_html`** / **`flutter_widget_from_html_core`** | `^3.0.0-beta.1` / `^0.17.0` | Parses and renders HTML tags, hyperlinks, and CSS styling into native Flutter widgets for terms, FAQs, and store policies. |
| **`story_view`** | *(latest)* | WhatsApp / Instagram style story carousel widget with progress bars for featured stories and daily deal highlights. |
| **`logger`** | *(latest)* | Structured, pretty-printed console logger with log levels (`debug`, `info`, `warning`, `error`). |
| **`crypto`** | *(latest)* | Cryptographic hashing library (MD5, SHA-1, SHA-256, HMAC) for payload signing and token security. |
| **`intl`** | `^0.20.2` | Internationalization and localization utility for date/time formatting, number formatting, and currency symbols (e.g., `₹`). |
| **`mime_type`** | `^1.0.0` | Detects MIME types of files before uploading attachments or images to servers. |

---

## 11. Icon Libraries & Custom Fonts

| Package / Font | Details |
| :--- | :--- |
| **`uicons`** (`^1.0.1`) | Flaticon vector icon collection offering clean UI icons. |
| **`font_awesome_flutter`** (`^11.0.0`) | Font Awesome icon suite used for brand icons (Amazon, Flipkart, Google, Apple) and system symbols. |
| **Font: `Mulish`** | Primary app font configured across weights 200 through 900 (`Mulish-ExtraLight.ttf` to `Mulish-Black.ttf`). |
| **Font: `Parastoo`** | Stylized typeface for specific creative headers. |
| **Font: `Marmelad`** | Rounded decorative font used for special promo banners and badges. |

---

## 12. Local Custom Packages

| Local Package Path | Purpose & Functionality |
| :--- | :--- |
| **`package/flutter_fortune_wheel`** | A customized spin-and-win wheel widget used for daily lucky draws and gamified coin rewards. |
| **`package/appinio_social_share`** | Direct social sharing integration specifically tailored for WhatsApp, Instagram, Telegram, and Facebook sharing without opening generic share sheets. |

---

## 13. Dependency Overrides

```yaml
dependency_overrides:
  path_provider_foundation: 2.3.2
```
* **Reasoning**: Pinned to version `2.3.2` to ensure iOS / macOS build compatibility and resolve transitive dependency conflicts.

---

## 14. Development Dependencies & Build Runners

| Dev Package | Version | Detailed Explanation |
| :--- | :--- | :--- |
| **`flutter_test`** | `sdk: flutter` | Unit and widget test suite for Flutter apps. |
| **`flutter_launcher_icons`** | `^0.14.4` | Automated CLI tool that generates Android and iOS app launcher icons from a single source PNG. |
| **`flutter_native_splash`** | `^2.4.7` | Automatically generates and manages native splash screens for Android (including Android 12+ dynamic splash) and iOS storyboard splash. |
| **`flutter_lints`** | `^6.0.0` | Recommended Dart lint rules to enforce consistent code style and best practices. |
| **`build_runner`** | `^2.4.11` | Concrete build tool used to execute code generators (Hive adapters, FlutterGen, JSON serializable). |
| **`hive_generator`** | `^2.0.1` | Generates TypeAdapters for custom Dart model classes stored inside Hive boxes (`@HiveType` / `@HiveField`). |
| **`flutter_gen_runner`** | `5.3.1` | Code generator that automatically generates type-safe Dart constants for all declared asset files (images, SVGs, animations). |

---

## 15. Asset Declarations & Exclusions

- **Declared Asset Directories**: `assets/images/`, `assets/images/appIcon/`, `assets/images/home_screen/`, `assets/images/categoryIcons/`, `assets/images/bottomnavIcons/`, `assets/images/hyzify/`, `assets/svg_icons/`, `assets/fonts/`, `assets/webm/`, `assets/images/guide/`, `assets/images/rewards/`.
- **Excluded Assets (`flutter_gen`)**:
  - `assets/images/3steps.png`
  - `assets/images/loginflow/*`  
  *(Excluded from auto-generated Dart asset constants to save compilation overhead)*
- **Shorebird Code Push**: `shorebird.yaml` is included under assets to support Over-The-Air (OTA) Dart code updates.
