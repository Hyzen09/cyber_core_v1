---
name: Ethereal Logic
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#434656'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#5d5e61'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e5'
  on-secondary-container: '#636467'
  tertiary: '#952200'
  on-tertiary: '#ffffff'
  tertiary-container: '#bf3003'
  on-tertiary-container: '#ffddd5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#e2e2e5'
  secondary-fixed-dim: '#c6c6c9'
  on-secondary-fixed: '#1a1c1e'
  on-secondary-fixed-variant: '#454749'
  tertiary-fixed: '#ffdbd2'
  tertiary-fixed-dim: '#ffb4a1'
  on-tertiary-fixed: '#3c0800'
  on-tertiary-fixed-variant: '#891e00'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 24px
  margin: 32px
---

## Brand & Style

The design system is rooted in **Modern Minimalism** with a focus on **Professional Sleekness**. It transitions away from the raw, neon-heavy aesthetics of the reference image toward a refined, high-end productivity tool. The core objective is to reduce cognitive load through generous whitespace, a monochromatic base, and strategic use of a singular "Electric Blue" accent to guide user focus.

The visual mood is calm, precise, and authoritative. It utilizes "Flat Design Plus"—a style that prioritizes flat surfaces but employs subtle, ambient shadows to establish a clear functional hierarchy. This approach ensures the interface feels tactile and premium without becoming visually cluttered.

## Colors

The palette is anchored by **Crisp Whites** and **Architectural Greys**. 

- **Primary Action:** "Electric Blue" (#0052FF) is used exclusively for primary calls to action, active states, and critical notification badges.
- **Surface Strategy:** We use a tiered grey scale for depth. Backgrounds are pure white, while sidebars and secondary containers use a soft light grey to create distinct zones of activity.
- **Contrast:** Typography maintains a high contrast ratio against backgrounds to ensure readability, using a deep charcoal instead of pure black to reduce eye strain during long sessions.

## Typography

The design system utilizes **Inter** for its exceptional legibility and systematic feel. 

- **Hierarchy:** We use weight (SemiBold to Bold) rather than excessive size shifts to indicate hierarchy, maintaining a compact and professional look.
- **Readability:** Body text is set with a comfortable line-height (1.5x) to ensure long chat logs are easy to scan.
- **Labels:** Small caps with increased letter spacing are reserved for metadata, such as timestamps and sidebar category headers, mimicking an editorial aesthetic.

## Layout & Spacing

This design system follows a **Fixed-Fluid Hybrid** model. The sidebar remains at a fixed width (280px) to provide a stable anchor, while the chat window is fluid, expanding to fill the remainder of the viewport.

- **Rhythm:** A strict 4px grid governs all spatial relationships.
- **Message Density:** We prioritize "Generous" spacing. Chat bubbles have 12px internal padding and 16px vertical gaps between different speakers to emphasize clarity.
- **Breakpoints:**
  - **Desktop (1024px+):** Full three-pane view (Sidebar, Thread List, Chat).
  - **Tablet (768px - 1023px):** Sidebar collapses into a drawer; Thread List and Chat remain visible.
  - **Mobile (<767px):** Single pane view with a bottom navigation bar for quick access to channels and settings.

## Elevation & Depth

Visual hierarchy is established through **Ambient Shadows** and **Tonal Layering**.

- **Level 0 (Base):** Pure white background for the main chat canvas.
- **Level 1 (Surface):** Light grey (#F1F3F5) for the sidebar and inactive message bubbles. This creates a clear distinction between the "tool" area and the "content" area.
- **Level 2 (Float):** Used for the message input area and pop-overs. These elements utilize a very soft, highly diffused shadow (0px 4px 20px rgba(0,0,0,0.05)) to suggest they sit above the conversation.
- **Level 3 (Overlay):** Modals and dropdown menus use a more pronounced shadow with a slight tint of the primary blue in the shadow's umbra to maintain brand consistency.

## Shapes

The shape language is defined by **Soft Geometricism**. 

- **Standard Radius:** 8px for smaller components like buttons and input fields.
- **Container Radius:** 16px (rounded-lg) for message bubbles and cards, creating a friendly but professional "squircle" feel.
- **Avatars:** Strictly circular to contrast against the predominantly rectangular UI elements.
- **Input Area:** The message bar uses a 12px radius to feel distinct from the messages it generates.

## Components

### Message Bubbles
- **Recipient:** Light grey background, no border, charcoal text. Aligned left.
- **Sender:** Electric Blue background, white text. Aligned right. 
- **Grouping:** Consecutive messages from the same user have reduced vertical spacing (4px) and only the final bubble in the group shows the timestamp.

### Input Area
- **Style:** A floating horizontal bar at the bottom of the chat. 
- **Details:** 1px subtle border (#E1E4E8), soft ambient shadow. Icons for attachments and emojis are rendered in a medium-grey outline style, turning Electric Blue on hover.

### Buttons
- **Primary:** Solid Electric Blue with white text. 8px rounded corners.
- **Secondary:** Ghost style (transparent background) with a 1px grey border.
- **Tertiary/Icon:** No background, charcoal icon, subtle grey circular background on hover.

### Sidebar
- **Navigation:** Vertical list with high-contrast active states (Electric Blue left-border indicator and a subtle light-blue background tint for the active item).
- **Refinement:** Section headers are in the `label-caps` typography style for clear organization.

### Chips/Badges
- **Status Indicators:** Small 8px circles. Green for online, Grey for offline, Blue for "Typing...".
- **Unread Count:** Circular pill, Electric Blue background, bold white text, positioned at the right extremity of thread items.
