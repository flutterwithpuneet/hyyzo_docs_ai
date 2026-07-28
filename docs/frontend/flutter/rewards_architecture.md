# Rewards Architecture & Design Patterns

Detailed breakdown of Clean Architecture, State Management, and Design Patterns implemented in `hyyzo_flutter/lib/features/rewards`.

---

## 🏛️ Clean Architecture Breakdown

The Rewards module strictly follows Clean Architecture principles, ensuring modularity, testability, and separation of concerns.

```
                  ┌───────────────────────────────┐
                  │       Presentation Layer      │
                  │   (Pages, Widgets, Logic)     │
                  └──────────────┬────────────────┘
                                 │ depends on
                                 ▼
                  ┌───────────────────────────────┐
                  │          Domain Layer         │
                  │  (Entities & Repositories)    │
                  └──────────────▲────────────────┘
                                 │ implements
                                 │
                  ┌──────────────┴────────────────┐
                  │           Data Layer          │
                  │ (Repository Impl, APIs, Cache)│
                  └───────────────────────────────┘
```

---

## 🔑 Design Patterns Implemented

### 1. Repository Pattern
- **Abstract Interface**: `RewardsRepository` (`domain/repositories/rewards_repository.dart`) defines contracts.
- **Concrete Implementation**: `RewardsRepositoryImpl` (`data/repositories/rewards_repository_impl.dart`) manages data sources.
- **Benefit**: Decouples UI logic from data acquisition logic. Remote REST APIs or local Hive caching can be swapped without changing UI code.

### 2. ViewModel / Controller Pattern (BLoC Ready)
- **Controller**: `OffersAndRewardsController` (`presentation/logic/offers_and_rewards_controller.dart`) manages transient UI state, scroll behavior, and dynamic app bar color transitions.
- **Benefit**: Keeps widgets purely declarative (`StatelessWidget` / lightweight `StatefulWidget`).

### 3. Dependency Injection (DI) Pattern
- **Modules**: `rewards_bloc_providers.dart` and `rewards_repository_providers.dart` in `di/`.
- **Benefit**: Manages object creation lifecycle and injects dependencies cleanly across the widget tree.

### 4. Custom Painter & Animation Pattern (Gamification)
- **Canvas Rendering**: `SpinWheelWidget` and `SpinParticlePainter` use Flutter's `CustomPainter` API to render vector wheel slices and animated confetti explosion particles with dynamic math formulas.

---

## 🔄 State & Data Flow Pipeline

```
[ User Interaction (Tap Spin / Chest) ]
                  │
                  ▼
[ Page Handler (PowerSpinScreen / TreasureBoxScreen) ]
                  │
                  ▼
[ OffersAndRewardsController / Bloc ]
                  │
                  ▼
[ RewardsRepository ]
                  │
                  ▼
[ Remote API / Local Data Source ] ──► Returns Domain Entity (SpinPrize / RewardPopupData)
                  │
                  ▼
[ RewardPopupDialog Overlay Triggered ]
```
