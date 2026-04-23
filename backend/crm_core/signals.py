import sys
from django.db.models.signals import post_save
from django.dispatch import receiver

from chat.models import Notification
from users.models import CustomUser
from .models import Client


@receiver(post_save, sender=Client)
def notify_internal_new_client(sender, instance, created, **kwargs):
    if not created:
        return

    recipients = CustomUser.objects.filter(role__in=['ADMIN', 'MANAGER', 'FINANCE']).exclude(id=instance.owner_id)
    for user in recipients:
        try:
            Notification.objects.create(
                user=user,
                title=f"Nouveau client: {instance.nom_societe}",
                message=f"{instance.nom_societe} a ete ajoute dans le CRM.",
                link=f"/clients/{instance.id}",
            )
        except Exception as exc:
            print(f"ERROR creating client notification: {exc}", file=sys.stderr)
