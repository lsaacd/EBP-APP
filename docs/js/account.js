'use strict';
(() => {
  // Run in the head, before CSS or any other resources. Never persist this data.
  let fragment = window.location.hash.slice(1);
  let query = window.location.search;
  let cleaned = false;
  try {
    window.history.replaceState(null, '', window.location.pathname);
    cleaned = true;
  } catch {
    // Fail closed if this browser cannot remove the sensitive URL.
  }

  const endpoints = Object.freeze({
    production: 'https://ebp-himnario-sync.himnario.workers.dev',
    security: 'https://ebp-himnario-sync-security.himnario.workers.dev',
  });
  let token = null;
  let action = null;
  let language = 'es';
  let environment = 'production';
  let validLink = false;
  try {
    const params = new URLSearchParams(fragment);
    const search = new URLSearchParams(query);
    const languages = params.getAll('lang');
    if (languages.length === 1 && /^(es|en)$/.test(languages[0])) language = languages[0];
    const queryEnvs = search.getAll('env');
    const fragmentEnvs = params.getAll('env');
    const envValues = [...queryEnvs, ...fragmentEnvs];
    const validEnvironment = queryEnvs.length <= 1 && fragmentEnvs.length <= 1
      && envValues.every(value => Object.hasOwn(endpoints, value))
      && new Set(envValues).size <= 1;
    if (validEnvironment && envValues.length) {
      environment = envValues[0];
      if (cleaned) {
        window.history.replaceState(null, '', `${window.location.pathname}?env=${environment}`);
      }
    }
    const keys = [...params.keys()];
    validLink = cleaned && validEnvironment && fragment.length <= 256
      && keys.length === (fragmentEnvs.length ? 4 : 3)
      && new Set(keys).size === keys.length
      && keys.every(key => ['action', 'token', 'lang', 'env'].includes(key))
      && /^(verify|reset)$/.test(params.get('action'))
      && /^[a-f0-9]{64}$/i.test(params.get('token'))
      && /^(es|en)$/.test(params.get('lang'));
    if (validLink) {
      token = params.get('token');
      action = params.get('action');
    }
  } catch {
    validLink = false;
    token = null;
    action = null;
  }
  fragment = '';
  query = '';

  const messages = {
    es: {
      skip: 'Ir al contenido', brand: 'HIMNARIO DIGITAL',
      securityEnvironment: 'Entorno de pruebas de seguridad',
      accountTitle: 'Tu cuenta', verifyTitle: 'Confirma tu correo', resetTitle: 'Restablece tu contraseña',
      accountLead: 'Abre el enlace que recibiste por correo para confirmar tu dirección o restablecer tu contraseña.',
      verifyLead: 'Confirma que quieres verificar tu dirección de correo para tu cuenta del Himnario.',
      resetLead: 'Elige una nueva contraseña para tu cuenta del Himnario.',
      invalid: 'El enlace no es válido o está incompleto. Solicita uno nuevo desde la aplicación.',
      readyVerify: 'Cuando estés listo, pulsa «Confirmar correo» para continuar.',
      readyReset: 'Escribe y confirma tu nueva contraseña. Solo se cambiará cuando pulses «Guardar contraseña».',
      busy: 'Procesando tu solicitud…',
      verifySuccess: 'Tu correo ha sido confirmado. Puedes volver a la aplicación.',
      resetSuccess: 'Tu contraseña se ha actualizado. Vuelve a la aplicación e inicia sesión con la nueva contraseña.',
      expired: 'El enlace ha vencido, ya se usó o no es válido. Solicita uno nuevo desde la aplicación.',
      unavailable: 'No pudimos completar la solicitud. El servicio puede no estar disponible. Inténtalo de nuevo o solicita un nuevo enlace desde la aplicación.',
      timeout: 'La solicitud tardó demasiado. No podemos confirmar si se completó. Puedes intentarlo de nuevo; si el enlace ya no es válido, vuelve a la aplicación o solicita uno nuevo.',
      passwordLength: 'La nueva contraseña debe tener entre 8 y 128 caracteres.',
      passwordMismatch: 'Las contraseñas no coinciden. Revisa la confirmación.',
      formLegend: 'Confirmar la acción de tu cuenta', newPassword: 'Nueva contraseña',
      confirmPassword: 'Confirmar nueva contraseña',
      passwordHelp: 'Usa entre 8 y 128 caracteres. Elige una contraseña que no uses en otros servicios.',
      showPasswords: 'Mostrar contraseñas', hidePasswords: 'Ocultar contraseñas',
      confirmEmail: 'Confirmar correo', savePassword: 'Guardar contraseña',
      privacy: 'Nada se confirma al abrir este enlace. La acción solo se envía cuando pulsas el botón.',
      returnApp: 'Volver a la aplicación', home: 'Volver al inicio del sitio', privacyLink: 'Política de privacidad',
      lightTheme: 'Activar modo claro', darkTheme: 'Activar modo oscuro',
    },
    en: {
      skip: 'Skip to content', brand: 'DIGITAL HYMNAL',
      securityEnvironment: 'Security test environment',
      accountTitle: 'Your account', verifyTitle: 'Confirm your email', resetTitle: 'Reset your password',
      accountLead: 'Open the link from your email to confirm your address or reset your password.',
      verifyLead: 'Confirm that you want to verify your email address for your Hymnal account.',
      resetLead: 'Choose a new password for your Hymnal account.',
      invalid: 'This link is invalid or incomplete. Request a new one from the app.',
      readyVerify: 'When you are ready, press “Confirm email” to continue.',
      readyReset: 'Enter and confirm your new password. It will only change when you press “Save password”.',
      busy: 'Processing your request…',
      verifySuccess: 'Your email has been confirmed. You can return to the app.',
      resetSuccess: 'Your password has been updated. Return to the app and sign in with your new password.',
      expired: 'This link has expired, has already been used, or is invalid. Request a new one from the app.',
      unavailable: 'We could not complete your request. The service may be unavailable. Try again or request a new link from the app.',
      timeout: 'The request took too long. We cannot confirm whether it completed. You can try again; if the link is no longer valid, return to the app or request a new one.',
      passwordLength: 'Your new password must contain between 8 and 128 characters.',
      passwordMismatch: 'The passwords do not match. Check the confirmation.',
      formLegend: 'Confirm your account action', newPassword: 'New password',
      confirmPassword: 'Confirm new password',
      passwordHelp: 'Use between 8 and 128 characters. Choose a password you do not use for other services.',
      showPasswords: 'Show passwords', hidePasswords: 'Hide passwords',
      confirmEmail: 'Confirm email', savePassword: 'Save password',
      privacy: 'Opening this link does not confirm anything. The action is only sent when you press the button.',
      returnApp: 'Return to the app', home: 'Return to the website home', privacyLink: 'Privacy policy',
      lightTheme: 'Switch to light mode', darkTheme: 'Switch to dark mode',
    },
  };

  function initialize() {
    const get = id => document.getElementById(id);
    const form = get('account-form');
    const fields = get('account-fields');
    const password = get('new-password');
    const confirmation = get('confirm-password');
    const submit = get('account-submit');
    const status = get('account-status');
    const visibility = get('password-visibility');
    const theme = get('account-theme');
    let statusKey = validLink ? (action === 'verify' ? 'readyVerify' : 'readyReset') : 'invalid';
    let busy = false;
    let succeeded = false;
    let visible = false;
    let controller = null;
    let disposed = false;

    function render() {
      const text = messages[language];
      document.documentElement.lang = language;
      get('account-language').value = language;
      document.querySelectorAll('[data-text]').forEach(element => {
        element.textContent = text[element.dataset.text];
      });
      const titleKey = action === 'verify' ? 'verifyTitle' : action === 'reset' ? 'resetTitle' : 'accountTitle';
      const leadKey = action === 'verify' ? 'verifyLead' : action === 'reset' ? 'resetLead' : 'accountLead';
      get('account-title').textContent = text[titleKey];
      document.title = `${text[titleKey]} — Himnario El Buen Pastor`;
      get('account-lead').textContent = text[leadKey];
      get('account-environment').hidden = environment !== 'security';
      status.textContent = text[statusKey];
      form.hidden = !token || succeeded;
      fields.disabled = busy || !token || succeeded;
      form.setAttribute('aria-busy', String(busy));
      get('password-fields').hidden = action !== 'reset';
      password.disabled = confirmation.disabled = action !== 'reset';
      submit.textContent = text[busy ? 'busy' : action === 'reset' ? 'savePassword' : 'confirmEmail'];
      visibility.textContent = text[visible ? 'hidePasswords' : 'showPasswords'];
      visibility.setAttribute('aria-pressed', String(visible));
      get('account-return').hidden = !succeeded;
      get('account-privacy').hidden = succeeded || !token;
      const themeLabel = text[document.body.classList.contains('dark') ? 'lightTheme' : 'darkTheme'];
      theme.setAttribute('aria-label', themeLabel);
      theme.setAttribute('aria-pressed', String(document.body.classList.contains('dark')));
      theme.title = themeLabel;
    }

    function showStatus(key, focus = true) {
      statusKey = key;
      render();
      if (focus) status.focus();
    }

    function hidePasswords() {
      visible = false;
      password.type = confirmation.type = 'password';
    }

    function clearPasswords() {
      password.value = confirmation.value = '';
      hidePasswords();
    }

    visibility.addEventListener('click', () => {
      visible = !visible;
      password.type = confirmation.type = visible ? 'text' : 'password';
      render();
    });
    theme.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      render();
    });
    get('account-language').addEventListener('change', event => {
      language = event.target.value === 'en' ? 'en' : 'es';
      render();
    });
    [password, confirmation].forEach(input => input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      if (statusKey === 'passwordLength' || statusKey === 'passwordMismatch') showStatus('readyReset', false);
    }));

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || !token || succeeded || disposed) return;
      password.removeAttribute('aria-invalid');
      confirmation.removeAttribute('aria-invalid');
      if (action === 'reset') {
        if (password.value.length < 8 || password.value.length > 128) {
          password.setAttribute('aria-invalid', 'true');
          showStatus('passwordLength', false);
          password.focus();
          return;
        }
        if (password.value !== confirmation.value) {
          confirmation.setAttribute('aria-invalid', 'true');
          showStatus('passwordMismatch', false);
          confirmation.focus();
          return;
        }
      }

      busy = true;
      hidePasswords();
      showStatus('busy', false);
      controller = new AbortController();
      let timedOut = false;
      const timeout = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 15000);
      let outcome = 'unavailable';
      try {
        const response = await fetch(`${endpoints[environment]}/auth/${action === 'verify' ? 'verification' : 'recovery'}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(action === 'verify' ? { token } : { token, newPassword: password.value }),
          credentials: 'omit',
          cache: 'no-store',
          referrerPolicy: 'no-referrer',
          redirect: 'error',
          signal: controller.signal,
        });
        // Only inspect fixed status/code values. Never display server messages.
        const data = response.status === 204 ? null : await response.json().catch(() => null);
        if (timedOut) {
          outcome = 'timeout';
        } else if (response.ok && (response.status === 204 || data?.ok === true)) {
          succeeded = true;
          token = null;
          outcome = action === 'verify' ? 'verifySuccess' : 'resetSuccess';
        } else if (response.status === 410 || ([400, 401, 403, 404].includes(response.status)
          && ['invalid_token', 'expired_token', 'token_expired', 'token_invalid', 'token_used', 'invalid_or_expired_token'].includes(data?.error))) {
          token = null;
          outcome = 'expired';
        }
      } catch {
        outcome = timedOut ? 'timeout' : 'unavailable';
      } finally {
        window.clearTimeout(timeout);
        controller = null;
        busy = false;
        clearPasswords();
        if (!disposed) showStatus(outcome);
      }
    });

    // Do not retain credentials or a pending action in the back-forward cache.
    window.addEventListener('pagehide', () => {
      disposed = true;
      token = null;
      if (controller) controller.abort();
      clearPasswords();
    });
    window.addEventListener('pageshow', event => {
      if (event.persisted) {
        disposed = false;
        busy = false;
        if (!succeeded) showStatus('invalid', false);
        else render();
      }
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', initialize, { once: true });
})();
