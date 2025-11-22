# TecniFlux Design Guidelines

## Design Approach
**Reference-Based**: Drawing inspiration from automotive/technical interfaces (Tesla's UI, Rivian's dashboard, BMW iDrive) combined with modern SaaS applications like Linear and Vercel for clean technical aesthetics.

## Brand Colors (Mandatory - User Specified)
- **Primary**: Electric Blue `#2E8BFF`
- **Secondary**: Neon Cyan `#18E0FF`
- **Background**: Graphite Gray `#1E1F24`
- **Text**: White `#FFFFFF`
- **Supporting**: Dark variants of background (`#151619`, `#282A30`) for depth, subtle blue glows for emphasis

## Typography
- **Primary Font**: Inter (via Google Fonts) - clean, technical, modern
- **Headers**: 600-700 weight, tracking tight (-0.02em)
- **Body**: 400-500 weight, slightly increased line height (1.6)
- **Monospace**: JetBrains Mono for VIN numbers, technical codes
- **Scale**: Mobile base 14px, Desktop base 16px, H1: 3-4rem, H2: 2-2.5rem, H3: 1.5-2rem

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Component padding: `p-6` to `p-8`
- Section spacing: `py-16` to `py-24`
- Card gaps: `gap-4` to `gap-6`
- Container max-width: `max-w-7xl`

## Core UI Components

### Navigation
- Fixed top navigation with semi-transparent background + backdrop blur
- Logo left, role badge (Admin/Technician) and user menu right
- Mobile: Hamburger menu with slide-in drawer
- Active states: Electric Blue underline or glow effect

### Cards & Containers
- Dark background (`#282A30`) with subtle border in Electric Blue (opacity 20%)
- Rounded corners: `rounded-lg` (8px)
- Hover: Lift effect with subtle blue glow shadow
- PDF result cards: Thumbnail preview (if available), metadata grid, prominent "View Diagram" button

### Forms & Inputs
- Dark input backgrounds with Electric Blue focus rings
- VIN input: Monospace font, uppercase transform, character counter (17/17)
- Dropdowns: Custom styled with blue accent on selected items
- Search bar: Prominent with icon, rounded full, blue glow on focus

### Buttons
**Primary (Electric Blue)**: Main CTAs - solid background, white text, subtle glow on hover
**Secondary (Neon Cyan)**: Supporting actions - outline style, cyan border/text
**Ghost**: Text-only with hover background fade-in
**Scan/Camera buttons**: Large, icon-prominent with blue gradient background

### Scanner/Camera Interface
- Full-screen overlay with semi-transparent dark background
- Camera viewfinder: Blue corner brackets UI (like automotive parking cameras)
- Scanning animation: Pulsing cyan line sweeping effect
- Status indicators: Top center with blue/cyan accents

### PDF Viewer
- Dark chrome with blue accent toolbar
- Controls: Zoom, download, fullscreen - icon buttons with cyan hover
- Floating toolbar that auto-hides on scroll
- Full-bleed viewer on mobile, sidebar with metadata on desktop

### Admin Panel
- Split layout: Sidebar navigation (left) + content area (right)
- Data tables: Striped rows with cyan highlights on hover
- Edit mode: Inline editing with blue input borders
- Refresh button: Prominent with loading spinner animation

## Page-Specific Layouts

### Login/Signup
- Centered card (`max-w-md`) with dark background
- TecniFlux logo at top with blue glow effect
- Form fields stacked, generous spacing
- Social proof: "Trusted by 1000+ technicians" with cyan accent

### Home Dashboard
- Hero: Compact header with gradient overlay (graphite to transparent)
- Quick action cards grid: 2x2 on desktop (Manual Search, VIN Search, Scan VIN, Recent Diagrams)
- Each card: Icon, title, description, prominent CTA
- Stats bar: Document count, recent searches (horizontal on desktop, stacked on mobile)

### Search Results
- Filter sidebar (desktop left, collapsible on mobile)
- Results grid: 2-3 columns on desktop, single column mobile
- Each result: Make/Model/Year prominent, system tag (cyan badge), view button (blue)
- Empty state: Illustration suggestion placeholder with helpful search tips

### VIN Decode Flow
1. Input screen: Large VIN input field centered, three method tabs (Manual, Scan, Photo)
2. Scanning screen: Full camera interface with blue brackets
3. Results screen: Decoded info in card format, matching diagrams below

## Visual Enhancements
- **Gradients**: Subtle blue-to-cyan gradients on headers and CTA backgrounds
- **Glows**: Blue box-shadow glow effects on interactive elements (use sparingly)
- **Grid patterns**: Subtle dot grid background on hero sections (very low opacity)
- **Icons**: Heroicons for all UI elements - use outline style for inactive, solid for active states
- **Animations**: Minimal - fade-ins on page load, smooth transitions on hovers (150-200ms), loading spinners with blue gradient

## Images
**Hero Images**: NOT APPLICABLE - This is a technical tool, use abstract automotive-themed patterns or code-like backgrounds instead
**VIN Label Examples**: Show example VIN label photo in OCR instruction screen
**Empty States**: Simple illustrations in blue/cyan line art style

## Accessibility
- High contrast white text on dark backgrounds
- Focus indicators: 2px Electric Blue outline with offset
- All interactive elements: Min 44x44px touch targets
- Screen reader labels for all icon-only buttons

## Mobile Optimizations
- Bottom navigation bar for primary actions on mobile
- Swipe gestures for scanner and viewer
- Large touch targets for camera capture
- Collapsible filters with floating action button
- Single-column layouts throughout