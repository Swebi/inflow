# Inflow — design & product notes

## What this is

Inflow is a Gmail extension side panel. It locally detects likely-actionable
emails, surfaces a task/event suggestion for review, and only calls the LLM
when the user reviews/structures an item. It's an intelligence _layer_ on
top of Google Calendar/Tasks — not a replacement productivity suite, and not
a fully autonomous agent. The user stays in the loop on purpose. Copy and UX
should reflect "here's what I found, you decide" — not "handled for you."

## Surface constraints

This renders inside a Chrome side panel, roughly 380–420px wide, often open
alongside Gmail for long stretches. Design for a narrow, tall, persistently-
visible pane, not a marketing page:

- Vertical space is the scarce resource. Don't spend it on decorative hero
  blocks (e.g. a giant clock) — the user's already looking at their own
  clock in the OS menu bar.
- Nothing should use `position: fixed` relative to the viewport in a way
  that can overlap scrollable content. If something needs to float (FAB,
  toast), anchor and pad the scroll container so it never sits on top of
  the last item.
- This is a working tool used many times a day. Optimize for fast scanning
  over first-impression polish.

## Visual direction for this project

Light mode, intentional and minimal rather than decorative. Closest
references, given this is an email/calendar/task tool specifically:

- **Superhuman** — light-mode email client, extremely restrained chrome,
  one accent used sparingly, generous whitespace, nothing decorative
  competing with the content.
- **Notion Calendar (formerly Cron)** — light calendar UI, soft neutral
  surfaces, a single accent color per event/category rather than a rainbow,
  compact but legible list rows.
- **Fantastical** — calendar/task app, light theme, warm but restrained
  color use, clear typographic hierarchy without heavy borders everywhere.
- **Things 3** — task manager, light mode, near-monochrome UI with color
  used only for a small number of meaningful states (today, flagged), not
  for decoration.

Within that:

- **One real accent color, defined once as a token, used everywhere it means
  "this needs you" (primary CTA, pending/needs-review state).** Everything
  else is neutral (slate). Status colors (success green, error red) are
  reserved for actual success/error states, not for "this is pending" —
  pending isn't a warning.
- No more than one shade of gray family per surface. Don't mix `gray-*` and
  `slate-*` in the same app — pick one and use it everywhere.
- One icon system. Pick either the custom SVG assets or `lucide-react`, not
  both for equivalent concepts (calendar/task icons vs. lucide icons like
  `X`, `LogOut`, `RefreshCw`). Mixed icon systems read as unfinished.
- Card titles wrap (2-line clamp), never hard-truncate mid-word.
- Dates render in one consistent human format across every surface (e.g.
  "Sep 24"), not a mix of `dd.MM.yyyy` and locale month/day strings.
- Borders/backgrounds signal _category_, not decoration — if every card in
  a list has the same accent border, the border isn't telling the user
  anything; let section grouping (a heading) carry that instead, and
  reserve color for what's actually differentiated within the list.
- Sentence case on all UI copy and headings ("Sign in", not "Sign In").
- Prefer wrapping/showing full context (sender, source email) over cropping
  it — the whole value of a suggestion card is _why it was surfaced_.

## Signature moves from other work — what applies here

A design-taste profile drawn from other projects (TalentLens, Placement
Atlas, RoundZero, Ionio, personal portfolio) is saved to memory/Notion.
Recurring patterns across all of them, and how they map onto Inflow's
light, restrained direction:

- **Type pairing**: every one of these projects contrasts a headline/body
  face with a monospace face used specifically for labels, meta text,
  numbers, and small UI chrome — never one generic sans doing every job.
  Apply this to Inflow's type system: body/title in the main sans, but
  dates, category labels, and counts in a monospace face.
- **Colored dot + label for status/category**, preferred over a filled
  badge/pill (seen in RoundZero's "• Super Dream", Placement Atlas's
  "• STATIC ARCHIVE"). Use this instead of a filled badge chip for the
  `kind` field on pending-action cards.
- **A consistent identity anchor** — logo/wordmark or colored avatar,
  placed identically on every screen. Inflow already has this right
  (the colored avatar, restored per user request) — keep it exactly as is.
- **Hairline borders over heavy shadows**, one accent color used only for
  CTAs/active-states/key data, rounded-pill buttons — all already the
  direction established for this project; these projects confirm it's
  the right call, not something to second-guess.
