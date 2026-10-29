"""
Google Forms Manager for Himnario El Buen Pastor
Automates creating and updating Google Forms via Google Forms API v1.
"""
import os
import sys
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

BASE_DIR = Path(__file__).resolve().parent
CREDENTIALS_FILE = BASE_DIR / "credentials.json"
TOKEN_FILE = BASE_DIR / "token.json"
AUTH_URL_FILE = BASE_DIR / "auth_url.txt"

SCOPES = [
    "https://www.googleapis.com/auth/forms.body",
    "https://www.googleapis.com/auth/forms.responses.readonly",
    "https://www.googleapis.com/auth/drive.file",
]


def get_forms_service():
    """Authenticates the user and returns the Google Forms API service client."""
    creds = None
    if TOKEN_FILE.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
        except Exception as e:
            print(f"Warning loading token: {e}", flush=True)
            creds = None

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception:
                creds = None

        if not creds:
            if not CREDENTIALS_FILE.exists():
                raise FileNotFoundError(
                    f"Credentials file missing at: {CREDENTIALS_FILE}\n"
                    "Please download credentials.json from Google Cloud Console."
                )
            flow = InstalledAppFlow.from_client_secrets_file(
                str(CREDENTIALS_FILE), SCOPES
            )
            # Try to start local server on port 8080
            # Open browser via OS command or print URL
            port = 8080
            flow.redirect_uri = f"http://localhost:{port}/"
            auth_url, _ = flow.authorization_url(prompt="consent", access_type="offline")

            print(f"\n==========================================", flush=True)
            print(f"AUTHORIZATION URL:", flush=True)
            print(f"{auth_url}", flush=True)
            print(f"==========================================\n", flush=True)

            with open(AUTH_URL_FILE, "w", encoding="utf-8") as f:
                f.write(auth_url)

            # Try to launch browser on Windows
            try:
                os.system(f'start "" "{auth_url}"')
            except Exception:
                pass

            creds = flow.run_local_server(
                port=port,
                open_browser=False,
                authorization_prompt_message="Open this link to authorize: {url}",
                success_message="Authentication complete! You can close this tab and return to the IDE."
            )

        with open(TOKEN_FILE, "w", encoding="utf-8") as token_out:
            token_out.write(creds.to_json())
        print(f"Token saved successfully to {TOKEN_FILE}", flush=True)

    return build("forms", "v1", credentials=creds)


def create_form(title: str, description: str = ""):
    """Creates a new form and returns basic metadata."""
    service = get_forms_service()
    form_body = {
        "info": {
            "title": title,
            "documentTitle": title,
        }
    }
    form = service.forms().create(body=form_body).execute()
    form_id = form["formId"]

    if description:
        service.forms().batchUpdate(
            formId=form_id,
            body={
                "requests": [
                    {
                        "updateFormInfo": {
                            "info": {"description": description},
                            "updateMask": "description",
                        }
                    }
                ]
            },
        ).execute()

    edit_url = f"https://docs.google.com/forms/d/{form_id}/edit"
    view_url = form.get("responderUri", f"https://docs.google.com/forms/d/e/{form_id}/viewform")
    embed_url = f"{view_url}?embedded=true"

    return {
        "formId": form_id,
        "title": title,
        "editUrl": edit_url,
        "responderUri": view_url,
        "embedUrl": embed_url,
    }


def add_questions_to_form(form_id: str, items: list):
    """Adds questions/items to an existing form using batchUpdate."""
    service = get_forms_service()
    requests = []

    for index, item in enumerate(items):
        requests.append({
            "createItem": {
                "item": item,
                "location": {"index": index}
            }
        })

    if requests:
        return service.forms().batchUpdate(formId=form_id, body={"requests": requests}).execute()
    return {}


def test_auth():
    print("Testing Google Forms API connection...", flush=True)
    get_forms_service()
    print("Successfully connected to Google Forms API!", flush=True)
    return True


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--auth-only":
        test_auth()
    else:
        print("Google Forms Manager ready.", flush=True)
