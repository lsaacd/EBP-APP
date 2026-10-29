# Feedback Forms & Web Integration — Codex & Antigravity Handoff Guide

Updated: 2026-10-28
Status: Forms created, published, and integrated into `docs/feedback.html`.

---

## 1. Overview & Collaboration Workflow

This document records the collaboration contract between **Codex** and **Antigravity** for managing the two Google Forms and integrating them into `docs/feedback.html`.

### Inter-Agent Protocol
1. **Plan Review**: When Codex prepares modifications to `docs/feedback.html` or the Python Form API scripts, it should verify against this document and consult Antigravity on UI impact before committing. No Antigravity task was available during the initial integration, so the changes were kept local and uncommitted.
2. **Design Integrity**: The web portal has a strict design system (Newsreader + Public Sans typography, warm cream `#faf9f7` light mode, pure black `#010101` dark mode, CSS custom properties). Do not introduce Tailwind or arbitrary ad-hoc inline styles.
3. **Data Security**: Secrets in `scripts/credentials.json` and `scripts/token.json` are permanently ignored by `.gitignore`. Never hardcode client secrets or push auth tokens.

---

## 2. Live Google Forms Reference

Both forms were generated via Google Forms API v1 and are stored in `scripts/created_forms.json`:

| Formulario | Form ID | Edit URL | View URL | Embed URL |
|---|---|---|---|---|
| **1. Reporte de Alabanzas y Audio** | `1W_NegSXbEUAqY_BgsBEzyhbpcTDw9l7JsLWZJgXjzNE` | [Editar](https://docs.google.com/forms/d/1W_NegSXbEUAqY_BgsBEzyhbpcTDw9l7JsLWZJgXjzNE/edit) | [Ver](https://docs.google.com/forms/d/e/1FAIpQLSer2vbP4s5ajecjodSOpitPWR_w58MtiOOv3e8pbvYPG95AoQ/viewform) | `https://docs.google.com/forms/d/e/1FAIpQLSer2vbP4s5ajecjodSOpitPWR_w58MtiOOv3e8pbvYPG95AoQ/viewform?embedded=true` |
| **2. Comentarios del Sitio y Proyección** | `13yElt5i_jLY0UCcWYPQ74fiCzfjWSWx-IHAlY6X4ZKQ` | [Editar](https://docs.google.com/forms/d/13yElt5i_jLY0UCcWYPQ74fiCzfjWSWx-IHAlY6X4ZKQ/edit) | [Ver](https://docs.google.com/forms/d/e/1FAIpQLScrfIf92Nya4WM8mlOHDhQhHeUjYqJtvF6kuBMOxzdPCim4ug/viewform) | `https://docs.google.com/forms/d/e/1FAIpQLScrfIf92Nya4WM8mlOHDhQhHeUjYqJtvF6kuBMOxzdPCim4ug/viewform?embedded=true` |

---

## 3. How to Edit the Forms Programmatically

The Python manager is located at `scripts/google_forms_manager.py`. It uses cached OAuth credentials (`scripts/token.json`).

### To add, delete, or modify questions:
Use `service.forms().batchUpdate()`:
```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from google_forms_manager import get_forms_service

service = get_forms_service()
form_id = "1W_NegSXbEUAqY_BgsBEzyhbpcTDw9l7JsLWZJgXjzNE"

# Example: Adding a question or updating description
requests = [
    {
        "createItem": {
            "item": {
                "title": "Nuevo campo",
                "questionItem": {
                    "question": {
                        "required": False,
                        "textQuestion": {"paragraph": False}
                    }
                }
            },
            "location": {"index": 0}
        }
    }
]

service.forms().batchUpdate(formId=form_id, body={"requests": requests}).execute()
```

Forms can also be edited manually anytime using the **Edit URLs** above.

---

## 4. Implemented UI in `docs/feedback.html`

### Behavior:
1. **Dual-Tab Switcher**:
   - Tab 1: **"Alabanzas y Audio"** (loads Form 1)
   - Tab 2: **"Sitio Web y Proyector"** (loads Form 2)
2. **Context Routing**:
   - When URL contains `?hymn=` or `?title=`, Tab 1 is selected and the related hymn is shown in a contextual callout. The context is not passed into Google Forms as a prefilled answer.
   - Without hymn context, Tab 2 is selected by default. `?form=audio` can explicitly select Tab 1.
   - Each selected form has a direct Google link as a fallback if embedding is unavailable.
3. **Design System & Theming**:
   - Reuse existing CSS tokens: `var(--bg)`, `var(--card)`, `var(--surface)`, `var(--ink)`, `var(--muted)`, `var(--accent)`, `var(--line)`.
   - Dark mode toggle follows `localStorage.getItem('ebp-dark')`.
   - `iframe` uses `loading="lazy"` and a responsive container with a 780px minimum height.
   - Tab controls support mouse, arrow keys, Home, and End.
   - Page styling lives in `docs/css/feedback.css`; the script switches the iframe URL without a page reload.
