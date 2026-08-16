# EAS (Expo Application Services) Deployment & Submission Guide

This document contains full operational instructions, release workflows, channel configurations, and app store submission procedures for **Himnario El Buen Pastor**.

---

## 1. 🔄 EAS Update Channels & Release Workflow

EAS separates live Over-The-Air (OTA) updates into distinct branches/channels:

| Channel / Branch | Target Audience | When to Use | Command |
| :--- | :--- | :--- | :--- |
| **`production`** | 🌍 **Live App Store / Play Store Users** | When pushing verified, production-ready bug fixes & features. | `eas update --branch production --message "<summary>"` |
| **`preview`** | 🧪 **Internal Testers / Android APKs / Simulators** | When testing updates on internal preview APKs without affecting live users. | `eas update --branch preview --message "<summary>"` |

> [!NOTE]
> * **JS / Styling / Asset changes** apply instantly via `eas update` without re-submitting to the App Store / Play Store.
> * **Native permission changes, native modules, or Android Foreground Services** require a full native build (`eas build`).

---

## 2. 🤖 Google Play Store Submission Guide (Android)

### Phase A: Prerequisites & Account Setup
1. **Google Play Developer Account**: A registered account at [Google Play Console](https://play.google.com/console) ($25 one-time fee).
2. **Google Cloud Console**: An active project at [Google Cloud Console](https://console.cloud.google.com/) for automated API access.

---

### Phase B: Mandatory First-Time Manual Upload

> [!IMPORTANT]
> Google Play requires the **very first release** to be manually uploaded via the web console before automated CLI submissions (`eas submit`) can be enabled.

1. **Create the App in Google Play Console**:
   * **App Name**: `Himnario El Buen Pastor`
   * **Default Language**: Spanish (`es-419` / `es-ES`) or English
   * **App or Game**: App
   * **Free or Paid**: Free
2. **Complete Console Policy Tasks**:
   * Complete *App Access*, *Ads* (No), *Content Rating Questionnaire*, *Target Audience*, and *Privacy Policy*.
   * Set up the Main Store Listing (App Icon 512x512, Feature Graphic 1024x500, and Phone Screenshots).
3. **Upload to Internal Testing**:
   * In the left menu, go to **Testing** ➔ **Internal testing**.
   * Under **Testers**, create an email list with your tester Gmail accounts.
   * Click **Create new release**.
   * Download the production `.aab` file from your [EAS Dashboard](https://expo.dev) or build via:
     ```bash
     eas build --platform android --profile production
     ```
   * Drag and drop the `.aab` file into the upload area.
   * Provide a Release Name and Release Notes ➔ Click **Next** ➔ **Save and publish**.
   * Open the generated test link on your Android device to accept the invite and install the app.

---

### Phase C: Automated Submissions via Google Cloud Service Account

After your first manual release, configure automated submissions directly from the terminal.

#### 1. Create a Service Account in Google Cloud
1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project (e.g. `ebp-play-submit`).
2. Navigate to **IAM & Admin** ➔ **Service Accounts**.
3. Click **+ Create Service Account**:
   * **Service account name**: `eas-play-submitter`
   * Click **Create and Continue**, then click **Done**.
4. Copy the generated **Service Account Email** (e.g. `eas-play-submitter@ebp-play-submit.iam.gserviceaccount.com`).

#### 2. Generate JSON Key
1. In the Service Accounts list, click the three dots (Actions) ➔ **Manage keys**.
2. Click **Add Key** ➔ **Create new key** ➔ Select **JSON** ➔ Click **Create**.
3. A `.json` key file will download to your machine.
4. Rename it to `google-play-service-account.json` (no spaces) and move it into the `himnario/` project root.

#### 3. Enable Google Play Android Developer API
1. In Google Cloud Console, go to **APIs & Services** ➔ **Enabled APIs & Services**.
2. Click **+ Enable APIs and Services** ➔ Search for **"Google Play Android Developer API"**.
3. Select it and click **Enable**.

#### 4. Grant Console Permissions
1. In [Google Play Console](https://play.google.com/console), go to **Users and permissions** ➔ **Invite new user**.
2. Paste the **Service Account Email**.
3. Under **App permissions**, select `Himnario El Buen Pastor`.
4. Under **Account permissions**, grant:
   * ✅ *View app information (read-only)*
   * ✅ *Edit and delete draft apps*
   * ✅ *Release to production, release apps to test tracks, and manage testing tracks*
5. Click **Invite user** ➔ **Send invite**.

---

### Phase D: Project Configuration (`eas.json` & `.gitignore`)

#### 1. Protect Key in `.gitignore`
> [!CAUTION]
> Never commit your service account `.json` key to source control!

Ensure `google-play-service-account.json` is added to `.gitignore`:
```gitignore
# Google Play Credentials
google-play-service-account.json
```
*(Ensure it is **NOT** in `.easignore` so the EAS CLI can access it during build/submission).*

#### 2. Configure `eas.json`
Add the submission credentials block in `eas.json`:
```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```
*(When ready for direct public release, change `"track": "internal"` to `"track": "production"`).*

---

## 3. 🍏 Apple App Store Submission Guide (iOS)

1. **Build for App Store**:
   ```bash
   eas build --platform ios --profile production
   ```
2. **Submit to App Store Connect**:
   ```bash
   eas submit --platform ios
   ```
3. **App Store Review Guidelines (Guideline 2.1 - China Mainland Exclusion)**:
   * In App Store Connect under **App Information** ➔ **Pricing and Availability**, **uncheck "China mainland"**.
   * This satisfies Apple's NPPA book publishing license exemption for religious/hymnal texts and allows smooth worldwide approval.

---

## 4. ⚡ Quick Command Reference

```bash
# ── Over-The-Air (OTA) Updates ───────────────────────────
# Publish live to production users:
eas update --branch production --message "Description of update"

# Publish to internal preview/test devices:
eas update --branch preview --message "Description of update"

# ── Native Builds ─────────────────────────────────────────
# Build Android APK for direct testing / simulator:
eas build --platform android --profile preview

# Build Android Production Bundle (.aab) for Google Play:
eas build --platform android --profile production

# Build iOS Production Bundle for App Store:
eas build --platform ios --profile production

# ── One-Command Build & Submit (Automated) ───────────────
# Build and automatically submit to Google Play track:
eas build --platform android --profile production --auto-submit
```