- **Small, genuinely polished widget details** as craft signals (their
  portfolio's real clock/map/contribution-graph). For Inflow, the
  date/today strip is the equivalent opportunity — it should feel like a
  crafted small widget, not an administrative row.
- Not applicable here: serif display headlines, italic emphasis, numbered
  01/02/03 section labels, warm cream backgrounds — those are the more
  editorial/marketing-site register and don't fit a dense utility panel.

The "needs review" cards currently carry too much weight for a list that
can run 15-20+ items and gets scanned repeatedly. Tighten:

- Title: smaller/lighter than it is now — it's currently competing with
  the header for boldness. It's a list item, not a headline.
- Description: 1 line by default, not 2 — most of the value is in the
  title + date + badge; the description is supporting detail.
- Buttons: reduce height and padding on Calendar/Task — they're currently
  the single biggest space cost per card. Consider whether icon + label at
  a smaller size, or a more compact control, still reads clearly.
- Card padding: reduce on all sides; make sure the gap _between_ cards is
  visibly smaller than the padding _inside_ a card, so grouping is legible.
- Badge labels: normalize to short, consistent text (e.g. "Login",
  "Deadline", "Event", "Promo") — currently ranges from one word to three
  and wraps awkwardly at that length.

## Header / logout

Logout should not live in the main header — it's not something the user
needs "in their face" on every open. Move it into the settings drawer as a
menu item/button there instead. The header should just be the wordmark,
greeting, and avatar; tapping the avatar (or a settings icon) opens the
drawer where logout lives.

## Corrections — two things that got wrongly stripped out

The last two passes over-applied "restraint" to two things that were
actually working:

- **The avatar.** The original colored (teal-to-pink) avatar was a good
  personality touch — don't flatten it to a plain gray circle with an
  initial. Bring it back. The earlier note about it "introducing a color
  outside the accent system" was about it clashing with an overly-busy
  card list, not about the avatar itself being wrong — now that cards are
  calm, a bit of personality in one small, contained spot (the avatar) is
  good, not noise.
- **The Google Calendar / Google Tasks icons.** The real Google-brand
  icons (not generic lucide calendar/list icons) should stay on the
  Calendar/Task action buttons specifically — they're identifying actual
  Google products the user is sending data to, so using their real marks
  there is correct, not inconsistent. "Pick one icon system" still applies
  to everything else (chrome icons like close/back/refresh/logout) — use
  lucide-react for those — but the two Google action icons are the
  exception, not part of that cleanup.

## Why it still reads as a prototype, not a product

Structure and restraint are right now — but restraint alone reads as a UI
kit default, not a finished product. What's missing is _identity_:

- **No real type system.** Headline and body weight barely differ, no
  distinct style for metadata/labels vs. content. Give the app 3–4 clear
  type roles (e.g. headline, body, label/caption, muted) with a deliberate
  size + weight + color for each, and use them consistently everywhere —
  not just whatever a default heading tag gives you.
- **No surface hierarchy.** Page background, header, date card, and every
  list card are the same white rounded rectangle nested inside each other.
  Differentiate levels — e.g. page bg is a soft neutral, cards are pure
  white with a subtle shadow instead of (or in addition to) a border, so
  there's a visible "surface" distinction between page and content.
- **Category/kind labels are raw data, not designed elements.** Things like
  "Release", "Deadline", "Delivery" currently render as plain text after a
  date. Turn these into small styled badges/tags with their own visual
  treatment, not concatenated metadata text.
- **Buttons look like unstyled defaults.** Give Calendar/Task real button
  states (hover, active/pressed) and tighten them — right now they read as
  a UI-kit default with no crafted interaction feel.
- **No brand mark.** There's no wordmark, icon, or signature visual motif
  anywhere in the panel — nothing makes this recognizably _Inflow_ instead
  of a generic list-of-cards app. Even something small and consistent (a
  simple mark next to "Good afternoon," or in place of the puzzle-piece
  extension icon) helps a lot here.
- **Content quality undermines trust independent of visuals.** Low-signal
  items (a game release announcement, a food-delivery confirmation) sitting
  in "Needs review" next to a genuine deadline make the list feel like an
  unfiltered extraction dump rather than a curated assistant. This is a
  product/extraction issue, not a UI one, but it's worth raising because it
  actively works against the "finished product" feeling — no amount of
  visual polish fixes a list that includes things nobody asked to review.

## Regressions from the first pass — don't repeat these

The first redesign pass made things louder, not calmer. Specific mistakes
to avoid:

- **Don't give every card a background color wash.** A tinted fill applied
  uniformly to every item in a list stops meaning anything — same failure
  as the original amber borders, just recolored. Cards stay on plain
  white/neutral with a thin border or none; reserve color for the one or
  two states that are actually different from the rest.
- **Don't make one of two equal-weight actions (Calendar/Task) a solid
  filled button.** They're both just "where does this go," not a
  primary/secondary pair. A solid black pill repeated down a 20-item list
  is the loudest thing on the screen. Both should be outlined/ghost,
  equal weight.
- **Don't split one line of text into two colors/weights** (e.g. "Good
  afternoon," muted + "Suhayb" bold black) without a functional reason.
  Greetings and other low-stakes text stay one consistent treatment.
- **The FAB overlap bug came back after a "fix."** Verify by scrolling to
  the actual end of a long list, not just checking the component code —
  confirm nothing renders under the button at any scroll position.

## Known trouble spots in the current build (as of this pass)

- `DateTimeCard.tsx` — three redundant renderings of "now" (big date block,
  big clock, day-name/count row) plus a date-picker pill row. Should
  collapse to one compact row.
- No real `--accent` is defined in `assets/tailwind.css` (it's set to the
  same flat gray as `--muted`) — so components reach for ad hoc colors:
  amber borders (`PendingActionCard`, `EventsList` error banner), blue
  (`GoogleConnectBanner`, `EventEditDrawer` focus rings, success banner in
  `EventsList`), near-black slate (buttons, active tab states). Fix at the
  token level, not per component.
- `PendingActionCard.tsx` title uses `truncate` — causes mid-word ellipsis
  on longer titles. Should be `line-clamp-2`.
- `FloatingActionButton.tsx` uses `fixed bottom-6 right-6` with no
  scroll-aware spacing below it — it visibly overlaps the last card in a
  long list.
- Date formatting is inconsistent: `DateTimeCard` shows "Aug 26" style,
  `PendingActionCard`/`EventCard` show raw stored `dd.MM.yyyy` strings.
- `SignIn.tsx` / `SignUp.tsx` / `ProtectedRoute.tsx` use `gray-*` classes
  while the rest of the app uses `slate-*` — same intended color, two
  different Tailwind palettes, so they render as (very slightly) different
  colors than the rest of the app.
- Auth pages ("Sign In", "Sign Up") and generic drawer copy don't follow
  sentence case; worth a copy pass alongside the visual one.

## Non-goals for this pass

- Don't change the "Needs review" vs. "Recents/Calendar/Tasks" structure —
  that split (pending suggestions vs. resolved history) is correct and
  should stay.
- Don't add a dark mode toggle for this project right now.
