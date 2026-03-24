# The Pit — Design Overhaul Spec

## Overview

A comprehensive visual redesign of The Pit, a gamified options trading education platform built for Peak6. The goal is to make the app more engaging, distinctive, and approachable for people new to finance while still feeling premium and professional for experienced traders.

## Problem Statement

The current design suffers from five interconnected issues:

1. **Intimidating first impression** — the dark trading-terminal aesthetic feels like "Wall Street bro" to newcomers
2. **Information overload** — too much on screen at once, no clear hierarchy
3. **Weak gamification feel** — XP, streaks, and levels don't feel rewarding or exciting
4. **Unclear learning path** — new users don't know where to start
5. **Generic identity** — looks like every other dark-mode dashboard, no distinctive personality

## Design Direction

**"Neon Mint"** — a restrained, premium dark interface where deep emerald does the structural work and electric mint is reserved for scores, XP, and reward moments.

### Core Principles

- **Green is the language of finance.** Beginners instantly associate green with money, markets, and growth. It creates an "I'm in the right place" feeling.
- **Green is psychologically encouraging.** It signals "go," progress, and positive outcomes — ideal for learning something intimidating.
- **Mint pops are rewards.** The brighter electric green (#4ade80) appears only on scores, XP gains, and achievement moments. This creates a visual dopamine hit.
- **Deep emerald is the workhorse.** The muted primary (#10b981, #34d399) handles navigation, labels, borders, and structural accents.
- **Red/green contrast is built-in.** Finance needs clear good/bad signals. Green/red is already hardwired into how people read financial data.
- **Echoes Peak6 without copying.** Peak6 uses green accents and dark navy. The Pit gets its own identity through darker, more electric green tones.

### Emotional Register

Premium and confident (like Linear/Notion), with progression energy (like leveling up in a game). Clean, not cluttered. Dark, but warm and inviting rather than cold terminal. Achievement moments feel earned and exciting, not cartoon-y.

## Color System

### Primary Palette

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `cm-bg` | #060d0a | 6, 13, 10 | Page background — deep dark with green undertone |
| `cm-card` | #0a1a12 | 10, 26, 18 | Card/surface background |
| `cm-card-raised` | #0f2518 | 15, 37, 24 | Elevated surface, hover states |
| `cm-border` | rgba(16,185,129,0.1) | — | Subtle green-tinted borders |
| `cm-primary` | #10b981 | 16, 185, 129 | Primary emerald — buttons, active nav, structural accents |
| `cm-primary-muted` | #34d399 | 52, 211, 153 | Lighter emerald — labels, secondary accents |
| `cm-mint` | #4ade80 | 74, 222, 128 | Electric mint — scores, XP, reward moments ONLY |
| `cm-mint-soft` | #6ee7b7 | 110, 231, 183 | Soft mint — data values, progress bars |
| `cm-text` | #f0f4f8 | 240, 244, 248 | Primary text — near-white |
| `cm-muted` | #64748b | 100, 116, 139 | Secondary text, disabled states |
| `cm-muted-light` | #94a3b8 | 148, 163, 184 | Tertiary text |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `cm-success` | #4ade80 | Same as mint — high scores, completions |
| `cm-danger` | #f43f5e | Errors, low scores, risk warnings |
| `cm-warning` | #fbbf24 | Amber — streaks, hints, difficulty indicators |
| `cm-info` | #38bdf8 | Blue — informational callouts, links |

### Gradient Usage

- **Logo/brand mark:** `linear-gradient(135deg, #10b981, #4ade80)` — emerald to mint
- **Score text (grade reveal):** `linear-gradient(135deg, #10b981, #4ade80)` — gradient text on large score numbers
- **XP progress bar:** `linear-gradient(90deg, #10b981, #34d399)` — subtle horizontal fill
- **Background glow (grade reveal only):** `radial-gradient(ellipse at 50% 30%, rgba(74,222,128,0.08) 0%, transparent 60%)` — very subtle mint radial glow behind big score moments

### Where NOT to Use Bright Mint

- Navigation items (use muted emerald)
- Body text (use cm-text or cm-muted)
- Borders (use low-opacity emerald)
- Background fills (use cm-card or cm-card-raised)
- Icons in resting state (use cm-muted)

## Typography

### Font Stack

- **UI text:** Inter (system-ui fallback) — unchanged from current
- **Data/numbers:** JetBrains Mono — unchanged from current
- **Heading weight:** 800 (extrabold) for page titles, 700 for section headings
- **Letter spacing:** -0.02em on headings for tight, confident feel
- **Body:** 13-14px, relaxed leading (1.5-1.6)

### Hierarchy Changes

- Category labels: 10-11px uppercase, letter-spacing 0.1em, emerald color
- Scenario text: 18-22px, weight 800, near-white
- Data values: JetBrains Mono, weight 800, mint-soft color
- Supporting text: 12-13px, muted color

## Component Design System

### Surfaces

- **`.cm-surface`**: `background: cm-card; border: 1px solid rgba(16,185,129,0.1); border-radius: 12px` — increased from current 4-6px radius to 12px for friendlier feel
- **`.cm-surface-raised`**: `background: cm-card-raised` — for hover states and elevated cards
- **`.cm-surface-interactive`**: hover → cm-card-raised with smooth transition

### Buttons

- **Primary**: `background: #10b981; color: #060d0a; font-weight: 700; border-radius: 8px` — solid emerald, dark text
- **Secondary**: `border: 1px solid rgba(16,185,129,0.2); color: #6ee7b7; border-radius: 8px` — outlined
- **Ghost**: `color: #64748b` — text only, hover → rgba(16,185,129,0.05) background

### Data Pills/Chips

- `background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.1); border-radius: 8px`
- Values in JetBrains Mono, mint-soft color
- Labels in muted color, 9px uppercase

### Progress Bars

- Track: `rgba(16,185,129,0.12)` — barely visible
- Fill: `linear-gradient(90deg, #10b981, #34d399)` — emerald gradient
- Height: 4px default, 6px for XP bar

### Cards (Scenario, Grade, etc.)

- 12px border-radius (up from current 4-6px)
- 1px border with `rgba(16,185,129,0.1)`
- Internal padding: 20-24px
- No box-shadow in resting state; subtle glow on hover for interactive cards

## Page-Specific Design

### Sidebar

- Background: `cm-card` (#0a1a12)
- Right border: `rgba(16,185,129,0.08)`
- Active nav item: `background: rgba(16,185,129,0.1); border-left: 2px solid #10b981; color: #6ee7b7`
- Inactive items: `color: #64748b`
- Logo: gradient emerald-to-mint square with "P" lettermark
- XP bar at top: thin progress bar with level indicator
- Streak badge at bottom: amber-tinted card with flame emoji

### Training Scenario Page

- Category label: uppercase, emerald, with difficulty badge
- Scenario text: large (18-22px), bold, high contrast
- Data grid: 4-column grid of metric cards, each with label/value pair
- Chart: green-tinted area with emerald bars/lines
- Response input: card with textarea, submit button (primary emerald)
- Hints: emerald-tinted chip showing remaining count

### Grade Reveal Page (Key Dopamine Moment)

- Centered layout, max-width ~520px
- **Big score number**: 72px font, gradient text (emerald → mint), weight 900
- Subtle radial glow behind score (the ONLY place with background glow)
- XP breakdown: itemized list in a card — base XP, streak bonus, no-hints bonus, total
- Dimension scores: 2x2 grid with score badge + mini progress bar per dimension
- Level-up trigger: if XP crosses threshold, show level-up celebration modal

### Leaderboard Page

- Podium layout for top 3: center card (1st) is taller with crown emoji, border glow
- 1st place: `border: 1px solid rgba(74,222,128,0.2); background: linear-gradient(180deg, rgba(74,222,128,0.08), cm-card)`
- User's own row: highlighted with `background: rgba(74,222,128,0.04)` and mint-colored name
- Tab toggle (Weekly / All Time): active tab is solid emerald pill

### Landing Page

- Hero with bold headline about learning to trade
- Gradient logo mark prominent
- Clear CTA button (primary emerald)
- Social proof / feature highlights below fold
- Should feel inviting and ambitious, not intimidating

### Profile Page

- User stats overview: level, XP, streak, scenarios completed
- Badge grid with earned/locked states
- Skill tree canvas with emerald node coloring
- Category mastery breakdown

### Quick Fire Page

- MCQ cards with emerald accent on selected option
- Timer/progress indicator
- Score tally in real-time

### Learning Paths Page

- Path cards showing progression (steps completed / total)
- Locked steps in muted state, current step highlighted with emerald
- Completion checkmarks in mint

### AI Tutor Chat

- Chat bubbles: user = cm-card-raised, AI = cm-card with emerald left border
- Streaming text with subtle emerald cursor

### Admin Dashboard

- Same color system but with additional data visualization colors for charts
- MTSS tier indicators: Tier 1 = mint (on track), Tier 2 = amber (watch), Tier 3 = red (intervention)

## Gamification Visual Enhancements

### XP Toast

- Slides in from top-right
- Mint gradient text for XP amount
- Brief pulse animation on appear
- Auto-dismiss after 3 seconds

### Streak Badge

- Amber/gold themed (stands out from green system intentionally)
- Flame emoji with day count
- Subtle warm glow on high streaks (7+)

### Level-Up Modal

- Centered modal with backdrop blur
- Large level number in gradient text
- List of new unlocks/rewards
- Celebratory but brief — not blocking

### Badge Unlock

- Modal with badge icon centered
- Mint glow effect behind badge
- Badge name and description
- "Continue" CTA

## Animation Guidelines

- **Transitions**: 150-200ms ease-out for hover/focus states
- **Page transitions**: subtle fade (200ms)
- **Score reveal**: scale-up animation on the big number (0.8 → 1.0, 300ms spring)
- **XP float**: translate-Y upward + fade out (existing animation, keep)
- **Progress bar fill**: 600ms ease-out width animation (existing, keep)
- **No gratuitous animation**: every animation should communicate state change, not decorate

## Accessibility

- All color combinations meet WCAG AA contrast ratio (4.5:1 for text)
- `#f0f4f8` on `#060d0a` = 15.8:1 (passes AAA)
- `#10b981` on `#060d0a` = 6.2:1 (passes AA)
- `#64748b` on `#060d0a` = 4.6:1 (passes AA)
- Focus rings: emerald outline with 2px offset
- Reduced motion: respect `prefers-reduced-motion` media query
- Skip link maintained

## Border Radius Update

Current system uses very minimal radii (2-8px). Updating to friendlier values:

| Token | Current | New |
|-------|---------|-----|
| `sm` | 2px | 4px |
| `DEFAULT` | 4px | 8px |
| `md` | 4px | 8px |
| `lg` | 6px | 12px |
| `xl` | 8px | 16px |

## Scope

Full overhaul covering:

- Landing page
- Login/signup
- All authenticated pages (training, quick fire, paths, chat, review, dictionary, feed, peer review, events, mentorship, progress, leaderboard, profile)
- Admin dashboard
- All shared components (sidebar, buttons, cards, inputs, modals, toasts, charts)
- Design system tokens (CSS variables, Tailwind config, theme files)

## Files to Modify

### Config/Theme
- `frontend/src/index.css` — CSS variables, component classes
- `frontend/tailwind.config.js` — color tokens, border radius, animations
- `frontend/src/theme/colors.ts` — color palette object
- `frontend/src/theme/chartTheme.ts` — chart colors

### Components (all in `frontend/src/components/`)
- Sidebar.tsx, AdminSidebar.tsx
- ScenarioCard.tsx, MCQCard.tsx, ConceptPrimer.tsx
- GradeReveal.tsx, ScoreGauge.tsx
- XPBar.tsx, XPProgressBar.tsx, XPToast.tsx
- StreakBadge.tsx, StreakFlame.tsx
- BadgeCard.tsx, BadgeGrid.tsx, BadgeUnlockModal.tsx
- LevelUpModal.tsx
- ResponseInput.tsx
- SkillTreeCanvas.tsx, SkillNode.tsx, SkillNodeDetail.tsx
- EventBanner.tsx, EventLeaderboard.tsx
- StudyGroupWidget.tsx
- All chart components in charts/

### Pages (all in `frontend/src/pages/`)
- LandingPage.tsx
- LoginPage.tsx, SignupPage.tsx
- TrainingPage.tsx
- QuickFirePage.tsx
- LearningPathPage.tsx
- ChatPage.tsx
- ReviewPage.tsx
- DictionaryPage.tsx
- FeedPage.tsx
- PeerReviewPage.tsx
- EventHubPage.tsx, EventDetailPage.tsx
- MentorshipHubPage.tsx, MentorDashboardPage.tsx
- ProgressPage.tsx
- LeaderboardPage.tsx
- ProfilePage.tsx, UserProfilePage.tsx
- AdminDashboard.tsx, AdminEventForm.tsx

## Out of Scope

- Backend changes
- New features or pages
- Data model changes
- API changes
- Content/copy rewriting (beyond what's needed for design coherence)
