# Hyyzo Rewards Feature - Actual Structure Documentation

This document covers the exact codebase structure, architecture, and file explanations of the **Rewards Feature** in `hyyzo_flutter`.

---

## 📁 Exact File & Folder Tree

```
lib/features/rewards/
│
├── data/
│   └── repositories/
│       └── rewards_repository_impl.dart          # Implementation of RewardsRepository fetching data
│
├── di/
│   ├── rewards_bloc_providers.dart               # Dependency injection / Bloc providers for rewards
│   └── rewards_repository_providers.dart         # Repository dependency injection providers
│
├── domain/
│   ├── entities/
│   │   ├── offers_rewards_entities.dart          # Entities for offers and rewards models
│   │   └── play_and_win_game.dart                # Entities for games (Spin Wheel, Treasure Box)
│   └── repositories/
│       └── rewards_repository.dart               # Abstract interface for Rewards repository
│
├── presentation/
│   ├── logic/
│   │   └── offers_and_rewards_controller.dart    # Controller/Bloc handling rewards & offers state logic
│   │
│   ├── pages/
│   │   ├── offers_and_rewards_page.dart          # Main offers & rewards screen container
│   │   ├── power_spin_screen.dart                # Power Spin Wheel interactive game screen
│   │   ├── rewards_screen.dart                   # Rewards home & overview screen
│   │   └── treasure_box_screen.dart              # Treasure box unlock game screen
│   │
│   └── widgets/
│       ├── collected_rewards_grid.dart           # Grid view showing user's unlocked rewards
│       ├── reward_popup.dart                     # Dialog popup when a reward is earned
│       ├── reward_popup_dialog.dart              # Modal overlay wrapper for reward popup
│       ├── store_rewards_grid.dart               # Grid displaying available store rewards
│       │
│       ├── common/                               # Reusable core widgets
│       │   ├── reward_background_widget.dart     # Gradient/styled background container
│       │   ├── reward_card_container.dart        # Stylized card container widget
│       │   ├── reward_primary_button.dart        # Custom styled action button
│       │   └── reward_section_title.dart         # Section title header text widget
│       │
│       ├── play_and_win_widget/                  # Play & Win game card widgets
│       │   ├── play_and_win_card.dart            # Base card widget for games
│       │   ├── spin_and_win_card.dart            # Spin Wheel game shortcut card
│       │   └── treasure_box_card.dart            # Treasure Box game shortcut card
│       │
│       ├── reward_widgets/                       # Sub-widgets for Rewards Screen
│       │   ├── cashback_banner_widget.dart       # Promotional cashback banner
│       │   ├── faq_section_widget.dart           # Rewards FAQ accordion/list
│       │   ├── how_to_earn_cashback_widget.dart  # Explanatory step-by-step guide widget
│       │   ├── offers_section_widget.dart        # Active offers section
│       │   ├── promo_banner_widget.dart          # Promotional banner slider
│       │   ├── rewards_app_bar.dart              # Custom App Bar for rewards screens
│       │   ├── rewards_bg_parallax.dart          # Parallax background effect widget
│       │   ├── rewards_button.dart               # Specialized rewards button
│       │   ├── rewards_cards.dart                # Card component for reward items
│       │   ├── rewards_header.dart               # Balance and user status header
│       │   ├── reward_back_widget.dart           # Background graphic element
│       │   ├── reward_store_widget.dart          # Rewards store showcase widget
│       │   └── stores_section_widget.dart        # Participating stores grid/list
│       │
│       └── spin_wheel_widget/                    # Sub-widgets for Spin Wheel Game
│           ├── spin_action_buttons.dart          # Spin trigger & claim buttons
│           ├── spin_counter_header.dart          # Remaining spins counter widget
│           ├── spin_particle_painter.dart        # Custom painter for spin celebration particles
│           ├── spin_rotating_background.dart     # Animated rotating glow background
│           └── spin_wheel_widget.dart            # Interactive rotating wheel widget
│
└── utils/
    ├── rewards_calculator.dart                   # Math utility for cashback & coin conversions
    └── rewards_page_constants.dart               # Constant strings, layout values, & keys
```

---

## 📑 File-by-File Breakdown & Description

### 1. `data/` Layer
- **`data/repositories/rewards_repository_impl.dart`**: Implements `RewardsRepository`. Interacts with remote APIs and local storage to fetch available rewards, claim rewards, and query spin limits.

