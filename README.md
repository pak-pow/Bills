# Palo! Bills ⚡

> **Roommate Bill Splits & Household Pool Management on Stellar**
> pre-fund household pools, split utility bills dynamically according to locked percentages, and settle shares programmatically via Soroban smart contracts.

---

## The Problem

Living with roommates (co-living) is extremely common for students and young professionals in urban hubs like Manila and Cebu. But managing shared expenses (rent, Meralco electricity, water, internet) causes constant friction:
- **Awkward chasing:** One roommate pays the bill and has to manually calculate splits and chase others for days.
- **Transaction fees:** Splitting bills via traditional banks or mobile wallets accumulates transfer fees and friction.
- **Budgeting uncertainty:** No pre-funded savings pools dedicated to upcoming house bills.

**Palo! Bills solves this at the protocol layer.** Roommates pre-fund the household pool in USDC directly on-chain. When a bill arrives, the house manager broadcasts it, and the Soroban smart contract automatically calculates splits based on roommate percentages, deducts them from pre-funded balances, and settles the payment instantly.

---

## How it Uses Stellar

| Feature | Stellar Primitive |
|---|---|
| **Pre-funded Pool** | Stellar payments (USDC on Testnet) locked in the contract |
| **Split Enforcement** | **Soroban Smart Contract** — `deposit`, `charge_bill`, `withdraw` |
| **Share Ratios** | Basis points (e.g. 5000 = 50%) stored in persistent contract storage |
| **Account Balances** | Horizon REST API |
| **Wallet connection** | Freighter (`@stellar/freighter-api`) |

---

## Repo Structure

```
PaloBills/
├── web/                  # Next.js 16 + TypeScript + Tailwind v4 frontend
│   └── src/
│       ├── app/          # page.tsx, layout.tsx, globals.css
│       └── components/   # Navbar, HeroSection, Dashboard, ManagerPortal
├── backend/              # Node.js Express API (Horizon proxy + bill metadata store)
│   └── src/index.js
├── contracts/            # Soroban Rust smart contract (soroban-sdk v22)
│   └── src/
│       ├── lib.rs        # initialize / add_member / deposit / charge_bill / withdraw
│       └── test.rs       # unit tests (cargo test ✅ 2 passed)
└── README.md
```

---

## Smart Contract Functions

| Function | Who Calls | Description |
|---|---|---|
| `initialize(admin, token)` | Deployer | Sets the house manager/admin and payment token (USDC) |
| `add_member(member, share_bps)` | Admin | Adds a roommate and sets their split ratio in basis points |
| `deposit(from, amount)` | Roommate | Deposits USDC to pre-fund upcoming split bills |
| `charge_bill(description, total_amount)` | Admin | Calculates split shares, deducts them from roommate balances, and sends the total to the admin |
| `withdraw(from, amount)` | Roommate | Withdraws excess pre-funded USDC from the contract |
| `get_balance(member)` | Anyone | Reads a roommate's pre-funded balance |
| `get_members()` | Anyone | Returns list of registered roommates |

---

## Setup & Run

### 1. Frontend
```powershell
cd web
npm install
npm run dev
```
Open <http://localhost:3000> and connect Freighter (set to Testnet).

### 2. Backend Proxy
```powershell
cd backend
npm install
npm run dev
```
Runs on <http://localhost:4002> to proxy Horizon balances and store bill metadata.

### 3. Smart Contract
```powershell
cd contracts
cargo test                 # runs unit tests (2 tests passed ✅)
stellar contract build
stellar contract deploy \
  --wasm target/wasm32v1-none/release/palobills_contract.wasm \
  --source <identity> \
  --network testnet
```

---

## License

MIT
