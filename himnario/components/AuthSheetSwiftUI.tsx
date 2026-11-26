/**
 * AuthSheetSwiftUI — True iOS 26 Native SwiftUI Sign-In & Account Form Sheet.
 *
 * Mirrors Oyelo's exact native SwiftUI `.sheet(isPresented:)` + `NavigationStack` + `Form`
 * architecture:
 * - Presented directly via `@expo/ui/swift-ui` `<BottomSheet>` with
 *   `.presentationDetents([.medium, .large])` and `.presentationDragIndicator(.visible)`
 *   so iOS 26 automatically renders a translucent frosted Liquid Glass sheet and
 *   frosted glass `<Form>` wells at `.medium` detent, smoothly morphing into crisp
 *   luminous cards when expanded to `.large`
 * - `.navigationBarTitleDisplayMode(.inline)` with crisp SF Pro Bold 17pt title
 * - Native Liquid Glass `Cancelar` / `Cerrar` cancellation pill on the top-left
 * - Prominent circular Liquid Glass Sacred Ink `key.fill` / `person.badge.plus` /
 *   `paperplane.fill` action button on the top-right when signed out
 * - Borderless floating iOS 26 chromatic Liquid Glass segmented control, leading SF Symbol
 *   credential inputs, dedicated Sacred Ink capsule CTA, compact account benefits strip,
 *   and titled Quick Access shortcuts
 */
import React, { useCallback, useEffect, useRef } from 'react';
import type { TextFieldRef, SecureFieldRef } from '@expo/ui/swift-ui';
import type { SFSymbol } from 'sf-symbols-typescript';
import { getExpoSwiftUI, type ExpoSwiftUIBundle } from '../utils/expoSwiftUI';
import { useLanguage } from '../context/LanguageContext';
import { getPasswordStrength } from '../utils/passwordStrength';
import OAuthButtonsStack from './OAuthButtonsStack';
import UserAvatar from './UserAvatar';

export type SwiftUIAuthMode = 'login' | 'register' | 'recovery';

