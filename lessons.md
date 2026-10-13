# Lessons

| Date | Category | What went wrong | Rule derived |
|------|----------|-----------------|--------------|
| 2026-10-13 | Tooling | A scripted regex replace of the `clip-diagonal-*` block in `globals.css` also consumed the closing `}` of `@layer utilities`. | After any scripted multi-line CSS edit, re-read the surrounding lines and run the build before moving on. |
| 2026-10-13 | Verification | Headless Edge with a tall `--window-size` made the `min-h-dvh` hero fill the whole shot, and a 390px width is clamped, so below-the-fold sections and mobile layout looked wrong/clipped. | Verify layout in a real browser tab; for mobile widths use a same-origin iframe of the target width, not headless window size. |
| 2026-10-13 | Tooling | The Read tool returned only line 1 of several files (hook-limited). | If Read is truncated, use `Bash`/`PowerShell` to print the file, then edit with exact strings. |
