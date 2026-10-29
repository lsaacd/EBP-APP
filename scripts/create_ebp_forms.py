"""
Create specialized Google Forms for Himnario El Buen Pastor:
1. Hymn & Audio Corrections Form (Alabanzas y Audio)
2. Website & Projector Feedback Form (Sitio Web y Proyector)
"""
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from google_forms_manager import get_forms_service, create_form, add_questions_to_form


def build_hymn_correction_form():
    title = "Himnario El Buen Pastor — Reporte de Alabanzas y Audio"
    description = (
        "Formulario oficial para reportar errores en las letras de himnos o estribillos, "
        "y para colaborar compartiendo grabaciones de audio para la congregación."
    )
    print(f"\n1. Creating: {title}...")
    form_info = create_form(title, description)
    form_id = form_info["formId"]

    questions = [
        {
            "title": "Nombre (opcional)",
            "description": "Si deseas identificarte para que sepamos quién colaboró.",
            "questionItem": {
                "question": {
                    "required": False,
                    "textQuestion": {"paragraph": False}
                }
            }
        },
        {
            "title": "Correo electrónico (opcional)",
            "description": "Solo por si necesitamos contactarte sobre tu reporte o para agradecerte tu colaboración.",
            "questionItem": {
                "question": {
                    "required": False,
                    "textQuestion": {"paragraph": False}
                }
            }
        },
        {
            "title": "Número y/o Título de la alabanza",
            "description": "Ejemplo: Himno 1 · He Aquí Que Tú Eres Hermoso, o Estribillo E124.",
            "questionItem": {
                "question": {
                    "required": True,
                    "textQuestion": {"paragraph": False}
                }
            }
        },
        {
            "title": "Tipo de reporte o colaboración",
            "description": "Selecciona la opción que mejor describe tu envío:",
            "questionItem": {
                "question": {
                    "required": True,
                    "choiceQuestion": {
                        "type": "RADIO",
                        "options": [
                            {"value": "Error tipográfico o falta ortográfica en la letra"},
                            {"value": "Falta una estrofa o coro"},
                            {"value": "Colaborar con una nueva grabación de audio"},
                            {"value": "Audio existente con fallas (se corta, distorsión, o melodía incorrecta)"},
                            {"value": "Título, número o categoría incorrectos"},
                            {"value": "Otro"}
                        ]
                    }
                }
            }
        },
        {
            "title": "Detalle del reporte o letra corregida",
            "description": "Explícanos cuál es el error y, si tienes la letra correcta, escríbela o pégala aquí.",
            "questionItem": {
                "question": {
                    "required": True,
                    "textQuestion": {"paragraph": True}
                }
            }
        },
        {
            "title": "Enlace a grabación de audio (si aplica)",
            "description": "Si estás compartiendo un audio, pega aquí un enlace de YouTube, Google Drive, Dropbox u otra plataforma.",
            "questionItem": {
                "question": {
                    "required": False,
                    "textQuestion": {"paragraph": False}
                }
            }
        }
    ]

    add_questions_to_form(form_id, questions)
    print(f"[OK] Created successfully!")
    print(f"Edit URL: {form_info['editUrl']}")
    print(f"View URL: {form_info['responderUri']}")
    print(f"Embed URL: {form_info['embedUrl']}")
    return form_info


def build_website_projector_form():
    title = "Himnario El Buen Pastor — Comentarios del Sitio y Proyección"
    description = (
        "Formulario para reportar problemas técnicos, sugerir nuevas funciones o "
        "compartir tu experiencia usando la biblioteca web y el modo de proyección para cultos."
    )
    print(f"\n2. Creating: {title}...")
    form_info = create_form(title, description)
    form_id = form_info["formId"]

    questions = [
        {
            "title": "Nombre (opcional)",
            "description": "Para saber a quién nos dirigimos.",
            "questionItem": {
                "question": {
                    "required": False,
                    "textQuestion": {"paragraph": False}
                }
            }
        },
        {
            "title": "Correo electrónico (opcional)",
            "description": "Para poder dar seguimiento a tu reporte o responder a tu sugerencia.",
            "questionItem": {
                "question": {
                    "required": False,
                    "textQuestion": {"paragraph": False}
                }
            }
        },
        {
            "title": "¿Podemos contactarte por correo si tenemos dudas sobre tu comentario?",
            "questionItem": {
                "question": {
                    "required": True,
                    "choiceQuestion": {
                        "type": "RADIO",
                        "options": [
                            {"value": "Sí, pueden contactarme si es necesario"},
                            {"value": "No, prefiero solo enviar el comentario sin seguimiento"}
                        ]
                    }
                }
            }
        },
        {
            "title": "Tipo de comentario",
            "questionItem": {
                "question": {
                    "required": True,
                    "choiceQuestion": {
                        "type": "RADIO",
                        "options": [
                            {"value": "Reporte de error o falla técnica (Bug)"},
                            {"value": "Sugerencia o nueva función"},
                            {"value": "Experiencia con el Modo Proyección (en el culto)"},
                            {"value": "Otro comentario general"}
                        ]
                    }
                }
            }
        },
        {
            "title": "¿Qué sección o función se vio afectada?",
            "description": "Puedes seleccionar una o varias áreas:",
            "questionItem": {
                "question": {
                    "required": True,
                    "choiceQuestion": {
                        "type": "CHECKBOX",
                        "options": [
                            {"value": "Búsqueda de alabanzas (número, título, letra)"},
                            {"value": "Modo Proyección para iglesia (pantalla completa, estrofas, atajos)"},
                            {"value": "Reproductor de audio (reproducción, controles, volumen)"},
                            {"value": "Listas de reproducción personales (Playlists)"},
                            {"value": "Lector de letras (tamaño de texto, modo oscuro/claro)"},
                            {"value": "Uso en teléfono móvil o tableta"},
                            {"value": "Rendimiento o velocidad de carga del sitio"},
                            {"value": "Otra parte"}
                        ]
                    }
                }
            }
        },
        {
            "title": "Descripción detallada del error o sugerencia",
            "description": (
                "Para un error: describe qué sucedió y los pasos para reproducirlo "
                "(ej: 1. Abrí el himno 10, 2. Pulsé proyectar, 3. La pantalla quedó en negro).\n"
                "Para una sugerencia: explica cómo esta idea mejoraría la experiencia o el servicio."
            ),
            "questionItem": {
                "question": {
                    "required": True,
                    "textQuestion": {"paragraph": True}
                }
            }
        },
        {
            "title": "Navegador y Dispositivo / Sistema Operativo",
            "description": "Ejemplo: Chrome en Windows 11, Safari en iPhone 15, Edge en laptop, Android, etc.",
            "questionItem": {
                "question": {
                    "required": False,
                    "textQuestion": {"paragraph": False}
                }
            }
        },
        {
            "title": "Comentarios adicionales (opcional)",
            "description": "¿Algo más que desees compartir con el equipo?",
            "questionItem": {
                "question": {
                    "required": False,
                    "textQuestion": {"paragraph": True}
                }
            }
        }
    ]

    add_questions_to_form(form_id, questions)
    print(f"[OK] Created successfully!")
    print(f"Edit URL: {form_info['editUrl']}")
    print(f"View URL: {form_info['responderUri']}")
    print(f"Embed URL: {form_info['embedUrl']}")
    return form_info


if __name__ == "__main__":
    form1 = build_hymn_correction_form()
    form2 = build_website_projector_form()

    results = {
        "hymnCorrectionForm": form1,
        "websiteProjectorForm": form2,
    }

    out_file = Path(__file__).resolve().parent / "created_forms.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nAll forms saved to {out_file}")
