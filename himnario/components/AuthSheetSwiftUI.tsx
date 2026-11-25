/**
 * AuthSheetSwiftUI — True iOS 26 Native SwiftUI Sign-In & Account Form Sheet.
 *
 * Mirrors Oyelo's native SwiftUI `NavigationStack` + `Form` sheet architecture:
 * - `.navigationBarTitleDisplayMode(.inline)` with crisp SF Pro Bold 17pt title
 * - Native Liquid Glass `Cancelar` / `Cerrar` cancellation pill on the top-left
 * - Prominent circular Liquid Glass Sacred Ink burgundy `key.fill` (or register /
 *   recovery) action button on the top-right when signed out
 * - `listSectionSpacing('compact')` + `scrollEdgeEffectStyle('soft', 'all')` so
 *   sections render as frosted glass wells at `.medium` detent and morph cleanly
 *   into luminous rounded cards when expanded to `.large`
 * - Native SF Pro Regular 17pt typography and crisp monochrome SF Symbols
 */
import React, { useCallback, useEffect, useRef } from 'react';
import type { TextFieldRef, SecureFieldRef } from '@expo/ui/swift-ui';
import type { SFSymbol } from 'sf-symbols-typescript';
import { getExpoSwiftUI } from '../utils/expoSwiftUI';
import { useLanguage } from '../context/LanguageContext';
import { getPasswordStrength } from '../utils/passwordStrength';

export type SwiftUIAuthMode = 'login' | 'register' | 'recovery';

