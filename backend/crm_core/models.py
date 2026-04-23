from django.db import models
from django.conf import settings

class Client(models.Model):
    TYPES = (
        ('PROSPECT', 'Prospect'),
        ('CLIENT', 'Client'),
    )
    nom_societe = models.CharField('nom de la société', max_length=255)
    siret = models.CharField('SIRET', max_length=14, blank=True, null=True)
    adresse = models.TextField('adresse', blank=True, null=True)
    email_principal = models.EmailField('email principal')
    telephone = models.CharField('téléphone', max_length=20, blank=True, null=True)
    type_client = models.CharField('type', max_length=20, choices=TYPES, default='PROSPECT')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='clients', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom_societe

class Contact(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='contacts')
    prenom = models.CharField('prénom', max_length=100)
    nom = models.CharField('nom', max_length=100)
    email = models.EmailField('email')
    telephone_direct = models.CharField('téléphone direct', max_length=20, blank=True, null=True)
    poste = models.CharField('poste', max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.client.nom_societe})"


class ClientNote(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='notes')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='client_notes')
    content = models.TextField('note interne')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note interne - {self.client.nom_societe}"
