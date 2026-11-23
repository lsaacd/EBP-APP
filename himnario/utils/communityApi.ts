import { useCallback, useRef } from "react";
import { AUTH_SYNC_API_URL, useAuth } from "../context/AuthContext";
export type VerseSummary = {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likedByMe: boolean;
};
export type VerseComment = {
  id: string;
  verseId: string;
  parentId: string | null;
  userId: string | null;
  authorName: string;
  authorInitials: string;
  ministry: string | null;
  choir: string | null;
  badgeVerified: boolean;
  body: string;
  createdAt: number;
  editedAt: number | null;
  likesCount?: number;
  likedByMe?: boolean;
  replies?: VerseComment[];
  repliesCursor?: string | null;
};
export type CommentPage = {
  comments: VerseComment[];
  nextCursor: string | null;
};
export function useCommunityApi() {
  const { token } = useAuth();
  const currentToken = useRef(token);
  currentToken.current = token;
  return useCallback(
    async <T>(path: string, method = "GET", body?: object): Promise<T> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(`${AUTH_SYNC_API_URL}${path}`, {
          method,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        if (token !== currentToken.current) throw new Error("auth_cancelled");
        let data: any = null;
        try {
          if (typeof response.text === "function") {
            const rawText = await response.text();
            data = rawText ? JSON.parse(rawText) : null;
          } else {
            data = await response.json();
          }
        } catch {
          data = null;
        }
        if (token !== currentToken.current) throw new Error("auth_cancelled");
        if (!response.ok) throw new Error(data?.error || "service_unavailable");
        return data as T;
      } finally {
        clearTimeout(timeout);
      }
    },
    [token],
  );
}
export function communityError(error: unknown, es: boolean) {
  const code = error instanceof Error ? error.message : "";
  const messages: Record<string, [string, string]> = {
    comment_limit: [
      "Máximo 100 palabras y 1.000 caracteres.",
      "Maximum 100 words and 1,000 characters.",
    ],
    comment_content: [
      "Usa texto respetuoso, sin enlaces ni HTML.",
      "Use respectful plain text without links or HTML.",
    ],
    draft_storage_unavailable: [
      "No se pudo guardar el borrador en el dispositivo. Libera espacio e inténtalo de nuevo.",
      "Could not save the draft on your device. Free some space and try again.",
    ],
    invalid_parent: [
      "El comentario original ya no está disponible. Elige otro o cancela la respuesta.",
      "The original comment is no longer available. Choose another or cancel the reply.",
    ],
    duplicate_comment: [
      "Ya enviaste este comentario.",
      "You already sent this comment.",
    ],
    rate_limited: [
      "Espera unos minutos antes de intentarlo de nuevo.",
      "Please wait a few minutes before trying again.",
    ],
    account_suspended: [
      "Tu cuenta está suspendida. Contacta al administrador.",
      "Your account is suspended. Contact the administrator.",
    ],
    email_verification_required: [
      "Verifica tu correo para participar.",
      "Verify your email to participate.",
    ],
    unauthorized: ["Inicia sesión nuevamente.", "Please sign in again."],
    ugc_terms_required: [
      "Acepta las normas de comunidad para participar.",
      "Accept the community rules to participate.",
    ],
    idempotency_conflict: [
      "Hubo un conflicto al enviar. Inténtalo de nuevo.",
      "There was a send conflict. Please try again.",
    ],
    not_found: [
      "Ese contenido ya no está disponible.",
      "That content is no longer available.",
    ],
    not_friends: [
      "Solo puedes compartir con hermanos que hayas aceptado.",
      "You can only share with accepted friends.",
    ],
    choir_exists: [
      "Ese coro ya existe o está pendiente de aprobación.",
      "That choir already exists or is awaiting approval.",
    ],
    invalid_choir: [
      "Ingresa un nombre de coro válido (2–60 caracteres).",
      "Enter a valid choir name (2–60 characters).",
    ],
    invalid_playlist: [
      "La lista no es válida o tiene demasiadas alabanzas.",
      "This playlist is invalid or has too many hymns.",
    ],
  };
  return (
    messages[code]?.[es ? 0 : 1] ||
    (es
      ? "No se pudo conectar. Tu borrador se conserva. Inténtalo de nuevo."
      : "Could not connect. Your draft is saved. Please try again.")
  );
}
