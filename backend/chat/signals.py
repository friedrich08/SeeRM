from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Message, Notification
from users.models import CustomUser

@receiver(post_save, sender=Message)
def notify_crm_users(sender, instance, created, **kwargs):
    if created and instance.is_from_prospect:
        conversation = instance.conversation
        recipients = set(conversation.participants.all())
        if conversation.client.owner_id:
            owner = CustomUser.objects.filter(id=conversation.client.owner_id).first()
            if owner:
                recipients.add(owner)
        for admin in CustomUser.objects.filter(role='ADMIN'):
            recipients.add(admin)

        for user in recipients:
            if user.role == 'CLIENT':
                continue
            Notification.objects.create(
                user=user,
                title=f"Nouveau message de {conversation.client.nom_societe}",
                message=instance.content[:100],
                link=f"/chat"
            )
