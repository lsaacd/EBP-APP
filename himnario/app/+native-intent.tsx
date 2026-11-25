import { resolveDeepLinkPath } from '../utils/deepLinks';

/**
 * Expo Router native-intent hook: normalizes Universal Links (`https://himnarioebp.com/...`)
 * and custom-scheme URLs (`el-buen-pastor-himnario://...`) into in-app routes before
 * Expo Router resolves the screen.
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  return resolveDeepLinkPath(path);
}
