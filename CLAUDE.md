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

## Full revamp — current direction (supersedes everything below)

After several rounds of incremental component-level patches that didn't
visibly move the needle, the decision is to redesign the visual layer from
scratch rather than keep adjusting individual Tailwind classes. Everything
under "Historical context" below is background on what was tried and why
it didn't stick — not a punch list to keep working through piecemeal.

The approach: define the design system once — typography, color tokens,
spacing scale, component styles — then rebuild the UI against it, rather
than tweaking what's already there. Structure and IA stay the same (Needs
review / Recents-Calendar-Tasks split, the settings drawer, FAB, avatar);
the visual execution gets replaced, not nudged.

Still light mode, still the Superhuman/Notion Calendar/Fantastical/Things 3
register described below — the revamp is about actually building a system
instead of patching defaults, not about changing the overall direction.

### Typography

No font is currently chosen deliberately — it falls back to a default
system/Inter-ish stack, which is a large part of why this hasn't felt
designed. Pick, on purpose:

- **Geist** for headlines and body text.
- **Geist Mono** for dates, category labels, counts, and other meta/UI
  chrome text — matching the type-pairing pattern that shows up in every
  other project referenced under "Signature moves" below.

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
  `X`, `LogOut`, `RefreshCw`). Mixed icon systems read as unfinished. The
  real Google Calendar/Google Tasks icons are the one deliberate exception —
  keep those on the Calendar/Task action buttons specifically.
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

## Signature moves from other work

A design-taste profile drawn from other projects (TalentLens, Placement
Atlas, RoundZero, Ionio, personal portfolio) is saved to memory/Notion.
Recurring patterns across all of them, and how they map onto Inflow's
light, restrained direction:

- **Type pairing**: every one of these projects contrasts a headline/body
  face with a monospace face used specifically for labels, meta text,
  numbers, and small UI chrome — never one generic sans doing every job.
  This is the basis for the Geist/Geist Mono decision above.
- **Colored dot + label for status/category**, preferred over a filled
  badge/pill (seen in RoundZero's "• Super Dream", Placement Atlas's
  "• STATIC ARCHIVE"). Already applied to the `kind` field on pending-
  action cards — keep this pattern.
- **A consistent identity anchor** — logo/wordmark or colored avatar,
  placed identically on every screen. Inflow already has this right
  (the colored avatar) — keep it exactly as is.
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

## Non-goals

- Don't change the "Needs review" vs. "Recents/Calendar/Tasks" structure —
  that split (pending suggestions vs. resolved history) is correct and
  should stay.
- Don't add a dark mode toggle for this project right now.

---

## Historical context — what was tried before the full revamp

The notes below record earlier incremental attempts and what went wrong
with each. Kept for context; superseded by "Full revamp" above.

### Card density (didn't visibly land after two attempts)

- Title was asked to be smaller/lighter — it was competing with the header
  for boldness.
- Description should default to 1 line, not 2.
- Calendar/Task buttons were asked to be shorter (less height/padding) —
  this was the single biggest space cost per card and never visibly
  changed across two rounds of "reduce padding"-style requests.
- Card padding was asked to reduce on all sides, with the gap _between_
  cards smaller than the padding _inside_ a card.
- Badge labels were asked to normalize to short, consistent text.

### Why it read as a prototype, not a product

- No real type system — headline and body weight barely differed.
- No surface hierarchy — page background, header, date card, and every
  list card were the same white rounded rectangle nested inside each
  other.
- Category/kind labels were raw concatenated text before becoming a
  dot+label pattern.
- Buttons read as unstyled defaults with no crafted interaction states.
- No brand mark anywhere in the panel.
- Content quality (low-signal items like game releases or food-delivery
  confirmations sitting in "Needs review" next to genuine deadlines)
  undermines trust independent of any visual work — a product/extraction
  issue, not UI, but worth remembering since polish alone won't fix it.

### Regressions from the first redesign pass — avoid repeating

- Giving every card a background color wash (a tinted fill applied
  uniformly stops meaning anything — same failure as the original amber
  borders, just recolored).
- Making one of two equal-weight actions (Calendar/Task) a solid filled
  button — both are just "where does this go," not primary/secondary.
- Splitting one line of text into two colors/weights without a functional
  reason (e.g. "Good afternoon," muted + "Suhayb" bold).
- The FAB overlap bug returning after a claimed fix — verify by actually
  scrolling to the end of a long list, not just reading the component code.

### Known code-level issues as of the last review

- `DateTimeCard.tsx` previously had three redundant renderings of "now"
  (big date block, big clock, day-name/count row) plus a date-picker pill
  row.
- No real `--accent` was defined in `assets/tailwind.css` (it matched
  `--muted`), so components reached for ad hoc colors — amber, blue,
  near-black slate in different places for what should've been one token.
- `PendingActionCard.tsx` title used `truncate` (mid-word ellipsis) instead
  of `line-clamp-2`.
- `FloatingActionButton.tsx` used `fixed bottom-6 right-6` with no
  scroll-aware spacing, causing it to overlap the last card in long lists.
- Date formatting was inconsistent — `DateTimeCard` used a friendly format
  while card components showed raw stored `dd.MM.yyyy` strings.
- `SignIn.tsx` / `SignUp.tsx` / `ProtectedRoute.tsx` used `gray-*` classes
  while the rest of the app used `slate-*`.
- Auth pages and drawer copy didn't consistently follow sentence case.