export interface AuthSheetSwiftUIProps {
  isDarkMode: boolean;
  user: {
    id: string;
    displayName?: string | null;
    email: string;
    emailVerified?: boolean;
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

export default function AuthSheetSwiftUI({
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
}: AuthSheetSwiftUIProps) {
  const swiftUI = getExpoSwiftUI();
  const { t } = useLanguage();

  const nameRef = useRef<TextFieldRef>(null);
  const emailRef = useRef<TextFieldRef>(null);
  const securePasswordRef = useRef<SecureFieldRef>(null);
  const plainPasswordRef = useRef<TextFieldRef>(null);

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

  // Sync native field value when toggling password visibility or clearing after submit/mode change
  useEffect(() => {
    if (showPassword) {
      plainPasswordRef.current?.setText(password).catch(() => {});
    } else {
      securePasswordRef.current?.setText(password).catch(() => {});
    }
    // Intentionally sync on showPassword/mode transitions or when cleared to empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPassword, mode, password === '']);

  useEffect(() => {
    if (email) {
      emailRef.current?.setText(email).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode === 'register' && name) {
      nameRef.current?.setText(name).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (!swiftUI) return null;

  const {
    Button,
    Circle,
    Form,
    Host,
    HStack,
    Image: SwiftUIImage,
    Label,
    NavigationStack,
    Picker,
    ProgressView,
    Section,
    SecureField,
    Spacer,
    Text,
    TextField,
    Toolbar,
    ToolbarItem,
    VStack,
    ZStack,
  } = swiftUI.ui;

  const {
    accessibilityLabel,
    autocorrectionDisabled,
    buttonStyle,
    disabled,
    font,
    foregroundStyle,
    frame,
    keyboardType,
    labelStyle,
    listSectionSpacing,
    navigationBarTitleDisplayMode,
    navigationTitle,
    onSubmit,
    pickerStyle,
    scrollDismissesKeyboard,
    scrollEdgeEffectStyle,
    submitLabel,
    tag,
    textContentType,
    textInputAutocapitalization,
    tint,
  } = swiftUI.modifiers;

  const scheme = isDarkMode ? 'dark' : 'light';
  const monochromeInk = isDarkMode ? '#FFFFFF' : '#1C1C1E';
  const prominentBurgundy = isDarkMode ? '#9E2A32' : '#6e1619';
  const accentTextColor = isDarkMode ? '#E37C83' : '#6e1619';
  const avatarBg = isDarkMode ? '#F3EEE8' : '#6e1619';
  const avatarText = isDarkMode ? '#1A1A1A' : '#FFFFFF';
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

  const submitActionLabel =
    mode === 'recovery'
      ? t.authSendRecovery
      : mode === 'register'
        ? t.authSubmitRegister
        : t.authSubmitSignIn;

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

  const renderMenuButtonRow = (
    title: string,
    systemImage: SFSymbol,
    onPress: () => void,
    rightValue?: string,
  ) => (
    <Button
      modifiers={[foregroundStyle(primaryStyle)]}
      onPress={onPress}
    >
      <HStack alignment="center" spacing={10}>
        <Label title={title} systemImage={systemImage} />
        <Spacer />
        {rightValue ? (
          <Text
            modifiers={[
              font({ textStyle: 'subheadline' }),
              foregroundStyle(secondaryStyle),
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
    <Section>
      {isSignedOut
        ? renderMenuButtonRow(t.profileChurches, 'map', onOpenChurches, t.profileMap)
        : null}
      {renderMenuButtonRow(t.accountScanQrCode, 'qrcode.viewfinder', onOpenScanQr)}
      {renderMenuButtonRow(t.tabSettings, 'gearshape', onOpenSettings)}
      {renderMenuButtonRow(t.accountShareApp, 'square.and.arrow.up', onOpenShareApp)}
      {renderMenuButtonRow(t.accountHelp, 'questionmark.circle', onOpenHelp)}
    </Section>
  );

  return (
    <Host style={{ flex: 1 }} colorScheme={scheme} seedColor={monochromeInk}>
      <NavigationStack>
        <Toolbar
          modifiers={[
            navigationTitle(authHeaderTitle),
            navigationBarTitleDisplayMode('inline'),
          ]}
        >
          <Form
            modifiers={[
              tint(monochromeInk),
              listSectionSpacing('compact'),
              scrollDismissesKeyboard('interactively'),
              scrollEdgeEffectStyle('soft', 'all'),
            ]}
          >
            {user ? (
              <>
                {/* ── Account Identity Card ── */}
                <Section>
                  <Button
                    modifiers={[foregroundStyle(primaryStyle)]}
                    onPress={onOpenMyProfile}
                  >
                    <HStack alignment="center" spacing={14}>
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
                      <VStack alignment="leading" spacing={2}>
                        <Text
                          modifiers={[
                            font({ textStyle: 'body', weight: 'semibold' }),
                          ]}
                        >
                          {user.displayName || user.email.split('@')[0]}
                        </Text>
                        <Text
                          modifiers={[
                            font({ textStyle: 'footnote' }),
                            foregroundStyle(secondaryStyle),
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
                      modifiers={[foregroundStyle(primaryStyle)]}
                      onPress={onOpenMyProfile}
                    >
                      <HStack alignment="center" spacing={10}>
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
                    modifiers={[foregroundStyle(primaryStyle), disabled(isSyncing)]}
                    onPress={onSyncNow}
                  >
                    <HStack alignment="center" spacing={10}>
                      <Label title={t.accountSync} systemImage="arrow.clockwise.icloud" />
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
                    modifiers={[foregroundStyle(primaryStyle)]}
                    onPress={onSignOut}
                  >
                    <Label
                      title={t.authSignOut}
                      systemImage="rectangle.portrait.and.arrow.right"
                    />
                  </Button>
                  <Button
                    role="destructive"
                    modifiers={[foregroundStyle('#D64545')]}
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
                {/* ── Login / Register Mode Switcher ── */}
                {mode !== 'recovery' ? (
                  <Section
                    footer={<Text>{t.authSyncSubtitle}</Text>}
                  >
                    <Picker
                      label={t.authSignIn}
                      selection={mode}
                      onSelectionChange={(next) => {
                        if (!isBusy && (next === 'login' || next === 'register')) {
                          onChangeMode(next);
                        }
                      }}
                      modifiers={[pickerStyle('segmented')]}
                    >
                      <Text modifiers={[tag('login')]}>{t.authSignIn}</Text>
                      <Text modifiers={[tag('register')]}>{t.authCreateAccount}</Text>
                    </Picker>
                  </Section>
                ) : (
                  <Section footer={<Text>{t.authRecoveryHelp}</Text>}>
                    <Button
                      modifiers={[foregroundStyle(accentTextColor)]}
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

                {/* ── Native SwiftUI Credentials Section ── */}
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
                    <TextField
                      ref={nameRef}
                      placeholder={t.authNamePlaceholder}
                      onTextChange={onChangeName}
                      modifiers={[
                        textContentType('name'),
                        textInputAutocapitalization('words'),
                        submitLabel('next'),
                        onSubmit(focusEmailField),
                        disabled(isBusy),
                      ]}
                    />
                  ) : null}

                  <TextField
                    ref={emailRef}
                    placeholder={t.authEmailPlaceholder}
                    onTextChange={onChangeEmail}
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

                  {mode !== 'recovery' ? (
                    <HStack alignment="center" spacing={8}>
                      {showPassword ? (
                        <TextField
                          ref={plainPasswordRef}
                          placeholder={
                            mode === 'register'
                              ? t.authRegisterPasswordPlaceholder
                              : t.authLoginPasswordPlaceholder
                          }
                          onTextChange={onChangePassword}
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
                          ref={securePasswordRef}
                          placeholder={
                            mode === 'register'
                              ? t.authRegisterPasswordPlaceholder
                              : t.authLoginPasswordPlaceholder
                          }
                          onTextChange={onChangePassword}
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
                        onPress={onToggleShowPassword}
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
                    <HStack alignment="center" spacing={8}>
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

                  <Button
                    onPress={handlePrimarySubmit}
                    modifiers={[
                      foregroundStyle(accentTextColor),
                      disabled(isBusy),
                    ]}
                  >
                    <HStack alignment="center" spacing={10}>
                      <Label
                        title={submitActionLabel}
                        systemImage={submitActionIcon}
                        modifiers={[
                          font({ textStyle: 'body', weight: 'semibold' }),
                          foregroundStyle(accentTextColor),
                        ]}
                      />
                      <Spacer />
                      {isBusy ? <ProgressView /> : null}
                    </HStack>
                  </Button>

                  {mode === 'login' ? (
                    <Button
                      onPress={() => onChangeMode('recovery')}
                      modifiers={[foregroundStyle(secondaryStyle), disabled(isBusy)]}
                    >
                      <Text modifiers={[font({ textStyle: 'subheadline' })]}>
                        {t.authForgotPassword}
                      </Text>
                    </Button>
                  ) : null}
                </Section>

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
              />
            </ToolbarItem>

            {isSignedOut ? (
              <ToolbarItem placement="confirmationAction">
                <Button
                  onPress={handlePrimarySubmit}
                  modifiers={[
                    buttonStyle('glassProminent'),
                    tint(prominentBurgundy),
                    disabled(isBusy),
                    accessibilityLabel(submitActionLabel),
                  ]}
                >
                  {isBusy ? (
                    <ProgressView />
                  ) : (
                    <Label
                      title={submitActionLabel}
                      systemImage={submitActionIcon}
                      modifiers={[labelStyle('iconOnly')]}
                    />
                  )}
                </Button>
              </ToolbarItem>
            ) : null}
          </Toolbar.Content>
        </Toolbar>
      </NavigationStack>
    </Host>
  );
}