export interface AuthSheetSwiftUIProps {
  /**
   * `'bottom-sheet'` presents via SwiftUI's native `.sheet(isPresented:)` (`<BottomSheet>`)
   * so iOS 26 renders Oyelo's translucent frosted glass material at `.medium` detent.
   * `'embedded'` renders directly inside an existing modal route.
   */
  presentation?: 'embedded' | 'bottom-sheet';
  isPresented?: boolean;
  onDismiss?: () => void;
  isDarkMode: boolean;
  user: {
    id: string;
    displayName?: string | null;
    email: string;
    emailVerified?: boolean;
    avatarUrl?: string | null;
  } | null;
  initials: string;
  mode: SwiftUIAuthMode;
  name: string;
  email: string;
  password: string;
  showPassword: boolean;
  submitting: boolean;
  isLoading: boolean;
  emailAction: 'recovery' | 'verification' | 'refresh' | null;
  isSyncing: boolean;
  syncBlocked: boolean;
  friendsBadge: number;
  notificationsUnread: number;
  errorMessage: string | null;
  infoMessage: string | null;
  onChangeMode: (next: SwiftUIAuthMode) => void;
  onChangeName: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onToggleShowPassword: () => void;
  onSubmitAuth: () => void;
  onSendRecovery: () => void;
  canSignInWithApple?: boolean;
  canSignInWithGoogle?: boolean;
  oauthBusyProvider?: 'apple' | 'google' | null;
  onSignInWithApple?: () => void;
  onSignInWithGoogle?: () => void;
  onClose: () => void;
  onOpenMyProfile: () => void;
  onSyncNow: () => void;
  onOpenChurches: () => void;
  onOpenScanQr: () => void;
  onOpenSettings: () => void;
  onOpenShareApp: () => void;
  onOpenHelp: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

export default function AuthSheetSwiftUI(props: AuthSheetSwiftUIProps) {
  const swiftUI = getExpoSwiftUI();
  if (!swiftUI) return null;
  return <AuthSheetSwiftUIContent {...props} swiftUI={swiftUI} />;
}

function AuthSheetSwiftUIContent({
  swiftUI,
  presentation = 'embedded',
  isPresented = true,
  onDismiss,
  isDarkMode,
  user,
  initials,
  mode,
  name,
  email,
  password,
  showPassword,
  submitting,
  isLoading,
  emailAction,
  isSyncing,
  syncBlocked,
  friendsBadge,
  notificationsUnread,
  errorMessage,
  infoMessage,
  onChangeMode,
  onChangeName,
  onChangeEmail,
  onChangePassword,
  onToggleShowPassword,
  onSubmitAuth,
  onSendRecovery,
  canSignInWithApple = false,
  canSignInWithGoogle = false,
  oauthBusyProvider = null,
  onSignInWithApple,
  onSignInWithGoogle,
  onClose,
  onOpenMyProfile,
  onSyncNow,
  onOpenChurches,
  onOpenScanQr,
  onOpenSettings,
  onOpenShareApp,
  onOpenHelp,
  onOpenTerms,
  onOpenPrivacy,
  onSignOut,
  onDeleteAccount,
}: AuthSheetSwiftUIProps & { swiftUI: ExpoSwiftUIBundle }) {
  const { t } = useLanguage();

  const {
    BottomSheet,
    Button,
    Circle,
    Form,
    Group,
    Host,
    HStack,
    Image: SwiftUIImage,
    Label,
    NavigationStack,
    Picker,
    ProgressView,
    RNHostView,
    Section,
    SecureField,
    Spacer,
    Text,
    TextField,
    Toolbar,
    ToolbarItem,
    VStack,
    ZStack,
    useNativeState,
  } = swiftUI.ui;

  const nameRef = useRef<TextFieldRef>(null);
  const emailRef = useRef<TextFieldRef>(null);
  const securePasswordRef = useRef<SecureFieldRef>(null);
  const plainPasswordRef = useRef<TextFieldRef>(null);

  // Persistent native ObservableStates so toggling SecureField <-> TextField
  // (or switching auth modes) shares the exact native string on frame 0 without
  // async setText() races or erasing the user's password.
  const nameState = useNativeState<string>(name);
  const emailState = useNativeState<string>(email);
  const passwordState = useNativeState<string>(password);

  const lastNativeNameRef = useRef(name);
  const lastNativeEmailRef = useRef(email);
  const lastNativePasswordRef = useRef(password);

  const handleNameChange = useCallback(
    (next: string) => {
      lastNativeNameRef.current = next;
      onChangeName(next);
    },
    [onChangeName],
  );

  const handleEmailChange = useCallback(
    (next: string) => {
      lastNativeEmailRef.current = next;
      onChangeEmail(next);
    },
    [onChangeEmail],
  );

  const handlePasswordChange = useCallback(
    (next: string) => {
      lastNativePasswordRef.current = next;
      onChangePassword(next);
    },
    [onChangePassword],
  );

  const handleToggleShowPassword = useCallback(() => {
    const live = passwordState.get();
    if (typeof live === 'string' && live !== lastNativePasswordRef.current) {
      lastNativePasswordRef.current = live;
      onChangePassword(live);
    }
    onToggleShowPassword();
  }, [onChangePassword, onToggleShowPassword, passwordState]);

  const focusEmailField = useCallback(() => {
    emailRef.current?.focus().catch(() => {});
  }, []);

  const handleEmailFieldSubmit = useCallback(() => {
    if (mode === 'recovery') {
      onSendRecovery();
    } else if (showPassword) {
      plainPasswordRef.current?.focus().catch(() => {});
    } else {
      securePasswordRef.current?.focus().catch(() => {});
    }
  }, [mode, onSendRecovery, showPassword]);

  // Only push JS -> native when JS programmatically clears a field (e.g. after sign-in or
  // switching to recovery), never fighting active native typing or showPassword toggles.
  useEffect(() => {
    if (password === '' && lastNativePasswordRef.current !== '') {
      lastNativePasswordRef.current = '';
      if (passwordState.get() !== '') {
        passwordState.set('');
      }
    }
  }, [password, passwordState]);

  useEffect(() => {
    if (email === '' && lastNativeEmailRef.current !== '') {
      lastNativeEmailRef.current = '';
      if (emailState.get() !== '') {
        emailState.set('');
      }
    }
  }, [email, emailState]);

  useEffect(() => {
    if (name === '' && lastNativeNameRef.current !== '') {
      lastNativeNameRef.current = '';
      if (nameState.get() !== '') {
        nameState.set('');
      }
    }
  }, [name, nameState]);

  const {
    accessibilityLabel,
    autocorrectionDisabled,
    buttonStyle,
    contentShape,
    disabled,
    font,
    foregroundStyle,
    frame,
    keyboardType,
    labelStyle,
    lineLimit,
    listRowBackground,
    listRowInsets,
    listSectionMargins,
    listSectionSpacing,
    navigationBarTitleDisplayMode,
    navigationTitle,
    onSubmit,
    pickerStyle,
    preferredColorScheme,
    presentationDetents,
    presentationDragIndicator,
    scrollDismissesKeyboard,
    scrollEdgeEffectStyle,
    shapes,
    submitLabel,
    tag,
    textContentType,
    textInputAutocapitalization,
    tint,
    truncationMode,
  } = swiftUI.modifiers;

  const scheme = isDarkMode ? 'dark' : 'light';
  const symbolTint = isDarkMode ? '#FFFFFF' : '#6e1619';
  const prominentFill = isDarkMode ? '#fdf9f2' : '#6e1619';
  const prominentInk = isDarkMode ? '#010101' : '#FFFFFF';
  const accentTextColor = isDarkMode ? '#fdf9f2' : '#6e1619';
  const avatarBg = isDarkMode ? '#F3EEE8' : '#6e1619';
  const avatarText = isDarkMode ? '#1A1A1A' : '#FFFFFF';
  // Oyelo-matched soft neutral grouped card surface (opaque so dark photos behind the sheet
  // never turn rows muddy, while harmonizing smoothly with the frosted iOS 26 sheet).
  const cardRowBg = isDarkMode ? '#262629' : '#E9E9EE';
  const primaryStyle = { type: 'hierarchical' as const, style: 'primary' as const };
  const secondaryStyle = { type: 'hierarchical' as const, style: 'secondary' as const };
  const tertiaryStyle = { type: 'hierarchical' as const, style: 'tertiary' as const };

  const isSignedOut = !user;
  const isBusy = submitting || isLoading || Boolean(emailAction);
  const unreadTotal = friendsBadge + notificationsUnread;

  const authHeaderTitle = user
    ? t.authAccountTitle
    : mode === 'register'
      ? t.authCreateAccount
      : mode === 'recovery'
        ? t.authResetPasswordTitle
        : t.authSignIn;

  const primaryCtaLabel =
    mode === 'recovery'
      ? t.authSendRecovery
      : mode === 'register'
        ? t.authCreateAccount
        : t.authSignIn;

  const submitActionIcon: SFSymbol =
    mode === 'recovery'
      ? 'paperplane.fill'
      : mode === 'register'
        ? 'person.badge.plus'
        : 'key.fill';

  const handlePrimarySubmit = () => {
    if (mode === 'recovery') {
      onSendRecovery();
    } else {
      onSubmitAuth();
    }
  };

  const syncStatusLabel = isSyncing
    ? t.authSyncingStatus
    : syncBlocked
      ? t.accountPaused
      : t.accountSynced;

  const strength = mode === 'register' ? getPasswordStrength(password) : 0;
  const strengthColor =
    strength === 1 ? '#D64545' : strength === 2 ? '#C98A1C' : '#2E9E56';
  const strengthLabel =
    strength === 1
      ? t.authPasswordWeak
      : strength === 2
        ? t.authPasswordGood
        : t.authPasswordStrong;

  const chevron = (
    <SwiftUIImage
      systemName="chevron.right"
      size={13}
      modifiers={[foregroundStyle(tertiaryStyle)]}
    />
  );

  const renderTintedIcon = (systemImage: SFSymbol) => (
    <SwiftUIImage
      systemName={systemImage}
      modifiers={[foregroundStyle({ type: 'color', color: symbolTint })]}
    />
  );

  const renderFieldLeadingIcon = (systemImage: SFSymbol, size = 16) => (
    <SwiftUIImage
      systemName={systemImage}
      size={size}
      modifiers={[
        foregroundStyle(secondaryStyle),
        frame({ width: 22, alignment: 'center' }),
      ]}
    />
  );

  const renderMenuButtonRow = (
    title: string,
    systemImage: SFSymbol,
    onPress: () => void,
    rightValue?: string,
  ) => (
    <Button
      modifiers={[foregroundStyle(primaryStyle), listRowBackground(cardRowBg)]}
      onPress={onPress}
    >
      <HStack
        alignment="center"
        spacing={10}
        modifiers={[contentShape(shapes.rectangle())]}
      >
        <Label title={title} icon={renderTintedIcon(systemImage)} />
        <Spacer />
        {rightValue ? (
          <Text
            modifiers={[
              font({ textStyle: 'subheadline' }),
              foregroundStyle(secondaryStyle),
              lineLimit(1),
            ]}
          >
            {rightValue}
          </Text>
        ) : null}
        {chevron}
      </HStack>
    </Button>
  );

  const appMenuSection = (
    <Section title={t.authQuickAccessTitle}>
      {renderMenuButtonRow(t.profileChurches, 'map', onOpenChurches, t.profileMap)}
      {renderMenuButtonRow(t.accountScanQrCode, 'qrcode.viewfinder', onOpenScanQr)}
      {renderMenuButtonRow(t.tabSettings, 'gearshape', onOpenSettings)}
      {renderMenuButtonRow(t.accountShareApp, 'square.and.arrow.up', onOpenShareApp)}
      {renderMenuButtonRow(t.accountHelp, 'questionmark.circle', onOpenHelp)}
    </Section>
  );

  const navigationContent = (
    <NavigationStack>
      <Toolbar
        modifiers={[
          navigationTitle(''),
          navigationBarTitleDisplayMode('inline'),
        ]}
      >
        <Form
          modifiers={[
            tint(symbolTint),
            listSectionSpacing('compact'),
            scrollDismissesKeyboard('interactively'),
            scrollEdgeEffectStyle('soft', 'all'),
          ]}
        >
          {user ? (
            <>
              {/* ── Account Identity Card ── */}
              <Section modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}>
                <Button
                  modifiers={[foregroundStyle(primaryStyle), listRowBackground(cardRowBg)]}
                  onPress={onOpenMyProfile}
                >
                  <HStack
                    alignment="center"
                    spacing={14}
                    modifiers={[contentShape(shapes.rectangle())]}
                  >
                    {user.avatarUrl && typeof RNHostView === 'function' ? (
                      <ZStack
                        alignment="center"
                        modifiers={[frame({ width: 46, height: 46 })]}
                      >
                        <RNHostView matchContents>
                          <UserAvatar
                            uri={user.avatarUrl}
                            initials={initials}
                            size={46}
                            backgroundColor={avatarBg}
                            textColor={avatarText}
                          />
                        </RNHostView>
                      </ZStack>
                    ) : (
                      <ZStack alignment="center">
                        <Circle
                          modifiers={[
                            foregroundStyle(avatarBg),
                            frame({ width: 46, height: 46 }),
                          ]}
                        />
                        <Text
                          modifiers={[
                            font({ size: 17, weight: 'bold' }),
                            foregroundStyle(avatarText),
                          ]}
                        >
                          {initials}
                        </Text>
                      </ZStack>
                    )}
                    <VStack alignment="leading" spacing={2}>
                      <Text
                        modifiers={[
                          font({ textStyle: 'body', weight: 'semibold' }),
                          lineLimit(1),
                          truncationMode('tail'),
                        ]}
                      >
                        {user.displayName || user.email.split('@')[0]}
                      </Text>
                      <Text
                        modifiers={[
                          font({ textStyle: 'footnote' }),
                          foregroundStyle(secondaryStyle),
                          lineLimit(1),
                          truncationMode('tail'),
                        ]}
                      >
                        {user.email}
                      </Text>
                    </VStack>
                    <Spacer />
                    {unreadTotal > 0 ? (
                      <Text
                        modifiers={[
                          font({ textStyle: 'footnote', weight: 'semibold' }),
                          foregroundStyle('#D64545'),
                        ]}
                      >
                        {String(unreadTotal)}
                      </Text>
                    ) : null}
                    {chevron}
                  </HStack>
                </Button>

                {!user.emailVerified ? (
                  <Button
                    modifiers={[foregroundStyle(primaryStyle), listRowBackground(cardRowBg)]}
                    onPress={onOpenMyProfile}
                  >
                    <HStack
                      alignment="center"
                      spacing={10}
                      modifiers={[contentShape(shapes.rectangle())]}
                    >
                      <Label
                        title={t.authEmailUnverified}
                        systemImage="envelope.badge"
                        modifiers={[foregroundStyle(accentTextColor)]}
                      />
                      <Spacer />
                      {chevron}
                    </HStack>
                  </Button>
                ) : null}
              </Section>

              {/* ── Cloud Sync Row ── */}
              <Section
                footer={
                  errorMessage ? (
                    <Text modifiers={[foregroundStyle('#D64545')]}>{errorMessage}</Text>
                  ) : infoMessage ? (
                    <Text modifiers={[foregroundStyle(accentTextColor)]}>{infoMessage}</Text>
                  ) : undefined
                }
              >
                <Button
                  modifiers={[
                    foregroundStyle(primaryStyle),
                    disabled(isSyncing),
                    listRowBackground(cardRowBg),
                  ]}
                  onPress={onSyncNow}
                >
                  <HStack
                    alignment="center"
                    spacing={10}
                    modifiers={[contentShape(shapes.rectangle())]}
                  >
                    <Label title={t.accountSync} icon={renderTintedIcon('arrow.clockwise.icloud')} />
                    <Spacer />
                    <Text
                      modifiers={[
                        font({ textStyle: 'subheadline' }),
                        foregroundStyle(secondaryStyle),
                      ]}
                    >
                      {syncStatusLabel}
                    </Text>
                    {isSyncing ? <ProgressView /> : chevron}
                  </HStack>
                </Button>
              </Section>

              {/* ── Unified App Menu ── */}
              {appMenuSection}

              {/* ── Session & Account Lifecycle ── */}
              <Section>
                <Button
                  modifiers={[foregroundStyle(primaryStyle), listRowBackground(cardRowBg)]}
                  onPress={onSignOut}
                >
                  <Label
                    title={t.authSignOut}
                    icon={renderTintedIcon('rectangle.portrait.and.arrow.right')}
                  />
                </Button>
                <Button
                  role="destructive"
                  modifiers={[foregroundStyle('#D64545'), listRowBackground(cardRowBg)]}
                  onPress={onDeleteAccount}
                >
                  <Label
                    title={t.authDeleteAccount}
                    systemImage="trash"
                    modifiers={[foregroundStyle('#D64545')]}
                  />
                </Button>
              </Section>
            </>
          ) : (
            <>
              {/* ── Mode Switcher inside an opaque Oyelo-toned card (zero dark bleed-through) ── */}
              {mode !== 'recovery' ? (
                <Section modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}>
                  <Picker
                    label={t.authSignIn}
                    selection={mode}
                    onSelectionChange={(next) => {
                      if (!isBusy && (next === 'login' || next === 'register')) {
                        onChangeMode(next);
                      }
                    }}
                    modifiers={[
                      pickerStyle('segmented'),
                      listRowBackground(cardRowBg),
                      listRowInsets({ top: 6, leading: 8, bottom: 6, trailing: 8 }),
                    ]}
                  >
                    <Text modifiers={[tag('login')]}>{t.authSignIn}</Text>
                    <Text modifiers={[tag('register')]}>{t.authCreateAccount}</Text>
                  </Picker>
                </Section>
              ) : (
                <Section
                  modifiers={[listSectionMargins({ edges: 'top', length: 6 })]}
                  footer={<Text>{t.authRecoveryHelp}</Text>}
                >
                  <Button
                    modifiers={[foregroundStyle(accentTextColor), listRowBackground(cardRowBg)]}
                    onPress={() => onChangeMode('login')}
                  >
                    <Label
                      title={t.authBackToSignIn}
                      systemImage="chevron.left"
                      modifiers={[foregroundStyle(accentTextColor)]}
                    />
                  </Button>
                </Section>
              )}

              {/* ── Social-First Official Apple & 4-Color Google Sign-In Buttons ── */}
              {mode !== 'recovery' &&
              typeof RNHostView === 'function' &&
              (canSignInWithApple || canSignInWithGoogle) ? (
                <Section>
                  <VStack
                    alignment="center"
                    modifiers={[
                      listRowBackground('clear'),
                      listRowInsets({ top: 4, leading: 0, bottom: 2, trailing: 0 }),
                    ]}
                  >
                    <RNHostView matchContents={{ vertical: true }}>
                      <OAuthButtonsStack
                        isDarkMode={isDarkMode}
                        canSignInWithApple={Boolean(canSignInWithApple && onSignInWithApple)}
                        canSignInWithGoogle={Boolean(canSignInWithGoogle && onSignInWithGoogle)}
                        appleLabel={t.authContinueWithApple}
                        googleLabel={t.authContinueWithGoogle}
                        dividerLabel={t.authOrEmailDivider}
                        showDivider
                        disabled={isBusy}
                        busyProvider={oauthBusyProvider}
                        onPressApple={onSignInWithApple}
                        onPressGoogle={onSignInWithGoogle}
                      />
                    </RNHostView>
                  </VStack>
                </Section>
              ) : null}

              {/* ── Icon-Prefixed Credentials Section ── */}
              <Section
                footer={
                  errorMessage ? (
                    <Text modifiers={[foregroundStyle('#D64545')]}>{errorMessage}</Text>
                  ) : infoMessage ? (
                    <Text modifiers={[foregroundStyle(accentTextColor)]}>{infoMessage}</Text>
                  ) : (
                    <Text>{t.authOptionalNote}</Text>
                  )
                }
              >
                {mode === 'register' ? (
                  <HStack
                    alignment="center"
                    spacing={12}
                    modifiers={[listRowBackground(cardRowBg)]}
                  >
                    {renderFieldLeadingIcon('person', 16)}
                    <TextField
                      ref={nameRef}
                      text={nameState}
                      placeholder={t.authNamePlaceholder}
                      onTextChange={handleNameChange}
                      modifiers={[
                        textContentType('name'),
                        textInputAutocapitalization('words'),
                        submitLabel('next'),
                        onSubmit(focusEmailField),
                        disabled(isBusy),
                      ]}
                    />
                  </HStack>
                ) : null}

                <HStack
                  alignment="center"
                  spacing={12}
                  modifiers={[listRowBackground(cardRowBg)]}
                >
                  {renderFieldLeadingIcon('envelope', 15)}
                  <TextField
                    ref={emailRef}
                    text={emailState}
                    placeholder={t.authEmailPlaceholder}
                    onTextChange={handleEmailChange}
                    modifiers={[
                      keyboardType('email-address'),
                      textContentType('emailAddress'),
                      textInputAutocapitalization('never'),
                      autocorrectionDisabled(true),
                      submitLabel(mode === 'recovery' ? 'send' : 'next'),
                      onSubmit(handleEmailFieldSubmit),
                      disabled(isBusy),
                    ]}
                  />
                </HStack>

                {mode !== 'recovery' ? (
                  <HStack
                    alignment="center"
                    spacing={12}
                    modifiers={[listRowBackground(cardRowBg)]}
                  >
                    {renderFieldLeadingIcon('lock', 16)}
                    {showPassword ? (
                      <TextField
                        key="password-plain"
                        ref={plainPasswordRef}
                        text={passwordState}
                        placeholder={
                          mode === 'register'
                            ? t.authRegisterPasswordPlaceholder
                            : t.authLoginPasswordPlaceholder
                        }
                        onTextChange={handlePasswordChange}
                        modifiers={[
                          textContentType(mode === 'login' ? 'password' : 'newPassword'),
                          textInputAutocapitalization('never'),
                          autocorrectionDisabled(true),
                          submitLabel('done'),
                          onSubmit(handlePrimarySubmit),
                          disabled(isBusy),
                        ]}
                      />
                    ) : (
                      <SecureField
                        key="password-secure"
                        ref={securePasswordRef}
                        text={passwordState}
                        placeholder={
                          mode === 'register'
                            ? t.authRegisterPasswordPlaceholder
                            : t.authLoginPasswordPlaceholder
                        }
                        onTextChange={handlePasswordChange}
                        modifiers={[
                          textContentType(mode === 'login' ? 'password' : 'newPassword'),
                          textInputAutocapitalization('never'),
                          autocorrectionDisabled(true),
                          submitLabel('done'),
                          onSubmit(handlePrimarySubmit),
                          disabled(isBusy),
                        ]}
                      />
                    )}
                    <Button
                      onPress={handleToggleShowPassword}
                      modifiers={[
                        buttonStyle('plain'),
                        foregroundStyle(secondaryStyle),
                        accessibilityLabel(
                          showPassword ? t.authHidePassword : t.authShowPassword,
                        ),
                      ]}
                    >
                      <SwiftUIImage
                        systemName={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                        size={17}
                      />
                    </Button>
                  </HStack>
                ) : null}

                {mode === 'register' && strength > 0 ? (
                  <HStack
                    alignment="center"
                    spacing={8}
                    modifiers={[listRowBackground(cardRowBg)]}
                  >
                    <SwiftUIImage
                      systemName={strength >= 3 ? 'checkmark.shield.fill' : 'shield.lefthalf.filled'}
                      size={14}
                      modifiers={[foregroundStyle(strengthColor)]}
                    />
                    <Text
                      modifiers={[
                        font({ textStyle: 'footnote', weight: 'semibold' }),
                        foregroundStyle(strengthColor),
                      ]}
                    >
                      {strengthLabel}
                    </Text>
                  </HStack>
                ) : null}
              </Section>

              {/* ── Oyelo-style Clean Action Row Card (matches Oyelo's "Prepare for listening" row) ── */}
              <Section>
                <Button
                  onPress={handlePrimarySubmit}
                  modifiers={[
                    foregroundStyle({ type: 'color', color: accentTextColor }),
                    disabled(isBusy),
                    listRowBackground(cardRowBg),
                  ]}
                >
                  <HStack
                    alignment="center"
                    spacing={10}
                    modifiers={[contentShape(shapes.rectangle())]}
                  >
                    {isBusy ? (
                      <ProgressView />
                    ) : (
                      renderTintedIcon(submitActionIcon)
                    )}
                    <Text
                      modifiers={[
                        font({ textStyle: 'body', weight: 'semibold' }),
                        foregroundStyle({ type: 'color', color: accentTextColor }),
                      ]}
                    >
                      {primaryCtaLabel}
                    </Text>
                    <Spacer />
                    {chevron}
                  </HStack>
                </Button>

                {mode === 'login' ? (
                  <Button
                    onPress={() => onChangeMode('recovery')}
                    modifiers={[
                      foregroundStyle(secondaryStyle),
                      disabled(isBusy),
                      listRowBackground(cardRowBg),
                    ]}
                  >
                    <HStack
                      alignment="center"
                      spacing={10}
                      modifiers={[contentShape(shapes.rectangle())]}
                    >
                      <SwiftUIImage
                        systemName="key.horizontal"
                        size={15}
                        modifiers={[foregroundStyle(secondaryStyle)]}
                      />
                      <Text
                        modifiers={[
                          font({ textStyle: 'subheadline' }),
                          foregroundStyle(secondaryStyle),
                        ]}
                      >
                        {t.authForgotPassword}
                      </Text>
                      <Spacer />
                      {chevron}
                    </HStack>
                  </Button>
                ) : null}
              </Section>

              {/* ── Compact Account Benefits Strip ── */}
              {mode !== 'recovery' ? (
                <Section title={t.authBenefitsTitle}>
                  <Label
                    icon={renderTintedIcon('icloud')}
                    modifiers={[listRowBackground(cardRowBg)]}
                  >
                    <Text
                      modifiers={[
                        font({ textStyle: 'subheadline' }),
                        foregroundStyle(secondaryStyle),
                      ]}
                    >
                      {t.authBenefitSync}
                    </Text>
                  </Label>
                  <Label
                    icon={renderTintedIcon('person.2')}
                    modifiers={[listRowBackground(cardRowBg)]}
                  >
                    <Text
                      modifiers={[
                        font({ textStyle: 'subheadline' }),
                        foregroundStyle(secondaryStyle),
                      ]}
                    >
                      {t.authBenefitFriends}
                    </Text>
                  </Label>
                  <Label
                    icon={renderTintedIcon('building.columns')}
                    modifiers={[listRowBackground(cardRowBg)]}
                  >
                    <Text
                      modifiers={[
                        font({ textStyle: 'subheadline' }),
                        foregroundStyle(secondaryStyle),
                      ]}
                    >
                      {t.authBenefitChurch}
                    </Text>
                  </Label>
                </Section>
              ) : null}

              {mode === 'register' ? (
                <Section>
                  {renderMenuButtonRow(t.authTermsLink, 'doc.text', onOpenTerms)}
                  {renderMenuButtonRow(t.authPrivacyLink, 'hand.raised', onOpenPrivacy)}
                </Section>
              ) : null}

              {/* ── Unified App Menu ── */}
              {appMenuSection}
            </>
          )}
        </Form>

        <Toolbar.Content>
          <ToolbarItem placement="cancellationAction">
            <Button
              label={isSignedOut ? t.authCancel : t.close}
              onPress={onClose}
              modifiers={[foregroundStyle(primaryStyle)]}
            />
          </ToolbarItem>

          <ToolbarItem placement="principal">
            <Text
              modifiers={[
                font({ textStyle: 'headline', weight: 'semibold' }),
                foregroundStyle(primaryStyle),
                lineLimit(1),
              ]}
            >
              {authHeaderTitle}
            </Text>
          </ToolbarItem>

          {isSignedOut ? (
            <ToolbarItem placement="confirmationAction">
              <Button
                onPress={handlePrimarySubmit}
                modifiers={[
                  buttonStyle('glassProminent'),
                  tint(prominentFill),
                  disabled(isBusy),
                  accessibilityLabel(primaryCtaLabel),
                ]}
              >
                {isBusy ? (
                  <ProgressView />
                ) : (
                  <Label
                    title={primaryCtaLabel}
                    systemImage={submitActionIcon}
                    modifiers={[
                      labelStyle('iconOnly'),
                      foregroundStyle({ type: 'color', color: prominentInk }),
                    ]}
                  />
                )}
              </Button>
            </ToolbarItem>
          ) : null}
        </Toolbar.Content>
      </Toolbar>
    </NavigationStack>
  );

  if (presentation === 'bottom-sheet') {
    return (
      <Host
        style={{ position: 'absolute', width: 0, height: 0 }}
        colorScheme={scheme}
        seedColor={symbolTint}
      >
        <BottomSheet
          isPresented={Boolean(isPresented)}
          onIsPresentedChange={(next) => {
            if (!next) {
              onClose();
            }
          }}
          onDismiss={onDismiss}
        >
          <Group
            modifiers={[
              presentationDetents(['medium', 'large']),
              presentationDragIndicator('visible'),
              preferredColorScheme(scheme),
            ]}
          >
            {navigationContent}
          </Group>
        </BottomSheet>
      </Host>
    );
  }

  return (
    <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={symbolTint}>
      {navigationContent}
    </Host>
  );
}
