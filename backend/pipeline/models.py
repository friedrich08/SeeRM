from django.db import models
from crm_core.models import Client

class Opportunity(models.Model):
    STATUS_CHOICES = (
        ('PROSPECT', 'Prospect'),
        ('QUALIFICATION', 'Qualification'),
        ('PROPOSITION', 'Proposition'),
        ('NEGOCIATION', 'Négociation'),
        ('GAGNE', 'Gagné'),
        ('PERDU', 'Perdu'),
    )
    
    PRIORITY_CHOICES = (
        ('LOW', 'Basse'),
        ('NORMAL', 'Normale'),
        ('HIGH', 'Haute'),
    )

    titre = models.CharField('titre de l\'affaire', max_length=255)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='opportunities')
    montant_estime = models.DecimalField('montant estimé', max_digits=12, decimal_places=2, default=0)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PROSPECT')
    priorite = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='NORMAL')
    date_echeance = models.DateField('date d\'échéance', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Opportunité"
        verbose_name_plural = "Opportunités"
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.titre} - {self.client.nom_societe}"
