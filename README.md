<div align="center">
  <h1>⚔️ Gods War TCG</h1>
  <p>A Web3 Multiplayer Trading Card Game (TCG) featuring epic battles between Chinese and Greek Gods.</p>

  <!-- Badges -->
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/status-active-success.svg" alt="Status" />
  <img src="https://img.shields.io/badge/platform-Web%20%7C%20Mobile-lightgrey" alt="Platform" />
</div>

<br/>

## 📖 Overview

**Gods War TCG** is an immersive 1v1 multiplayer trading card game built with modern web technologies and Web3 integration. Players engage in strategic battles utilizing the powers of legendary deities from **Chinese** and **Greek** mythology.

Each player starts with **5 HP**, and the ultimate goal is to reduce the opponent's HP to 0 using a combination of tactical card placements, resource (Essence) management, and unique god abilities.

---

## ✨ Key Features

- **Real-time Multiplayer:** Fast-paced 1v1 PvP battles powered by WebSocket (`socket.io`), with server-side validation to prevent client-side manipulation.
- **Strategic Resource Management:** Manage "Essence" (Mana) not only to play cards onto the field but also to declare attacks, creating deep tactical layers.
- **Multiple Card Types:** 
  - 🗡️ **Warrior:** Main attacking units.
  - 🛡️ **Blocker:** Defensive units protecting the leader.
  - 📜 **Event:** Instant spell cards (e.g., draw cards, heal, board wipe).
  - 🏛️ **Stage:** Field cards granting faction-wide buffs.
- **Dynamic Abilities:** Diverse keywords like `rush`, `evade`, `pierce`, and `snipe`.
- **Web3 / NFT Integration:** Own your premium cards securely on the **Polygon Network** (ERC-1155) with Gasless Minting.
- **Sustainable Economy:** Daily quests, crafting systems, and Booster Packs available via Stripe (Fiat) or Bitcoin Lightning Network (LNBits).

---

## 🛠️ Tech Stack & Architecture

This project is built using a modern, scalable infrastructure divided into several core components to support a Free-to-Play model with premium Web3 features:

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (Modern Glassmorphism & Dark Mode UI). Hosted on **Vercel**.
- **Backend (Game Server):** Node.js, Express, `socket.io` for real-time multiplayer logic and matchmaking. Hosted on **Render**.
- **Database:** **Supabase** (PostgreSQL) for user accounts, inventory management, and quest data.
- **Web3 / Payment:** Polygon Network, `ethers.js` (Smart Contracts), and LNBits for Bitcoin (Sats) integrations.

---

## 🗺️ Roadmap (Battle Version)

We divide the execution into 4 major milestones to deliver the core Battle Version seamlessly:

- [x] **Phase 1: Accounts & Inventory** - Supabase integration, Free Starter Decks (51 cards), and Deck Builder implementation.
- [ ] **Phase 2: The Arena (Multiplayer)** - Real-time matchmaking and secure server-side game logic via Socket.io.
- [ ] **Phase 3: Rewards System** - Post-match results (Victory/Defeat), Daily Quests progression, and Dust/Gold distribution.
- [ ] **Phase 4: Web3 Minting** - Crafting Secret Rare (SEC) cards using Dust, and Gasless NFT minting directly to player wallets.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase Account
- Polygon RPC URL & Private Key (for Web3 features)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/gods-war-tcg.git
   cd gods-war-tcg
   ```

2. **Setup the Backend / Game Server:**
   ```bash
   cd server
   npm install
   # Create a .env file based on .env.example
   npm start
   ```

3. **Setup the Frontend:**
   ```bash
   # In the root directory
   npm install
   npm run dev
   ```

---

## 📜 Documentation

For more detailed technical specifications, game rules, and architecture designs, please refer to our internal documentation:
- [Gods War Manual](GODS_WAR_MANUAL.md) - Complete game rules and mechanics.
- [Architecture Master Plan](architecture_master_plan.md) - System architecture and economy loop details.
- [Celestial War System Docs](celestial-war-system-docs.md) - Technical system implementation details.

---

## 📄 License

This project is licensed under the MIT License.