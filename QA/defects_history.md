# Defect Testing History — HyperCommerce Customer Web

Permanent chronological audit trail of every defect-testing session in this repository.

**Rules**

- Append a new entry for every session. Newest entries go at the **end**.
- **Never overwrite, edit, or delete a previous entry.**
- Process, coverage areas, severity scale, and CSV format: `DEFECTS_INSTRUCTIONS.md`.
- Companion records: `QA/defects.csv` (master register, append-only, 19 columns) and
  `QA/defects_append.csv` (latest session only, overwritten each time, **no header row**).
- Defects are found by **exercising the running application**. Findings established only by
  reading source belong in `QA/code_review.csv`; vulnerabilities belong in `QA/security.csv`.

---

## Entry template

Copy this block for each new session and fill it in.

```markdown
# Defect Testing Session

**Date:** YYYY-MM-DD
**Time:** HH:MM (24-hour format)
**Feature / Module:**
**Documentation File:**
**Tester:** Claude

## Scope
- Flows tested
- Breakpoints tested
- Locales tested
- Total screens exercised

## Findings Summary
- Critical:
- High:
- Medium:
- Low:
- Total Defects:

## Files Modified
- QA/defects.csv
- QA/defects_append.csv

## New Defects Added
- ID:
- ID:

## Existing Defects Confirmed
- ID:

## Areas Verified Working
List what was exercised and behaved correctly.

## Notes
Assumptions, environment, unreproducible observations, limitations.

---
```

---

# Session Log

_No defect-testing sessions have been recorded yet. The first session appends its entry below this line._

---
