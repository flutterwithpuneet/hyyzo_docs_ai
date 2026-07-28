# Rewards Gamification System (Spin & Win & Treasure Box)

Comprehensive guide on the interactive gamification mechanics implemented under `hyyzo_flutter/lib/features/rewards/presentation/pages/` and `widgets/spin_wheel_widget/`.

---

## 🎡 1. Power Spin & Win (`power_spin_screen.dart`)

The Power Spin screen provides an interactive fortune wheel game where users spend spins to win Hyyzo coins and cashback vouchers.

### Key Components

- **Wheel Custom Painter** ([spin_wheel_widget.dart](file:///d:/flutter_projects/flipshope_projects/hyyzo_flutter/lib/features/rewards/presentation/widgets/spin_wheel_widget/spin_wheel_widget.dart)):
  - Renders multi-colored fortune wheel slices based on `SpinPrize` list.
  - Handles drag-to-spin physics and smooth deceleration curves using `AnimationController`.
- **Rotating Radial Glow** ([spin_rotating_background.dart](file:///d:/flutter_projects/flipshope_projects/hyyzo_flutter/lib/features/rewards/presentation/widgets/spin_wheel_widget/spin_rotating_background.dart)):
  - Continuous 360-degree rotating light rays background effect.
- **Victory Particle Painter** ([spin_particle_painter.dart](file:///d:/flutter_projects/flipshope_projects/hyyzo_flutter/lib/features/rewards/presentation/widgets/spin_wheel_widget/spin_particle_painter.dart)):
  - Canvas particle engine that fires victory confetti fireworks when the wheel lands on a prize slice.
- **Counter & Action Controls** ([spin_counter_header.dart](file:///d:/flutter_projects/flipshope_projects/hyyzo_flutter/lib/features/rewards/presentation/widgets/spin_wheel_widget/spin_counter_header.dart), [spin_action_buttons.dart](file:///d:/flutter_projects/flipshope_projects/hyyzo_flutter/lib/features/rewards/presentation/widgets/spin_wheel_widget/spin_action_buttons.dart)):
  - Displays remaining daily spin attempts and primary spin trigger button.

---

## 📦 2. Mystery Treasure Box (`treasure_box_screen.dart`)

Interactive mystery chest unlock game allowing users to claim randomized Hyyzo coin rewards.

### Key Components

- **Treasure Card & Entry** ([treasure_box_card.dart](file:///d:/flutter_projects/flipshope_projects/hyyzo_flutter/lib/features/rewards/presentation/widgets/play_and_win_widget/treasure_box_card.dart)):
  - Entry card container shown on the Rewards home screen.
- **Chest Opening Logic**:
  - Leverages `TreasureBoxGame` entity to calculate coin reward amounts within `minWinCoins` and `maxWinCoins`.
  - Plays chest lid pop animation and presents reward overlay popup.

---

## 🏆 3. Reward Celebration Popup Overlay (`reward_popup_dialog.dart`)

A centralized, modal dialog overlay used across all games and redemption triggers.

- **Data Driven**: Accepts `RewardPopupData` domain model (`title`, `currency`, `amount`, `subtitle`, `description`, `buttonLabel`).
- **Visuals**: Animated entrance with high-contrast graphic headers and single-tap CTA button to claim rewards into the user's Hyyzo wallet.
