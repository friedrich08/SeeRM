from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .social_oauth import ensure_google_social_app


@receiver(post_migrate)
def sync_google_oauth_config(sender, **kwargs):
    ensure_google_social_app()
