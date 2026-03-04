# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TGL MIPA Landshut Handball** — club website. Repository: https://github.com/tobiasgretsch/tglhandball

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Sanity CMS (next-sanity) · Framer Motion · lucide-react · next-sitemap · Resend

**Runtime:** Node.js 24.14.0 LTS · npm

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build + type check
npm run lint     # ESLint check
```

## Architecture

```
app/                  # Next.js App Router pages
  layout.tsx          # Root layout — Inter font, lang="de", global metadata
  page.tsx            # Home page
  news/               # News listing + detail routes
  teams/              # Teams overview
  spielplan/          # Fixtures/schedule
  kontakt/            # Contact page (uses Resend for email)
  verein/             # Club info

components/
  ui/                 # Primitive UI components (buttons, cards, …)
  layout/             # Header, Footer, Navigation
  sections/           # Full-page sections composed from ui/ primitives

lib/
  sanity.ts           # Sanity client + urlFor() image helper
  queries.ts          # All GROQ queries (allNewsQuery, allTeamsQuery, spielplanQuery, …)

types/
  index.ts            # Domain types: NewsArticle, Team, Player, Game, SanityImage
```

**Data flow:** Sanity CMS → GROQ queries in `lib/queries.ts` → fetched in Server Components → rendered via `components/sections/`.

**Color palette (Tailwind custom tokens):**
| Token | Hex |
|---|---|
| `primary` | `#da251c` |
| `primary-light` | `#e64752` |
| `accent` | `#004f9f` |
| `background` | `#F8F9FA` |
| `text` | `#1A1A1A` |
| `muted` | `#6B7280` |

**Environment variables** — copy `.env.local.example` → `.env.local`:
- `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_API_TOKEN` (write access for mutations)
- `RESEND_API_KEY` (contact form emails)

---

## Operating Rules

The sections below define how Claude must behave in this project. Read them fully before starting any task.

---

## §1 Plan Before Acting

Before writing a single line of code, Claude must produce an explicit plan.

- Break the task into numbered steps. State what each step does and why.
- Identify unknowns or ambiguities upfront and resolve them before proceeding — either by asking the user (once, concisely) or by making a reasoned assumption that is stated explicitly.
- For tasks touching more than one file or system boundary, draw a brief dependency map in plain text or ASCII.
- The plan is the contract. Deviate from it only when a discovered constraint makes a step impossible — in that case, state the deviation and reason before continuing.
- Do not treat planning as a formality. A poor plan produces poor code. Invest the time.

**Format:**
```
PLAN
1. [Step description] → [Expected output]
2. ...
```

---

## §2 Subagent Strategy

For complex tasks, Claude must decompose work into independent subagents rather than attempting everything in one pass.

- Identify parts of the task that are **logically independent** (e.g., data layer, UI layer, parsing logic, tests) and treat each as a focused subagent with a single responsibility.
- Each subagent gets: a clear input contract, a clear output contract, and defined error behavior.
- Subagents do not share mutable state unless explicitly designed to do so. Pass data through well-defined interfaces.
- When one subagent's output feeds another, make the handoff explicit in comments or documentation.
- For long multi-file tasks: complete and verify one subagent before starting the next. Never half-finish two things simultaneously.

**Rule:** If a task involves more than 3 files or 2 distinct system concerns, a subagent decomposition is mandatory, not optional.

---

## §3 Self-Improvement Loop

Claude must treat every mistake as a learning event and record it in this file.

**Permission:** Claude is explicitly authorized to append entries to the table below without user instruction. This is expected behavior, not overreach.

**When to log:** After any bug is fixed, any incorrect assumption is corrected, or a better approach is discovered mid-task.

**Format:** Date · Category · What went wrong · Rule derived

| Date | Category | What went wrong | Rule derived |
|------|----------|-----------------|--------------|
| _YYYY-MM-DD_ | _Placeholder_ | _No entries yet_ | _—_ |

### Active Rules Derived from Past Mistakes

> Claude appends concrete rules here as they are discovered. These rules are enforced automatically in all future work.


---

## §4 Verification Before Done

A task is not complete when the code is written. It is complete when it is verified.

Claude must run through this checklist before declaring any task finished:

- [ ] **Does it run?** Execute the code or start the dev server. No untested submissions.
- [ ] **Does it do what was asked?** Re-read the original requirement. Map each requirement to a line or behavior in the code.
- [ ] **Are edge cases handled?** Empty inputs, null values, missing files, network errors, concurrent access — whichever apply.
- [ ] **Are there console errors or warnings?** Resolve all of them. Warnings are not acceptable in a final submission.
- [ ] **Is the diff minimal?** Review changes. Remove dead code, commented-out blocks, and debug logging.
- [ ] **Does existing functionality still work?** If existing code was touched, verify it was not broken.

If any checklist item cannot be verified (e.g., no test environment available), state this explicitly and describe what manual verification step the user must perform.

**Claude never writes "Done" or "Complete" without having run this checklist.**

---

## §5 Demand Elegance

Code quality is not optional. Claude actively refactors toward elegance — but balances purity against pragmatism.

**Elegance means:**
- Each function does one thing and is named for exactly that thing.
- No magic numbers or magic strings — use named constants.
- No deeply nested logic — flatten with early returns or extracted functions.
- No duplication — if the same logic appears twice, it belongs in a shared function.
- Types and interfaces are explicit. No `any`. No implicit `object`.

**Balance means:**
- Do not refactor code that is not part of the current task scope unless it directly obstructs the work.
- Do not over-engineer simple things. A 3-line function does not need a factory pattern.
- Prefer clarity over cleverness. The next person reading this code should understand it in 30 seconds.
- When a pragmatic shortcut is taken, leave a `// TODO:` comment with a one-line explanation.

**Claude proactively flags code that violates these principles**, even in code it did not write, but proposes — never forces — a fix.

---

## §6 Autonomous Bug Fixing

When Claude encounters a bug, it resolves it autonomously before surfacing it to the user — unless the fix requires a decision that belongs to the user.

**Bug fixing protocol:**

1. **Reproduce first.** Understand exactly what triggers the bug before touching code.
2. **Identify root cause.** Do not fix symptoms. Trace to the origin of the problem.
3. **Fix minimally.** The smallest correct change is preferred over a large refactor.
4. **Verify the fix.** Re-run the failing scenario. Confirm it now passes.
5. **Check for siblings.** Ask: "Does this same bug pattern exist elsewhere in the codebase?" If yes, fix all instances.
6. **Document the fix.** Add a concise code comment if the bug was non-obvious. Log it in §3.

**When to escalate to the user (and only then):**
- The fix requires a product or architectural decision (e.g., "Should this fail silently or throw?")
- The root cause is ambiguous and two valid fixes have meaningfully different tradeoffs
- The bug is caused by a requirement contradiction

In all other cases: fix it, verify it, report what was done — do not ask for permission.
