from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Message, Notification

@receiver(post_save, sender=Message)
def notify_crm_users(sender, instance, created, **kwargs):
    if created and instance.is_from_prospect:
        conversation = instance.conversation
        # Notify all CRM participants
        for user in conversation.participants.all():
            Notification.objects.create(
                user=user,
                title=f"Nouveau message de {conversation.client.nom_societe}",
                message=instance.content[:100],
                link=f"/chat"
            )
