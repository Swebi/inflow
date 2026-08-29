# Inflow — design & product notes

## What this is
Inflow is a Gmail extension side panel. It locally detects likely-actionable
emails, surfaces a task/event suggestion for review, and only calls the LLM
when the user reviews/structures an item. It's an intelligence *layer* on
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

## Bold creative reset (supersedes "Full revamp" above)
Confirmed: the build/load pipeline is not the problem (fresh builds were
loading correctly) — the changes were real but too conservative to read
as different. Six+ rounds of resizing the same buttons and swapping the
same font-family on the same boxed-card structure produced no visible
difference, because the structure itself never changed. Permission
granted to change color palette, fonts, and layout structure more freely
than previous notes implied — don't stay anchored to "light, restrained,
Superhuman-esque" if a bolder direction serves the product better.
Concrete decisions for this pass:
- **Row list instead of boxed cards.** Replace the repeated
  border+padding+two-full-width-buttons card pattern with a denser list
  row: a colored accent bar on the left (not a full card border), title
  + meta on one compact line, actions as small icon-only buttons rather
  than full pill buttons on every row. This is the single biggest lever —
  it changes what the whole list *looks like* at a glance, independent of
  color or font.
- **A real accent color — terracotta/rust**, not another blue. This
  already matches the accent on the personal portfolio site referenced
  under "Signature moves" below, so it's consistent with existing taste,
  not arbitrary.
- **A warm ivory/cream page background**, not the cool pale gray-blue
  used throughout every previous iteration (matches Placement Atlas's
  background choice, referenced below).
- **Real typographic contrast**: section headers ("Needs review") in a
  serif or a heavier display weight, not just body-weight Geist — genuine
  contrast against the compact mono used for meta/labels, the way
  TalentLens contrasts serif headlines against mono labels.
- Geist Mono stays for dates/labels/counts — that part landed fine and
  isn't the problem.

## Full revamp — prior direction (superseded by the reset above)
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

### Interaction model (supersedes the flat vertical list)
The "Needs review" list becomes a **card stack**, using the pattern from
https://reactbits.dev/components/scroll-stack (copy-paste source, adapt
into this codebase — check what animation dependency it needs, likely
GSAP or Framer Motion, and add it) instead of a plain scrolling list of
identical white boxes. Cards stack with the front one in focus and the
rest receding/scaled-down behind it, advancing as the user scrolls — this
is also the fix for "no hierarchy": the stack position *is* the hierarchy.

**Tapping/clicking the front card** opens a detail modal/sheet with the
full title, full description (not truncated), the date, and the category.
At the bottom of that modal: three actions — **Skip**, **Task**,
**Calendar** — styled as a tinder-style action row, not the current plain
outlined-pill pair.

**Swipe gestures on the modal/card** (touch or trackpad-drag):
- Swipe left → Skip/dismiss (same as the X today).
- Swipe right → the primary quick-action. Since there are two possible
  positive actions (Calendar/Task) and swipe is inherently binary, treat
  swipe-right as the *more common* one (Calendar) as a fast path, and keep
  the explicit Task button in the modal for the other case. Don't try to
  encode three outcomes into one gesture axis — that's overloading it.
- Give the swipe real physical feedback: the card should visibly rotate
  slightly and follow the drag, with a colored reveal (accent for
  right/calendar, muted for left/skip) growing in as the user drags past
  a threshold — this is the "fun and interactive" part, worth actually
  crafting rather than a bare instant state-change.

This is a deliberate shift from pure minimal-list restraint toward a more
tactile, game-like interaction for the primary review flow — that's fine
and intentional. It should NOT bleed into the rest of the app (Recents/
Calendar/Tasks tabs, settings drawer, auth pages) — those stay as plain,
calm lists/forms. The playfulness is specific to reviewing pending items,
where it earns its keep as the core interaction loop.

### Corner radius & shadow discipline
Specific, concrete complaint: cards currently look "too rounded" with
"random shadows." Fix directly:
- Pick one corner-radius value for cards (something like `rounded-lg`,
  not `rounded-2xl`/`rounded-3xl`) and use it everywhere — don't let
  different components drift to different radii.
- Pick exactly one separation technique per surface — either a hairline
  border OR a subtle shadow, never both stacked on the same element. A
  border-plus-shadow combo is what's reading as "random."

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
- Borders/backgrounds signal *category*, not decoration — if every card in
  a list has the same accent border, the border isn't telling the user
  anything; let section grouping (a heading) carry that instead, and
  reserve color for what's actually differentiated within the list.
- Sentence case on all UI copy and headings ("Sign in", not "Sign In").
- Prefer wrapping/showing full context (sender, source email) over cropping
  it — the whole value of a suggestion card is *why it was surfaced*.

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
- Card padding was asked to reduce on all sides, with the gap *between*
  cards smaller than the padding *inside* a card.
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