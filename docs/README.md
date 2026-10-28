# Himnario El Buen Pastor — sitio web

Este directorio contiene el sitio estático. Abre este README primero al continuar el trabajo en Codex, Antigravity u otro IDE.

## Directorios y su utilidad

| Ruta | Utilidad |
| --- | --- |
| `index.html` | Página principal, catálogo, índice, favoritos y lector de letras. |
| `feedback.html` | Página de comentarios con el formulario de Google incrustado. |
| `privacy.html` | Política de privacidad en español e inglés. |
| `terms.html` | Términos de servicio en español e inglés. |
| `css/` | Hojas de estilo del sitio. Mantener el orden de carga en `index.html`. |
| `js/` | Comportamiento de la biblioteca, audio, búsqueda, presentación y animaciones. |
| `data/` | Catálogo generado para la web: `hymns-data.js`. |
| `audio/` | Grabaciones disponibles, identificadas como `hymn_ID.m4a`. |
| `images/` | Portada del reproductor y recursos visuales. |
| `images/branding/` | Logotipos para ambos temas y favicon. |
| `mockups/` | Capturas promocionales de la app utilizadas en Inicio. |
| `downloads/` | Código QR descargable, versiones de impresión/vista previa e icono fuente para generarlo. |
| `guides/` | Documentación técnica y trabajo pendiente. |
| `.nojekyll` | Desactiva el procesamiento Jekyll al publicar en GitHub Pages; conservar. |

## Qué archivo editar

| Función | Archivo |
| --- | --- |
| Catálogo, categorías, favoritos, navegación y preferencias | `js/library.js` |
| Búsqueda local y relevancia | `js/search-engine.js` |
| Reproductor, cola y listas de reproducción | `js/audio-player.js` |
| Efecto de pasar página en el lector | `js/page-flip.js` |
| Presentación para proyectar estrofas y coros | `js/projection.js`, `css/projection.css` |
| Galería promocional de la app | `js/mockups.js` |
| Estilos base y componentes compartidos | `css/library.css` |
| Cabecera, Inicio y diseño de página | `css/website.css` |
| Ajustes visuales, temas y tarjeta QR | `css/refinements.css` |
| Lector y controles de audio | `css/reading-player.css` |
| Catálogo, índice y favoritos | `css/catalog.css` |
| Comentarios | `feedback.html` (estructura, estilos y script de esta página) |

Las hojas de estilo actuales se complementan y contienen ajustes en cascada. Todas se utilizan; no eliminarlas por parecer similares. Las rutas dentro de los scripts se resuelven desde las páginas HTML, no desde `js/`.

## Vista local y mantenimiento

Desde la raíz del repositorio:

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory docs
```

Abre `http://127.0.0.1:8765`. También funciona abriendo `index.html` directamente, aunque la vista HTTP reproduce mejor el alojamiento.

La fuente de letras y categorías es `../himnario/data/alabanzasPaginas.js`. Después de actualizarla o agregar audio a `audio/`, ejecuta desde la raíz:

```sh
node scripts/extract-hymns.js
```

El resultado se escribe en `docs/data/hymns-data.js`. No editar este archivo generado manualmente. La disponibilidad de audio se calcula usando los archivos presentes en `docs/audio/`.

Comprobación de búsqueda existente:

```sh
node scripts/test-web-search.js
```

Para regenerar los códigos QR: `python scripts/generate-app-qr.py` (requiere `qrcode[pil]`). Conservar `downloads/ebp-app-icon.png`, utilizado como entrada del generador.

## Publicación y enlaces

GitHub Pages sirve `docs/`. Vercel utiliza `../vercel.json`: actualizar sus rutas cuando se agreguen o muevan archivos públicos. Incluye las nuevas carpetas y compatibilidad con las antiguas URL de recursos.

Los enlaces de alabanzas usan `index.html#himno=1` o `index.html#himno=E124`. Favoritos, listas, tema y tamaño de letra se guardan en este navegador; no se sincronizan con la app móvil.

El enlace «Enviar comentarios» y los reportes del lector abren `feedback.html`. El formulario envía respuestas a Google Forms. El número y título del himno aparecen como contexto en la página; no rellenan automáticamente campos del formulario.

## Continuar en otro IDE

- [Mantenimiento e implementación](guides/MAINTENANCE.md): funcionamiento y decisiones existentes.
- [Pendiente: compartir alabanzas y previsualizaciones](guides/SHARING-HANDOFF.md): plan de implementación y decisiones pendientes.
- `../scripts/`: generadores y comprobaciones que se ejecutan desde la raíz.
- `../himnario/`: aplicación móvil; su código es independiente de esta reorganización del sitio.

## Limpieza realizada

Se agruparon CSS, JavaScript, catálogo y recursos de marca en sus directorios. Se eliminó `hymnsData.js`, el catálogo antiguo que ninguna página ni script utilizaba. Se conservó el catálogo activo, todas las grabaciones, las imágenes utilizadas y los recursos fuente del generador QR. Las notas anteriores se conservaron en `guides/MAINTENANCE.md`.
