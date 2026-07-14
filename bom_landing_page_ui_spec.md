# Bank of Maharashtra — Landing Page UI Specification

> **Source:** [https://bankofmaharashtra.bank.in/](https://bankofmaharashtra.bank.in/)
> **Purpose:** Detailed visual/structural description for another agent to faithfully recreate this landing page.

---

## 1. Color Palette & Branding

| Token | Hex | Usage |
|-------|-----|-------|
| **Primary Blue (Royal/Marine)** | `#1A3C7B` / `#003893` | Logo, header background, nav bar, headings, primary buttons |
| **Accent Blue (Link Blue)** | `#1A73E8` | Hyperlinks, hover states |
| **White** | `#FFFFFF` | Page background, text on dark bg, card bg |
| **Light Gray** | `#F5F5F5` / `#EEEEEE` | Alternate section backgrounds, dividers |
| **Dark Gray / Charcoal** | `#333333` | Body text |
| **Medium Gray** | `#666666` | Secondary text, captions |
| **Gold / Amber Accent** | `#E8A317` / `#D4A017` | CTA highlights, interest rate badges, star accents |
| **Green** | `#28A745` | Success indicators, "Apply Now" button variants |
| **Red** | `#DC3545` | Warnings, security alerts, "What's New" badge |
| **Orange** | `#F57C00` | Notification banners, promotional highlights |

### Logo
- **Design:** Features a **Deepmal (Diya Pillar)** — a traditional Indian lamp pillar — rendered in marine blue
- **Text:** "Bank of Maharashtra" in English + Marathi ("बँक ऑफ महाराष्ट्र") in marine blue
- **Position:** Top-left of the header area
- **Size:** Approx 180–200px wide, vertically centered in header

### Typography
| Element | Font | Weight | Size |
|---------|------|--------|------|
| Body Text | `Arial, Helvetica, sans-serif` | 400 | 14px |
| H1 (Hero) | `Arial, Helvetica, sans-serif` | 700 | 28–32px |
| H2 (Section Title) | `Arial, Helvetica, sans-serif` | 700 | 22–24px |
| H3 (Subsection) | `Arial, Helvetica, sans-serif` | 600 | 18–20px |
| Nav Items | `Arial, Helvetica, sans-serif` | 600 | 14–15px |
| Small / Caption | `Arial, Helvetica, sans-serif` | 400 | 12px |

---

## 2. Overall Layout

- **Full-width design** — sections span 100% viewport width
- **Content max-width:** ~1200px, horizontally centered
- **Responsive:** Collapses to hamburger menu on mobile; grid sections stack vertically
- **Structure (top → bottom):**
  1. Accessibility Toolbar
  2. Top Utility Bar
  3. Main Header (Logo + Primary Nav)
  4. Secondary Nav Bar (Category Tabs)
  5. Hero Banner Carousel
  6. Quick-Action Buttons Strip
  7. "What's New!" Scrolling News Ticker
  8. Quick Links Grid ("What are you looking for?")
  9. Ancillary Products Section
  10. Photo Gallery Carousel
  11. SLBC Maharashtra Section
  12. "Offers for you" Section
  13. Sidebar Tabs (Interest Rates / Apply Online / Downloads / Calculators)
  14. Multi-Column Footer
  15. Copyright & Legal Bar
  16. Cookie Consent Banner

---

## 3. Section-by-Section Breakdown

### 3.1 Accessibility Toolbar
- **Position:** Floating / fixed, typically on the right edge or top-right
- **Background:** Semi-transparent dark overlay or white panel
- **Controls (4 buttons, icon-based):**
  1. **Contrast** — Toggle icon (🔲), switches between normal and high-contrast mode
  2. **Highlighted Links** — Underline icon, makes all links visually prominent
  3. **Text-size** — Font-size icon (A+ / A-), adjusts text scaling
  4. **Pause Animation** — Pause icon (⏸), stops all carousels and scrolling animations
- **Style:** Small rounded buttons, ~32×32px each, stacked vertically

---

### 3.2 Top Utility Bar
- **Background:** Dark navy blue (`#1A3C7B`) or deep blue gradient
- **Height:** ~35–40px
- **Content (left-aligned):**
  - Customer Service Toll Free No: `1800-233-4526`
  - Email: `hocomplaints@bankofmaharashtra.bank.in`
- **Content (right-aligned):**
  - Language switchers: **हिंदी** | **English** | **मराठी** (text links, white color)
  - "Skip to Content" link (accessibility)
- **Text:** White, 12px, letter-spacing normal
- **Dividers:** Vertical pipe `|` between items

---

### 3.3 Secondary Utility Links Bar
- **Background:** Slightly lighter blue or same navy
- **Height:** ~35px
- **Links (horizontally spaced, white text):**
  - `Home` | `About Us` | `Locate Us` | `Careers` | `Contact Us`
  - Search icon (🔍) on the far right
- **Hover:** Underline or slight color shift to lighter blue

---

### 3.4 Main Header & Primary Navigation
- **Background:** White
- **Height:** ~70–80px
- **Layout:** Flexbox row

#### Left Side:
- **Bank of Maharashtra Logo** (Deepmal pillar + bank name in English & Marathi)
- Logo links to homepage

#### Center/Right Side — Primary Navigation Tabs:
Horizontal menu bar with the following top-level items:

| # | Label | Has Mega Dropdown |
|---|-------|-------------------|
| 1 | **Personal** | ✅ (4 sub-tabs: Deposits, Loans, Digital Banking, Govt. Schemes) |
| 2 | **Corporate** | ✅ (4 sub-tabs: Corporate Banking, Loans for MSME, Treasury, FAQs) |
| 3 | **MSME** | ✅ (9 sub-tabs including Bank's MSME Schematic Loans, Government Schemes, Co-Lending, etc.) |
| 4 | **Agriculture** | ✅ (1 sub-tab: Agriculture Loans, with 20+ items) |
| 5 | **NRI Services** | ✅ (1 sub-tab: NRI Services, with 11 items) |
| 6 | **Treasury** | ✅ (1 sub-tab with Products Offered, Forex, etc.) |
| 7 | **IBU GIFT** | ❌ (direct link) |
| 8 | **LOG-IN** | ❌ (direct link to mahaconnect.bank.in, styled as CTA button) |
| 9 | **Important Links/Sites** | ✅ (dropdown with 14 external links) |

#### Mega Dropdown Behavior:
- Opens on hover (desktop) or click (mobile)
- Full-width dropdown panel below the nav bar
- Dark semi-transparent background overlay behind content
- Sub-tabs displayed as horizontal tabs within the dropdown
- Links listed vertically under each sub-tab in 2–3 columns
- Smooth slide-down animation (~300ms)

#### LOG-IN Button:
- **Style:** Solid blue button (`#003893`) or contrasting orange/gold
- **Text:** "LOG-IN" in white, bold
- **Hover:** Slight darkening or shadow effect
- **Links to:** `https://www.mahaconnect.bank.in/` (Internet Banking portal)

#### Mobile Navigation:
- Hamburger icon (☰) replaces the nav bar
- Opens a full-screen slide-in menu from the left
- Has "Close" (✕) button at top
- Same items listed vertically with accordion-style sub-menus
- "Back" button within sub-menus

---

### 3.5 Quick Action Buttons Strip (Below Nav)
- **Background:** White or very light gray
- **Layout:** Horizontal row, evenly spaced, ~5 buttons
- **Buttons:**

| Label | Link |
|-------|------|
| Online SB Account | `/vcip` |
| Online Loans | `/online-loans` |
| Helpline | `/toll-free-numbers` |
| Investor Relation | `/qualified-institutional-placement` |
| Branch/ATM Locator | `branch-atm-locator.bankofmaharashtra.bank.in` |

- **Style:** Small pill-shaped buttons or underlined text links
- **Color:** Blue text on white, or white text on blue pills
- **Font:** 13px, semi-bold

---

### 3.6 Hero Banner Carousel
- **Width:** 100% viewport
- **Height:** ~400–500px (desktop), ~200–250px (mobile)
- **Behavior:** Auto-rotating carousel (5–8 second intervals)
- **Navigation:** Left/right arrow buttons (◀ ▶) on sides + dot indicators at bottom
- **Content:** Full-bleed promotional banners (images) showcasing:
  - New product launches (e.g., "Zen Lyfe App", "Global Edge Savings Account")
  - Seasonal offers (Home Loan rates, Gold Loan campaigns)
  - Financial results / awards
  - Government scheme promotions (KCC Jansamarth, PM Vishwakarma)
  - Press Meet announcements ("Press Meet - Financial Results for Q1 FY 2026-27")
- **Banner text:** Date stamps like "10th June 2026" appear below/over banners
- **Arrows:** Semi-transparent circular buttons, white chevrons, ~40px diameter
- **Dots:** Small circles (~10px), active dot filled blue, others outlined gray
- **Transition:** Smooth slide or fade (~500ms)

---

### 3.7 "What's New!" — Scrolling News Ticker
- **Position:** Immediately below the hero banner
- **Background:** White with a subtle top/bottom border
- **Layout:** 
  - Left: **"What's new!"** label in bold blue with a badge/icon (📢 or a red "NEW" pill)
  - Right: Horizontally scrolling (marquee-style) or vertically auto-scrolling list of announcements
- **Content:** 30+ news/notification items including:
  - MCLR/RLLR rate updates (with dates)
  - System maintenance notices
  - Press releases (Financial Results)
  - Cyber fraud warnings
  - KYC compliance reminders
  - WhatsApp Banking service launch
  - RBI directives
- **Scroll speed:** Moderate auto-scroll, pauses on hover
- **Text:** 13–14px, blue links, some items in red for urgency
- **Clickable:** Each item links to a PDF or relevant page

---

### 3.8 Quick Links Grid ("What are you looking for?")
- **Section heading:** `"What are you looking for?"` — Large text, centered, bold blue
- **Background:** White or very light gray (#F8F9FA)
- **Layout:** CSS Grid — 6–8 columns on desktop, 3–4 on tablet, 2 on mobile
- **Items (40+ icon-tile links):**

Each tile is a small card/box with:
- **Icon:** Flat/line icon (~40×40px) at center-top
- **Label:** Below icon, 12–13px, centered, dark gray text
- **Hover:** Subtle lift/shadow effect, icon color change to blue

| Row | Items |
|-----|-------|
| Row 1 | Home Loans • Car Loan • Gold Loan Against Ornaments • Deposit Interest Rates • Loan Interest Rates • Download Forms |
| Row 2 | Helpline • BoM SBI Credit Card • NETC-FASTag • Digital Banking • Co-Lending • Online Loans |
| Row 3 | Savings Account • Online Locker Application • BoM Rewards • RE-KYC • V-CIP • Metaverse |
| Row 4 | Online Jeevan Praman Patra • Shareholder Announcement • Nomination • TPA • Positive Pay System • ZED MSMEs |
| Row 5 | KCC Jansamarth • E-OTS • Online Digitization Forms • BASE-NPCI • Maha E-GST Loan • Mudra Loan |
| Row 6 | Lodge a Complaint • Cyber Crime Complaint • Digital Car Loan • RSETI • Global Edge Savings • Zen Lyfe App |
| Row 7 | Accessibility for Divyangjan • DBCP • Quiz • Unclaimed Financial Assets • MPOS |

- **Card size:** ~140×120px
- **Grid gap:** 12–16px

---

### 3.9 Ancillary Products Section
- **Section heading:** `"Ancillary Products"` — Bold, left-aligned or centered
- **Background:** White
- **Layout:** Horizontal scrollable carousel or 3–4 column grid
- **Items (14 product cards):**

| Product | Link |
|---------|------|
| PPF Scheme | `/ppf-scheme` |
| LC/BG Confirmation | PDF |
| Insurance (Bancassurance) | `/bancassurance` |
| Equity Trading Services | `/demat-services` |
| Lockers | `/lockers` |
| Sovereign Gold Bond Scheme | `/sovereign-gold-bond-scheme` |
| Metco-Trustee Co | `/metco-trustee` |
| Senior Citizen Saving Scheme | `/senior-citizen-saving-scheme` |
| Sukanya Samriddhi Yojana | `/sukanya-samriddhi-yojana` |
| Atal Pension Yojana | `/atal-pension-yojana` |
| National Pension System | `/national-pension-system` |
| NPS Vatsalya | `/nps-vatsalya` |
| Doorstep Banking Services | `/doorstep-banking-services` |
| Central Govt. Pensioner Corner | `/central-govt-pensioner` |

- **Card style:** Compact card with icon/thumbnail + title, subtle border, rounded corners
- **Hover:** Shadow lift effect

---

### 3.10 Photo Gallery Carousel
- **Section heading:** `"Photo Gallery"` — Bold blue heading
- **Background:** White or light blue tint
- **Layout:** Horizontal carousel with left/right navigation arrows
- **Items (6+ photos):**

| Caption |
|---------|
| Best Mid-Sized Bank Award |
| IBA Technology Award under five different categories |
| Bank Receives Prestigious FE Best Banks Awards |
| 91st Foundation Day Celebrations 2025 |
| Bank receives the prestigious EASE 7.0 Reforms Award |
| India's Leading Mid-Sized Public Sector Bank Award |

- **Image size:** ~300×200px each, with text caption below
- **Style:** Rounded corners, slight shadow, 12px gap between slides
- **Auto-scroll:** Yes, with pause on hover
- **Arrows:** Circular blue buttons with white chevrons

---

### 3.11 SLBC Maharashtra Section
- **Section heading:** `"SLBC Maharashtra"` — Bold blue
- **Background:** Light gray (#F5F5F5) or white
- **Layout:** Single column vertical list or 2-column grid
- **Links (11 items):**
  - About Us, Banking Network, Data Submission, Financial Inclusion
  - Govt Sponsored Programmes, Lead Bank Scheme, Miscellaneous
  - Photo Gallery, SLBC Meetings, State Profile, Useful Links
- **Style:** Simple text links in blue, bullet-point list

---

### 3.12 "Offers for you" Section
- **Section heading:** `"Offers for you"` with a `"All Offers"` link/button on the right
- **Background:** White
- **Layout:** Carousel or grid of promotional offer banners/cards
- **Content:** Promotional banners with CTA buttons linking to offers page

---

### 3.13 Sidebar / Tabbed Section — Interest Rates & Applications
- **Position:** Right side of the page (or below on mobile), alongside the main content
- **Style:** Vertical tab panel with 4 tabs

#### Tab 1: Internet Banking
- CTA button linking to `mahaconnect.bank.in`

#### Tab 2: Interest Rates
- **Table of rates:**

| Loan Type | Rate | CTA |
|-----------|------|-----|
| Housing Loan | **7.10% P.A*** | [Apply Now!] |
| Car Loan | **7.45% P.A*** | [Apply Now!] |
| Gold Loan | **8.50% P.A*** | [Apply Now!] |
| Education Loan | **6.85% P.A*** | [Apply Now!] |
| Deposit Schemes | **7.15% P.A*** | [Know More] |

- **Style:** Each rate row with bold percentage, small asterisk, blue "Apply Now!" link
- **"Apply Now!" buttons:** Green or blue pill buttons

#### Tab 3: Apply Online
- Quick links to digital application forms:
  - Housing Loan, e-GST Loan, Car Loan, Gold Loan, Personal Loan, Online SB Account
- Each with an "[Apply Now!]" / "[Open Now!]" CTA

#### Tab 4: Downloads
- Link to downloads page

#### Tab 5: Calculators
- Link to calculators page

- **Tab style:** Vertical tabs on left, content panel on right
- **Active tab:** Blue background with white text
- **Inactive tab:** White background with blue text/border

---

### 3.14 Additional Content Sections (Below Main Content)
- **Links Bar:** Horizontal row of links:
  - Service Charges | Public Information | Gallery | Social Activity | Assets for Sale | Tenders

---

### 3.15 Multi-Column Footer
- **Background:** Dark navy blue (`#1A3C7B` / `#002D72`)
- **Text color:** White / light gray
- **Layout:** 6-column grid (collapses on mobile)

#### Column 1: Disclosure
- Basel II Disclosure
- Basel III Disclosure  
- BRSR Disclosures
- ESG Disclosures

#### Column 2: Compliance
- RTI
- Replies to RTI Applications
- CEPD
- Citizen Charter (PDF)
- ABBFF Guidelines (PDF)
- PIDPI (PDF)
- Complaint Handling Mechanism (PDF)
- Independent External Monitors (IEMs) (PDF)

#### Column 3: Employee Corner
- Reservation Roster
- Retired Employee's Corner
- Life Certificate Format for Staff Pensioner (PDF)
- HRMS

#### Column 4: Financial Inclusion / Pradhanmantri Yojana
- PMJDY
- PMJDY FAQs

#### Column 5: Important Links
- KYC Compliance Check
- Bank's Wilful Defaulters
- Assets under SARFAESI Action (PDF)
- State Wise Holiday (external: IBA)
- RBI Kehta Hai (external: RBI)
- Sachet Portal (external: RBI)
- Verify CheckSum Value
- Blogs
- Feedback

#### Column 6: Get In Touch
- **Address:** Bank of Maharashtra Head Office, Lokmangal, 1501, Shivajinagar, Pune-411005
- **Social Media Icons:** (if present) Facebook, Twitter/X, YouTube, LinkedIn, Instagram

#### Security Warning Banner (within footer):
> **"Bank of Maharashtra never ask for Bank account details for any purpose through phone call/email/SMS. Bank appeals to all customers not to respond to such phone call/email/SMS and not to share their bank account detail with any one for any purpose. Never share your CVV/PIN No. of Debit/Credit card to anyone."**

- **Style:** Yellow/amber background or highlighted text, bold

---

### 3.16 Copyright & Legal Bar
- **Background:** Darkest navy (`#001A4B`) or black
- **Height:** ~40–50px
- **Content (left):**
  - "© 2026 Bank of Maharashtra. All Rights Reserved"
- **Content (center):**
  - Links: `Disclaimer` | `Privacy Policy` | `Cookies Policy` | `Sitemap`
  - Link: `General Terms & Conditions*`
- **Content (right):**
  - "Last Updated: 18-02-2026"
  - "Click here to view last visited page"
  - "SCROLL TO TOP" button (↑ arrow)
- **Text:** White, 12px

---

### 3.17 Cookie Consent Banner
- **Position:** Fixed at bottom of viewport
- **Background:** White with top shadow/border
- **Content:** 
  > "Bank of Maharashtra use cookies to enhance your experience on Bank's website. Read More... By using our website, you agree to place these cookies on your device."
  - Link to Cookie/Privacy Policy & Terms & Conditions
- **Button:** "Accept" or "OK" button — Blue, rounded
- **Height:** ~60–80px
- **Dismissible:** Clicking accept hides the banner

---

## 4. Animations & Interactions

| Element | Animation |
|---------|-----------|
| Hero Carousel | Auto-slide every 5–8s, fade/slide transition ~500ms |
| News Ticker | Continuous vertical or horizontal scroll, pauses on hover |
| Mega Menu | Slide-down on hover, ~300ms ease-in-out |
| Quick Link Tiles | Hover: translateY(-4px) + box-shadow |
| Photo Gallery | Auto-carousel with slide transition |
| Scroll-to-Top | Fade-in when scrolled past 300px, smooth scroll on click |
| Accessibility Panel | Toggle slide-in/out animation |
| Cookie Banner | Slide-up from bottom on page load |
| Mobile Menu | Slide-in from left, ~400ms |

---

## 5. Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| **≥ 1200px** | Full desktop layout — all columns visible, horizontal nav |
| **992–1199px** | Slight column compression, mega menu still horizontal |
| **768–991px** | Hamburger menu, 2-column grids, sidebar stacks below main content |
| **< 768px** | Single column, full-width cards, stacked footer, touch-friendly buttons (min 44px tap target) |

---

## 6. Key Page Metadata

```html
<title>Bank of Maharashtra - One Family One Bank</title>
<meta name="description" content="Bank of Maharashtra - India's leading public sector bank. Explore Home, Car & Gold loans, MSME loan, Digital & Corporate banking, Govt. schemes, MSME & Agri Loans, NRI accounts & more." />
```

---

## 7. Summary of Key Visual Characteristics

> [!IMPORTANT]
> The overall aesthetic is **institutional and information-dense** — typical of Indian public sector bank websites. It prioritizes **comprehensive navigation** and **quick access** over minimalism. The design language is functional rather than trendy, with a **strong blue-and-white color scheme** accented by gold/amber for promotional highlights.

- **Dense mega-menus** — The navigation is the backbone, with hundreds of links organized in tabbed dropdown panels
- **Multiple CTAs** — "Apply Now!", "Know More", "Open Now!" appear frequently
- **Trust signals** — Security warnings, RBI links, toll-free numbers are prominent
- **Multi-language support** — Hindi, English, Marathi
- **Accessibility-first** — Dedicated toolbar with contrast, text-size, link highlighting, animation pause
- **Government branding** — Indian Ashoka emblem / government scheme logos may appear in banners
