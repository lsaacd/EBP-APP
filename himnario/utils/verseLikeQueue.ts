import type { VerseSummary } from "./communityApi";

/** Serialize desired states, coalesce rapid taps, and roll back to the last ACK. */
export function createVerseLikeQueue(
  initial: VerseSummary,
  send: (liked: boolean) => Promise<unknown>,
  callbacks: {
    onError: (error: unknown, confirmed: VerseSummary) => void;
    onIdle: () => void;
  },
) {
  let confirmed = { ...initial };
  let desired: boolean | null = null;
  let running = false;
  let disposed = false;
  let epoch = 0;
  const pending = () => running || desired !== null;
  const pump = async () => {
    if (running || disposed) return;
    const operation = epoch;
    running = true;
    try {
      while (desired !== null) {
        const target = desired;
        desired = null;
        if (target === confirmed.likedByMe) continue;
        await send(target);
        if (disposed || operation !== epoch) return;
        confirmed = {
          ...confirmed,
          likedByMe: target,
          likesCount: Math.max(0, confirmed.likesCount + (target ? 1 : -1)),
        };
      }
    } catch (error) {
      if (!disposed && operation === epoch) {
        desired = null;
        callbacks.onError(error, { ...confirmed });
      }
    } finally {
      if (!disposed && operation === epoch) {
        running = false;
        callbacks.onIdle();
      }
    }
  };
  return {
    pending,
    acceptServer(value: VerseSummary) {
      if (disposed || pending()) return false;
      confirmed = { ...value };
      return true;
    },
    request(liked: boolean) {
      if (disposed) return;
      desired = liked;
      void pump();
    },
    activate() {
      disposed = false;
    },
    dispose() {
      disposed = true;
      ++epoch;
      desired = null;
      running = false;
    },
  };
}
