from django.db import models
from django.conf import settings
from crm_core.models import Client

class Conversation(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='conversations')
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Chat avec {self.client.nom_societe}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    content = models.TextField()
    is_from_prospect = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        sender_name = "Prospect" if self.is_from_prospect else (self.sender.email if self.sender else "Système")
        return f"{sender_name}: {self.content[:50]}"
