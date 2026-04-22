from urllib.parse import urlparse

from allauth.socialaccount.models import SocialApp
from django.conf import settings
from django.contrib.sites.models import Site
from django.db import OperationalError, ProgrammingError


def _is_placeholder(value: str) -> bool:
    lowered = (value or "").strip().lower()
    return not lowered or lowered.startswith("your-google-")


def _backend_domain() -> str:
    parsed = urlparse(getattr(settings, "BACKEND_BASE_URL", "http://localhost:8000"))
    return parsed.netloc or "localhost:8000"


def ensure_google_social_app() -> tuple[bool, str]:
    client_id = getattr(settings, "GOOGLE_CLIENT_ID", "").strip()
    client_secret = getattr(settings, "GOOGLE_CLIENT_SECRET", "").strip()

    if _is_placeholder(client_id) or _is_placeholder(client_secret):
        return False, "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET non renseignes dans .env"

    try:
        site, _ = Site.objects.get_or_create(
            id=getattr(settings, "SITE_ID", 1),
            defaults={"domain": _backend_domain(), "name": "SeeRM"},
        )
        if site.domain != _backend_domain():
            site.domain = _backend_domain()
            site.name = "SeeRM"
            site.save(update_fields=["domain", "name"])

        app, _ = SocialApp.objects.get_or_create(
            provider="google",
            defaults={
                "name": "Google OAuth",
                "client_id": client_id,
                "secret": client_secret,
            },
        )
        changed = False
        if app.client_id != client_id:
            app.client_id = client_id
            changed = True
        if app.secret != client_secret:
            app.secret = client_secret
            changed = True
        if app.name != "Google OAuth":
            app.name = "Google OAuth"
            changed = True
        if changed:
            app.save()
        app.sites.add(site)
    except (OperationalError, ProgrammingError):
        return False, "Tables OAuth non disponibles (lance les migrations)."

    return True, "Google OAuth configure."
