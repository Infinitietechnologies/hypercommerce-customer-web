# Redesign — open questions & data gaps

Running log of decisions needed while porting the live app to the new design.
Each screen's data deltas (fields the redesign shows but the API doesn't, or the
API returns but the redesign drops) land here for **batch confirmation**. Until
you answer, I ship the **Default** and mark the row 🟡.

Status: 🟡 awaiting answer · 🟢 confirmed · ⚪️ not started

---

## 0. Cross-cutting

| # | Topic | Decision | Status |
|---|---|---|---|
| 0.1 | Checkout route | **Build it.** Checkout flow also changes — follow the **latest backend contract**: panel `CartApiController` + `OrderApiController` (confirmed present). I read those before building, not the redesign's mock flow. | 🟢 |
| 0.2 | Dark mode | **Light-only.** Force light (done in `_app.tsx`) and **hide the theme switch**. | 🟢 |
| 0.3 | Location pill | Show the **saved address**; if the user has selected a location, show that **selected location's address**. | 🟢 |
| 0.4 | Bottom tab bar | **Keep** the mobile bottom tab bar, reskinned to new tokens. | 🟢 |
| 0.5 | Mobile header shape | **Match the sandbox two-row mobile header** (location pill + Account/Cart on top; full-width search + Wishlist below) **and keep a ☰ menu affordance** that reaches Brands / FAQs / About so that nav isn't buried (sandbox mock relies on footer only). Desktop is the sandbox single row. Confirmed 2026-07-27. | 🟢 |
| 0.6 | Header desktop/mobile cutover | **1024px**, matching the sandbox (`min-[1024px]:` variants), **not** Tailwind's `lg` (1440). Fixed the 1024–1440 dead zone where the live app previously showed the mobile header on a desktop-width screen. `LocationSelector` breakpoint aligned to the same 1024px. Confirmed 2026-07-27. | 🟢 |
| 0.7 | Page width | Header / content / footer share **1280px** (`max-w-site`), matching the sandbox `layout.maxWidth`. Was 1360px. Confirmed 2026-07-27. | 🟢 |
| 0.8 | Language switcher placement | Kept **out of the header** (no visible chip) to preserve the clean sandbox look; tucked into the **☰ menu sheet** so it's reachable in every auth state. Logged-in users additionally reach account actions via the avatar dropdown. Confirmed 2026-07-27. *If you'd rather it live only inside the logged-in avatar dropdown, say so and I'll move it (logged-out users would then have no in-UI language switch).* | 🟢 |
| 0.9 | Header "Account" affordance | Header shows the **avatar dropdown** (`ProfileBtn`) when logged-in and a **login trigger** when logged-out, instead of the sandbox's static "Account" label. Reflects real auth state. Confirmed 2026-07-27. | 🟢 |
| 0.10 | Footer content | Kept the **real footer content** (contact phone/email, social links, app version, powered-by) rather than the sandbox mock's non-functional "Stay in the loop" newsletter. Visual language (warm amber-tint→surface gradient, amber links, columns, bottom bar) already matches the sandbox. Flag if you want the newsletter block added (needs a subscribe endpoint to be wired). | 🟡 |

---

## 1. Home  ⚪️
_pending port — deltas logged here._

## 2. Product detail (PDP)  ⚪️
_Redesign shows: brand, title, rating badge, reviews count, price/mrp/off%, 3 delivery promises, description, related. Live PDP has variants, seller info, reviews list, Q&A, wishlist — deltas logged at port time._

## 3. Listing (search / category / brand)  ⚪️
_Filter facets in the sandbox are derived from mock data (category/brand/price/rating/discount/stock). Live must map to real API facets — logged at port._

## 4. Cart  ⚪️

## 5. Checkout  ⚪️
_blocked on 0.1._

## 6. Account (overview, orders, order detail, addresses, wishlist, wallet, transactions, notifications, refer)  ⚪️

## 7. Stores  ⚪️

## 8. Static / legal  ⚪️

## 9. Auth (login / OTP / forgot-password)  ⚪️
_No redesign counterpart — I design to the new foundations (point 3). Layout proposal logged here before build._

## 10. Seller register  ⚪️
_No redesign counterpart — design new._

---

## Answered

- **2026-07-27 — Shell rebuild.** Prior uncommitted foundations/shell attempt was
  discarded and rebuilt from the `/redesign` sandbox as the pixel target. Token
  values were verified already-correct (sandbox App/Kit values: ink `#1c1a17`,
  ink-soft `#7a7570`, amber-dark `#c9790a`, line `#ece8e2` — the Foundations
  sheet's `#171a1f`/`#727680`/`#b9760a`/`#e6e8ec` are the outliers, per the
  sandbox note). Concrete fixes shipped: page width 1360→1280 (0.7), header
  cutover 1024px (0.6), sandbox-matched two-row mobile + menu affordance (0.5),
  language in menu sheet (0.8). See rows 0.5–0.10.
