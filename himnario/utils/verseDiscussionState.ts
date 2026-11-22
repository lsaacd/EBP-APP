import type { VerseComment } from "./communityApi";

export const isPendingComment = (comment: VerseComment) =>
  comment.id.startsWith("temp-");

export function findComment(
  comments: VerseComment[],
  id: string,
): VerseComment | undefined {
  for (const comment of comments) {
    if (comment.id === id) return comment;
    const reply = comment.replies?.find((row) => row.id === id);
    if (reply) return reply;
  }
}

export function updateComment(
  comments: VerseComment[],
  id: string,
  update: (row: VerseComment) => VerseComment,
): VerseComment[] {
  return comments.map((row) =>
    row.id === id
      ? update(row)
      : {
          ...row,
          replies: row.replies?.map((reply) =>
            reply.id === id ? update(reply) : reply,
          ),
        },
  );
}

export function removeComment(
  comments: VerseComment[],
  id: string,
): VerseComment[] {
  return comments
    .filter((row) => row.id !== id)
    .map((row) => ({
      ...row,
      replies: row.replies?.filter((reply) => reply.id !== id),
    }));
}

export function confirmComment(
  comments: VerseComment[],
  temporaryId: string,
  serverId: string,
): VerseComment[] {
  const pending = findComment(comments, temporaryId);
  if (!pending) return comments;
  // An ambiguous timeout may have already returned this real row on refresh.
  if (findComment(comments, serverId))
    return removeComment(comments, temporaryId);
  return updateComment(comments, temporaryId, (row) => ({
    ...row,
    id: serverId,
  }));
}

/** A background refresh must not throw away older pages or expanded reply pages. */
export function mergeThreadPage(
  existing: VerseComment[],
  fresh: VerseComment[],
): VerseComment[] {
  const byId = new Map(existing.map((row) => [row.id, row]));
  const freshIds = new Set(fresh.map((row) => row.id));
  const merged = fresh.map((row) => {
    const previous = byId.get(row.id);
    if (!previous?.replies || !row.replies) return row;
    return {
      ...row,
      replies: mergeThreadPage(previous.replies, row.replies),
      repliesCursor:
        previous.replies.length > row.replies.length
          ? previous.repliesCursor
          : row.repliesCursor,
    };
  });
  return [...merged, ...existing.filter((row) => !freshIds.has(row.id))];
}
