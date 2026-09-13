# Coach Performance Hub — Design Spec

## Goal
Redesign `coach.html` into a premium, multi-sport coaching and performance hub that feels broader than the dedicated volleyball section while preserving the existing infinite learning feed and topic pages.

## Product Positioning
The Coach area is not a second volleyball page. It is a broad coaching environment focused on psychology, motor learning, explosive performance, coaching language, decision making, leadership, practice design, and coach-athlete interaction. Volleyball remains one relevant domain and has a clear separate entry point to `volleyball.html`.

## Visual Direction
Use a hybrid visual language:
- Premium, dramatic photography in hero and major section imagery.
- Authentic training photography inside learning content.
- Dark charcoal / near-black for major visual surfaces.
- Warm white / cream for reading surfaces.
- Performance green as the primary accent.
- Rounded corners remain, but the overall look should feel more like a professional performance lab than a playful dashboard.
- Maintain strong contrast, readable Hebrew RTL typography, and restrained image use.

## Image Strategy
Use real training imagery, not generated imagery.

The image mix should be multi-sport and broad:
- coach-athlete conversation
- strength and conditioning
- plyometrics / jumping
- sprinting / acceleration
- movement and change of direction
- team briefing
- observation / analysis
- youth and adult sport environments
- selected volleyball imagery only where relevant

Hero and topic-card images should feel premium and editorial. Feed images should feel more natural and authentic. Not every feed card gets an image; imagery should support the content rather than become visual noise.

## Page Structure

### 1. Hero
A large, high-impact opening section with a premium training image and dark overlay.

Content:
- title: `מאמן`
- primary line: `ללמוד. לראות. להוביל.`
- short supporting text describing psychology, movement, performance, and coaching communication
- primary CTA: `התחל ללמוד`
- secondary CTA: `🏐 מרכז הכדורעף`

The primary CTA scrolls to the learning/topic area. The volleyball CTA links to `volleyball.html`.

### 2. Six Coaching Worlds
Replace the current small chip-first experience at the top with six large visual topic cards that link to the already-existing dedicated pages:

1. פסיכולוגיה של הספורט — coach-athlete one-to-one interaction
2. פסיכולוגיית אימון — feedback during practice
3. פסיכולוגיה של תנועה — movement / change of direction
4. כוח מתפרץ — jump, sprint, or plyometric action
5. שפת אימון — team briefing or active coach communication
6. גישות לכדורעף — volleyball training image

Each card includes:
- image
- topic title
- one-line description
- direct link to the corresponding existing topic page

Desktop: 3x2 grid.
Mobile: compact visual cards in two columns or horizontal overflow where required for readability.

### 3. What Will We Learn Today
A small dynamic bridge section before the infinite feed.

It surfaces three concise items from the existing coach content pool:
- one principle / concept
- one practical coaching idea
- one question or scenario

The items may rotate per visit or refresh without creating a separate data source.

### 4. Coach Feed
Keep the existing infinite feed engine and question behavior.

Redesign cards for stronger hierarchy:
- cleaner metadata
- stronger title typography
- evidence-strength badge where relevant
- expandable `ליישום באימון` remains interactive
- question cards remain visually distinct
- selected cards may receive a contextual wide image

Image frequency target: approximately one visual card every 3–5 feed cards, not every card.

### 5. Coach Challenge
Introduce a visually distinct dark challenge card that can appear in the content stream.

A challenge presents a realistic coaching scenario, for example:
- athlete loses confidence
- team stops listening
- player becomes frustrated after repeated errors
- substitute disengages

The user chooses an option and receives a concise professional analysis, using the same interaction model as current coach questions where possible.

### 6. Take It to the Next Practice
A practical module labeled `לקחת לאימון הבא` that surfaces one immediately usable item:
- phrase to use
- question to ask an athlete
- small drill adjustment
- cue
- observation target

This should feel like the bridge from theory to tomorrow's practice.

### 7. Navigation
Keep site-level bottom navigation.

Add a lightweight Coach-specific navigation experience that makes the six domains and volleyball entry easy to reach without creating a heavy desktop menu. Existing topic links must continue to work directly.

### 8. Topic Pages
The six dedicated topic pages continue using the shared infinite-feed engine.

They should inherit the refreshed visual language so the transition from Coach home to a topic page feels consistent. The home page may have richer imagery, while topic pages remain more reading-focused.

## Responsive Behavior
Mobile is a first-class layout:
- hero remains visually strong without obscuring text
- topic cards become compact and touch-friendly
- no horizontal page overflow
- feed remains single-column
- images use responsive aspect ratios and `object-fit: cover`
- interactive controls retain comfortable touch targets

## Accessibility
- All content imagery must have meaningful `alt` text where informative; decorative images use empty alt text.
- Overlay text must meet strong contrast standards.
- Buttons and links remain keyboard accessible.
- Interactive expansion controls retain `aria-expanded` behavior.
- Existing question interactions must remain operable without relying on color alone.

## Performance
- Avoid loading a large number of full-resolution images at once.
- Use remote image URLs only from stable, permitted sources or committed local assets.
- Below-the-fold images should use lazy loading where possible.
- Preserve the current lightweight static-site architecture; no new framework or runtime dependency.

## Functional Constraints
- Preserve infinite feed behavior.
- Preserve six fixed topic pages.
- Preserve question/answer interactions.
- Preserve expandable `ליישום באימון`.
- Preserve the separate volleyball center.
- Do not turn the Coach area into a volleyball-first page.
- Do not generate AI imagery for this redesign.

## Success Criteria
The finished Coach home should immediately communicate professional coaching and performance, feel visually premium, and remain fast to scan and comfortable to read. It must clearly distinguish itself from the volleyball center while still connecting to it, and all existing Coach learning behavior must continue to work.
