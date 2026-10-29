# Publicar en Cloudflare Pages y R2

El sitio es estático, así que Cloudflare Pages sirve sus páginas y archivos pequeños. Las 656 grabaciones (aprox. 1.31 GiB) van en un bucket Cloudflare R2; no se copian al despliegue de Pages.

## Requisitos de producción

- Una cuenta Cloudflare con Wrangler autenticado.
- Un dominio administrado por Cloudflare para servir el bucket de audio con un dominio personalizado. La dirección `r2.dev` tiene límites de uso y es para pruebas.
- PowerShell y Node.js/npx instalados.

## Configuración inicial

Desde la carpeta raíz del proyecto:

```powershell
npx --yes wrangler login
npx --yes wrangler whoami
npx --yes wrangler r2 bucket create ebp-himnario-audio
npx --yes wrangler pages project create ebp-himnario --production-branch main
```

En Cloudflare, abre **R2 > ebp-himnario-audio > Settings**, habilita el acceso público mediante un dominio personalizado y copia la URL base resultante (por ejemplo `https://audio.example.org/`). El DNS del dominio debe estar en Cloudflare. No publiques credenciales ni tokens en este repositorio.

Si el nombre `ebp-himnario` ya está ocupado, elige otro nombre para Pages y pásalo al script con `-PagesProject`.

## Primera publicación

Reemplaza el ejemplo por el dominio real del bucket:

```powershell
.\scripts\deploy-cloudflare.ps1 -AudioBaseUrl "https://audio.example.org/"
```

El script carga las grabaciones `.m4a` a R2, prepara una copia de `docs/` sin la carpeta local de audio y publica esa copia en Pages. El reproductor utilizará el dominio R2 en el sitio publicado y seguirá usando los audios locales al abrir el sitio desde el proyecto.

## Publicaciones posteriores

Para publicar solo cambios del sitio, sin volver a cargar las grabaciones:

```powershell
.\scripts\deploy-cloudflare.ps1 -AudioBaseUrl "https://audio.example.org/" -SkipAudioUpload
```

Para volver a cargar el catálogo de audio, omite `-SkipAudioUpload`. Las claves R2 usan los nombres de archivo existentes, por ejemplo `hymn_1.m4a`.

## Archivos relacionados

- `scripts/deploy-cloudflare.ps1`: prepara la copia de Pages y publica sitio y audio.
- `docs/js/storage-config.js`: configuración local del reproductor; la URL de producción se inyecta solo en la copia de despliegue.
- `docs/js/audio-player.js`: crea las direcciones de audio.
- `.cloudflare-pages-stage/`: copia temporal de despliegue; está excluida de Git.

## Estado del primer despliegue

- Sitio: https://ebp-himnario.pages.dev/
- Proyecto Pages: `ebp-himnario`.
- Bucket: `ebp-himnario-audio`.
- URL temporal de audio: https://pub-81f518709acd4b4c8d0344f474c2d629.r2.dev/
- Antes de promover el sitio para uso masivo, asociar un dominio personalizado a R2 y volver a desplegar con esa URL. El dominio temporal r2.dev está limitado para desarrollo.
- Autenticación: usar variables de entorno de Cloudflare; nunca incluir credenciales en archivos del sitio ni en Git.

## Documentación oficial

- [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Dominios públicos para buckets R2](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [Comandos Wrangler para R2](https://developers.cloudflare.com/r2/reference/wrangler-commands/)
