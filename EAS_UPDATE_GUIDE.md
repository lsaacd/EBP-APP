w 

# 🚀 Guía Rápida: Cómo Publicar la Actualización con EAS (OTA)

Esta guía documenta los pasos exactos para publicar los cambios pendientes a la aplicación en producción (**Himnario El Buen Pastor**) a través de EAS Update (Over-The-Air), sin necesidad de compilar un nuevo binario ni esperar la revisión de Apple o Google.

---

## 📋 Resumen de los Cambios Pendientes de Publicar

1. **Correcciones en letras y gramática de himnos:**
   * Archivo: `himnario/data/alabanzasPaginas.js`
   * Himnos actualizados: **#43**, **#248**, **#409**, **#557**.
2. **Efecto al presionar el botón de Inicio:**
   * Archivo: `himnario/app/(tabs)/home.tsx`
   * El botón principal **"Explora todos los himnos"** ahora tiene exactamente la misma respuesta táctil y visual que el botón *"Compartir el Versículo"*:
     * Vibración suave al toque (`Haptics.impactAsync(Light)`).
     * Opacidad de respuesta al presionar (`activeOpacity={0.8}`).
     * Colores y sombras originales en Modo Oscuro y Modo Claro preservados intactos.

---

## 🛠️ Estado del Sistema en esta Computadora

* ✅ **Node.js LTS (v24.22.1)**: Ya instalado.
* ✅ **EAS CLI (`eas-cli`)**: Ya instalado globalmente.
* ✅ **Permisos de PowerShell**: Ya configurados (`RemoteSigned`) para permitir comandos de EAS.

---

## ⚡ Pasos para Publicar la Actualización (Cuando Estés Listo)

### Paso 1: Abrir Terminal de PowerShell

Abre **PowerShell** en tu computadora.

### Paso 2: Iniciar Sesión en Expo / EAS

Ejecuta el siguiente comando:

```powershell
eas login
```

> **Nota:** Esto abrirá automáticamente una pestaña en tu navegador web. Simplemente inicia sesión con tu cuenta de Expo (**isaacduran** / `isaacduran167@gmail.com`) o selecciona **"Continue with Google"**.

Para verificar que la sesión quedó activa, puedes ejecutar:

```powershell
eas whoami
```

*(Debe responder: `Logged in as isaacduran`)*

---

### Paso 3: Sincronizar cambios con el portal web (Recomendado)

Para que los cambios de letra también se reflejen en la versión web (`/docs`), dirígete a la raíz del proyecto y ejecuta:

```powershell
cd c:\Users\duran\OneDrive\Desktop\EBP-APP
node scripts/extract-hymns.js
```

---

### Paso 4: Enviar la Actualización en Vivo (Over-The-Air)

Dirígete a la carpeta `himnario` y lanza el comando de EAS Update:

```powershell
cd c:\Users\duran\OneDrive\Desktop\EBP-APP\himnario
eas update --branch production --message "Actualizar letras de himnos y efecto de pulsacion en inicio"
```

---

## 🎵 ¿Cómo cambiar un audio (MP3 o M4A) en el futuro por EAS Update?

Si más adelante deseas cambiar o corregir el audio de cualquier himno:

1. **Si tu archivo es `.m4a`:**

   * Colócalo en `himnario/assets/audio/hymn_<ID>.m4a` reemplazando el archivo anterior con el mismo nombre.
   * No necesitas tocar ningún archivo de código.
2. **Si tu archivo es `.mp3`:**

   * Colócalo en `himnario/assets/audio/hymn_<ID>.mp3`.
   * Abre `himnario/data/audioRegistry.ts` y cambia la extensión de esa línea a `.mp3`:
     ```ts
     '43': require('../assets/audio/hymn_43.mp3'),
     ```
3. **Publica el cambio:**

   ```powershell
   cd c:\Users\duran\OneDrive\Desktop\EBP-APP\himnario
   eas update --branch production --message "Actualizar audio del himno <ID>"
   ```
   *EAS detectará solo el audio modificado y lo enviará automáticamente a los teléfonos de los usuarios al abrir la app.*
