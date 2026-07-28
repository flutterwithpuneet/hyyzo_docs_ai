# Hyyzo Rewards Feature Documentation

## Overview

The Rewards feature (`D:\flutter_projects\flipshope_projects\hyyzo_flutter\lib\features\rewards`) manages user rewards, coin balances, cashback history, scratch cards, and redemption workflows within the Hyyzo Flutter app.

---

## 📁 Directory & File Tree Architecture

```
lib/features/rewards/
├── data/
│   ├── datasources/
│   │   ├── rewards_remote_datasource.dart    # API calls for rewards & coins
│   │   └── rewards_local_datasource.dart     # Local cache (Hive/SharedPreferences)
│   ├── models/
│   │   ├── reward_item_model.dart            # Reward & cashback JSON serializable model
│   │   ├── user_coins_model.dart             # Coins balance & tier status model
│   │   └── scratch_card_model.dart           # Scratch card state & payload model
│   └── repositories/
│       └── rewards_repository_impl.dart      # Concrete implementation of repository
│
├── domain/
│   ├── entities/
│   │   ├── reward_item.dart                  # Clean domain reward entity
│   │   ├── user_coins.dart                   # Clean domain coins entity
│   │   └── scratch_card.dart                 # Clean domain scratch card entity
│   ├── repositories/
│   │   └── rewards_repository.dart           # Abstract repository interface
│   └── usecases/
│       ├── get_user_rewards_usecase.dart     # Fetch active rewards & history
│       ├── get_coin_balance_usecase.dart     # Get current coin balance
│       ├── unlock_scratch_card_usecase.dart  # Claim/scratch card reward
│       └── redeem_coins_usecase.dart         # Redeem coins for vouchers/cash
│
└── presentation/
    ├── controllers/                          # State Management (Riverpod / BLoC)
    │   ├── rewards_controller.dart           # Main rewards state notifier/controller
    │   └── scratch_card_controller.dart      # Scratch card interaction controller
    ├── state/
    │   ├── rewards_state.dart                # Immutable rewards UI state (loading/success/error)
    │   └── scratch_card_state.dart           # Scratch card UI state
    ├── views/
    │   ├── rewards_dashboard_screen.dart     # Main Rewards home tab view
    │   ├── reward_history_screen.dart        # Transaction & cashback history screen
    │   ├── scratch_card_dialog.dart          # Interactive scratch card overlay modal
    │   └── redeem_coins_screen.dart          # Coin redemption store view
    └── widgets/
        ├── coin_balance_card.dart            # Summary header showing total coins & tier
        ├── reward_item_tile.dart             # Individual reward/cashback tile widget
        ├── scratch_card_widget.dart          # Interactive canvas for scratch card animation
        └── tier_badge_widget.dart            # User status badge (Bronze, Silver, Gold, Platinum)
```

---

## ⚙️ Business Rules & Conditions

1. **Coin Calculation & Earnings**:
   - Users earn coins on successful purchases, referrals, and daily check-ins.
   - 100 Hyyzo Coins = ₹1 Cashback value.

2. **Scratch Card Conditions**:
   - Scratch cards expire after 30 days if left unopened.
   - Cards are unlocked only when minimum scratch area completion reaches **70%**.
   - Server verification is triggered upon card reveal.

3. **Redemption Limits & Rules**:
   - Minimum coin balance required for redemption: **500 Coins**.
   - Maximum daily redemption limit: **5,000 Coins**.
   - Accounts flagged for fraudulent activity cannot redeem rewards until verified.

4. **Tier Levels**:
   - **Bronze**: 0 - 999 Coins (Base cashback rate)
   - **Silver**: 1,000 - 4,999 Coins (1.2x cashback multiplier)
   - **Gold**: 5,000 - 19,999 Coins (1.5x cashback multiplier)
   - **Platinum**: 20,000+ Coins (2.0x cashback multiplier + Priority Support)

---

## 🔌 API Endpoints Integration

- `GET /api/v1/rewards/summary` — Fetch current coin balance, tier, and active scratch cards.
- `GET /api/v1/rewards/history` — Fetch transaction history (earned vs redeemed).
- `POST /api/v1/rewards/scratch-card/unlock` — Submit scratched card ID and claim prize.
- `POST /api/v1/rewards/redeem` — Submit coin redemption request for vouchers/cashback.