---

### 2. `di/` (Dependency Injection) Layer
- **`di/rewards_bloc_providers.dart`**: Registers and provides `OffersAndRewardsController` / Blocs to the widget tree.
- **`di/rewards_repository_providers.dart`**: Provides the `RewardsRepositoryImpl` singleton across the rewards feature.

---

### 3. `domain/` Layer
- **`domain/entities/offers_rewards_entities.dart`**: Core data models for cashback offers, reward cards, and store vouchers.
- **`domain/entities/play_and_win_game.dart`**: Core data models for gamification features (Spin & Win, Treasure Box options, items, and prizes).
- **`domain/repositories/rewards_repository.dart`**: Abstract interface establishing contracts for rewards data fetching and interactions.

---

### 4. `presentation/logic/`
- **`presentation/logic/offers_and_rewards_controller.dart`**: State management logic for loading rewards, claiming rewards, handling spin attempts, and managing state transitions.

---

### 5. `presentation/pages/`
- **`presentation/pages/offers_and_rewards_page.dart`**: Container page for browsing offers and reward options.
- **`presentation/pages/power_spin_screen.dart`**: Gamified Power Spin screen featuring the interactive wheel and particle animations.
- **`presentation/pages/rewards_screen.dart`**: Main Rewards screen featuring coins header, collected rewards, and store shortcuts.
- **`presentation/pages/treasure_box_screen.dart`**: Interactive screen where users open mystery treasure boxes to claim prizes.

---

### 6. `presentation/widgets/`

#### Base & Common Widgets
- **`collected_rewards_grid.dart`**: Displays user's earned/unlocked rewards in a grid layout.
- **`reward_popup.dart` & `reward_popup_dialog.dart`**: Animated popup dialog for celebrating won rewards.
- **`store_rewards_grid.dart`**: Grid layout listing store-specific reward vouchers.
- **`common/reward_background_widget.dart`**: Shared background styling component.
- **`common/reward_card_container.dart`**: Card wrapper providing consistent elevation and rounded corners.
- **`common/reward_primary_button.dart`**: Primary styled action button for rewards pages.
- **`common/reward_section_title.dart`**: Typography widget for section headers.

#### Play & Win Widgets
- **`play_and_win_widget/play_and_win_card.dart`**: Card component highlighting games.
- **`play_and_win_widget/spin_and_win_card.dart`**: Banner card directing users to the Power Spin game.
- **`play_and_win_widget/treasure_box_card.dart`**: Banner card directing users to the Treasure Box game.

#### Reward Screen Sub-Widgets (`reward_widgets/`)
- **`cashback_banner_widget.dart`**: Banner highlighting active cashback rates.
- **`faq_section_widget.dart`**: Frequently Asked Questions section for rewards.
- **`how_to_earn_cashback_widget.dart`**: Step-by-step guide explaining how cashback works.
- **`offers_section_widget.dart`**: Horizontal list of featured cashback offers.
- **`promo_banner_widget.dart`**: Promotional carousel banner.
- **`rewards_app_bar.dart`**: Customized top app bar with coins display.
- **`rewards_bg_parallax.dart`**: Parallax scrolling background effect.
- **`rewards_button.dart`**: Custom button for reward redemption.
- **`rewards_cards.dart`**: Card UI for individual reward items.
- **`rewards_header.dart`**: Top header section showing total earned coins.
- **`reward_back_widget.dart`**: Decorative background graphic.
- **`reward_store_widget.dart`**: Section highlighting popular stores offering cashback.
- **`stores_section_widget.dart`**: Grid view of partner stores.

#### Spin Wheel Widgets (`spin_wheel_widget/`)
- **`spin_action_buttons.dart`**: Action controls to spin the wheel.
- **`spin_counter_header.dart`**: Displays remaining daily spin attempts.
- **`spin_particle_painter.dart`**: Custom canvas painter rendering victory particle animations.
- **`spin_rotating_background.dart`**: Rotating radial glow background animation.
- **`spin_wheel_widget.dart`**: Core fortune wheel canvas widget.

---

### 7. `utils/` Layer
- **`utils/rewards_calculator.dart`**: Helper methods to compute cashback percentages, coin conversions, and discounts.
- **`utils/rewards_page_constants.dart`**: Centralized UI constants, strings, asset paths, and configuration keys used across rewards screens.
