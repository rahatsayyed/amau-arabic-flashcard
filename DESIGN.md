---
name: Heritage & Horizon
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#414849'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#71787a'
  outline-variant: '#c1c8c9'
  surface-tint: '#456369'
  primary: '#002125'
  on-primary: '#ffffff'
  primary-container: '#17363b'
  on-primary-container: '#809fa5'
  inverse-primary: '#acccd2'
  secondary: '#b32914'
  on-secondary: '#ffffff'
  secondary-container: '#fd5e43'
  on-secondary-container: '#5e0700'
  tertiary: '#301600'
  on-tertiary: '#ffffff'
  tertiary-container: '#4f2700'
  on-tertiary-container: '#c98c5a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c8e8ee'
  primary-fixed-dim: '#acccd2'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#2d4b51'
  secondary-fixed: '#ffdad3'
  secondary-fixed-dim: '#ffb4a6'
  on-secondary-fixed: '#3f0300'
  on-secondary-fixed-variant: '#8f1000'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#fcb882'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#693b10'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  title-md:
    fontFamily: Source Serif 4
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  arabic-display:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 72px
  arabic-body:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 44px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

The design system is built for a premium educational experience that bridges ancient linguistic tradition with modern pedagogical technology. It targets serious learners who value both academic depth and a high-end digital experience. 

The visual style is **Modern Corporate with a Tonal Warmth**, prioritizing focus and legibility. It leverages a "Scholarly Minimalist" approach: heavy use of whitespace to prevent cognitive overload, combined with rich, deep teal backgrounds for immersive focus modes and terracotta accents to highlight progress and calls to action. The emotional response should be one of quiet confidence, encouragement, and intellectual prestige.

## Colors

The palette is anchored by **Deep Teal (#17363B)**, which serves as the primary "Institutional" color, used for headers, primary buttons, and immersive backgrounds to evoke stability and depth. **Terracotta (#EC5238)** is the "Active" color, used sparingly for motivational cues, progress indicators, and primary CTAs to provide warmth and energy.

A **Rich Brown (#8B572A)** is utilized for secondary accents and iconography, grounding the design in a manuscript-inspired aesthetic. The neutral foundation is a **Warm Bone (#F9F7F2)** rather than pure white, reducing eye strain during long reading sessions and enhancing the "premium paper" feel of the interface.

## Typography

Typography uses a sophisticated pairing to balance Latin and Arabic scripts. **Source Serif 4** provides an authoritative, academic weight to headings, mimicking the structure of high-end editorial journals. **Be Vietnam Pro** is used for interface elements and body text for its exceptional legibility and friendly, contemporary tone.

For Arabic content, **Noto Serif** (Naskh style) is mandatory. It ensures that diacritics (Tashkeel) are rendered with perfect clarity, which is critical for learners. Arabic text should generally be set 20-30% larger than its Latin counterpart to maintain equivalent visual weight and legibility.

## Layout & Spacing

The layout follows a **Fluid Content Model** optimized for mobile-first interaction. Content is housed within a central container with 20px side margins to ensure readability on all device widths. 

A strict 8px baseline grid governs vertical rhythm. Elements are grouped using generous "breathing room" (24px to 40px) to maintain the premium, uncluttered feel. For instructional screens, use a single-column layout to drive focus; for vocabulary grids, use a 2-column pattern with 16px gutters.

## Elevation & Depth

This design system utilizes **Tonal Layering** supplemented by **Ambient Shadows**. Instead of heavy drop shadows, depth is communicated through subtle shifts in background saturation. 

- **Surface 0 (Base):** Warm Bone (#F9F7F2).
- **Surface 1 (Cards):** Pure White with a 4% Deep Teal shadow (blur 12px, y-offset 4px) to create a "lifted paper" effect.
- **Surface 2 (Modals/Overlays):** Pure White with an 8% Deep Teal shadow (blur 24px, y-offset 8px).

Interactive elements use a soft inner glow when pressed to simulate physical tactile feedback without appearing dated.

## Shapes

The shape language is **Rounded**, using a 0.5rem (8px) base radius. This softens the academic seriousness of the typography, making the app feel more accessible and less intimidating. 

- **Standard Buttons & Inputs:** 8px (Rounded)
- **Course Cards & Progress Containers:** 16px (Rounded-LG)
- **Featured Banners & Hero Modules:** 24px (Rounded-XL)
- **Selection Chips:** Fully rounded (Pill-shaped) to distinguish them from actionable buttons.

## Components

### Buttons
Primary buttons use the Deep Teal (#17363B) with White text for high authority. Secondary "Success" or "Correct Answer" actions use Terracotta (#EC5238). All buttons feature a subtle 2px bottom border of a slightly darker shade to give a "pressable" tactile feel.

### Cards
Lesson cards should have a White background, the 16px radius, and a thin 1px border in a muted version of the Deep Teal (10% opacity) to define edges against the Bone background.

### Input Fields
Inputs use a White fill with an 8px radius. The active state is indicated by a 2px Terracotta border and a soft glow. Labels should always be visible above the field in **label-md** styling.

### Progress Indicators
Use a "Track and Fill" system. The track is a light Teal (20% opacity) and the fill is a solid Terracotta. This provides a high-contrast visual of the user's journey against the scholarly background.

### Specialized Arabic Components
- **Word Tiles:** Used in sentence building. These should be larger than standard buttons, using Noto Serif at 24px, with ample padding (16px) to ensure diacritics aren't clipped.
- **Root-Word Tooltips:** Floating cards with a Deep Teal background and White text to provide etymological context.