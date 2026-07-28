# Hyyzo Rewards Feature - End-to-End Complete Documentation

Comprehensive end-to-end technical documentation for the **Rewards & Gamification Feature** in `hyyzo_flutter` (`lib/features/rewards/`).

---

## 🏗️ Architecture & Layer Overview

The **Rewards Feature** follows Clean Architecture principles divided into clear layers:

```
lib/features/rewards/
├── data/           # Data source implementations & Repository implementations
├── di/             # Dependency Injection & Provider registration
├── domain/         # Business logic core (Entities & Repository contracts)
├── presentation/   # UI Layer (Pages, Custom Widgets, Controllers/ViewModels)
└── utils/          # Feature constants & calculation helpers
```

---

## 📁 Detailed Folder & File Structure

```
lib/features/rewards/
│
├── data/
│   └── repositories/
│       └── rewards_repository_impl.dart          # Implements RewardsRepository contract for API/local data
│
├── di/
│   ├── rewards_bloc_providers.dart               # Blocs/Controllers DI providers
│   └── rewards_repository_providers.dart         # Repository DI providers
│
├── domain/
│   ├── entities/
│   │   ├── offers_rewards_entities.dart          # OfferItem, RecommendedDeal, FaqItem models
│   │   └── play_and_win_game.dart                # Gamification models (SpinPrize, SpinAndWinGame, TreasureBoxGame, RewardPopupData, etc.)
│   └── repositories/
│       └── rewards_repository.dart               # Abstract interface defining Rewards contracts
│
├── presentation/
│   ├── logic/
│   │   └── offers_and_rewards_controller.dart    # State controller & scroll logic for Offers & Rewards page
│   │
│   ├── pages/
│   │   ├── offers_and_rewards_page.dart          # Main Offers & Rewards discovery page
│   │   ├── power_spin_screen.dart                # Interactive Power Spin & Win wheel game screen
│   │   ├── rewards_screen.dart                   # Rewards overview dashboard & collected rewards page
│   │   └── treasure_box_screen.dart              # Interactive mystery Treasure Box opening game screen
│   │
│   └── widgets/
│       ├── collected_rewards_grid.dart           # Grid displaying user's unlocked reward cards
│       ├── reward_popup.dart                     # Custom graphic asset popup layout for claimed rewards
│       ├── reward_popup_dialog.dart              # Modal dialog overlay for reward claim celebrations
│       ├── store_rewards_grid.dart               # Grid layout showcasing store cashback vouchers
│       │
│       ├── common/                               # Reusable base UI components
│       │   ├── reward_background_widget.dart     # Gradient & styled container background
│       │   ├── reward_card_container.dart        # Stylized card wrapper with elevation & shadows
│       │   ├── reward_primary_button.dart        # Reusable styled CTA primary button
│       │   └── reward_section_title.dart         # Styled section header typography widget
│       │
│       ├── play_and_win_widget/                  # Game launcher cards
│       │   ├── play_and_win_card.dart            # Standard game launcher card component
│       │   ├── spin_and_win_card.dart            # Banner card for Power Spin game
│       │   └── treasure_box_card.dart            # Banner card for Treasure Box mystery game
│       │
│       ├── reward_widgets/                       # Sub-widgets for Rewards Screen & Offers
│       │   ├── cashback_banner_widget.dart       # Active promotional cashback banner
│       │   ├── faq_section_widget.dart           # Collapsible FAQ accordion section
│       │   ├── how_to_earn_cashback_widget.dart  # Step-by-step guide widget on earning cashback
│       │   ├── offers_section_widget.dart        # Horizontal list of top category offers
│       │   ├── promo_banner_widget.dart          # Interactive promotional carousel slider
│       │   ├── rewards_app_bar.dart              # Dynamic transparent-to-solid App Bar with coin balance
│       │   ├── rewards_bg_parallax.dart          # Smooth parallax scrolling background effect
│       │   ├── rewards_button.dart               # Specialized claim/redeem action button
│       │   ├── rewards_cards.dart                # Card component for cashback reward items
│       │   ├── rewards_header.dart               # Coin balance showcase header widget
│       │   ├── reward_back_widget.dart           # Background decorative layout graphics
│       │   ├── reward_store_widget.dart          # Featured store spotlight card widget
│       │   └── stores_section_widget.dart        # Participating stores grid layout
│       │
│       └── spin_wheel_widget/                    # Gamified Spin Wheel sub-components
│           ├── spin_action_buttons.dart          # Interactive spin trigger and claim buttons
│           ├── spin_counter_header.dart          # Daily remaining spins counter badge
│           ├── spin_particle_painter.dart        # Custom Canvas Particle Painter for celebration effects
│           ├── spin_rotating_background.dart     # Animated rotating radial background light
│           └── spin_wheel_widget.dart            # Core CustomPainter fortune wheel with touch/drag support
│
└── utils/
### 7. `utils/` Layer
- **`utils/rewards_calculator.dart`**: Helper methods to compute cashback percentages, coin conversions, and discounts.
- **`utils/rewards_page_constants.dart`**: Centralized UI constants, strings, asset paths, and configuration keys used across rewards screens.
