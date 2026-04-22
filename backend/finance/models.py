from django.db import models
from crm_core.models import Client
import datetime

class DocumentBase(models.Model):
    STATUS_CHOICES = (
        ('BROUILLON', 'Brouillon'),
        ('ENVOYE', 'Envoyé'),
        ('ACCEPTE', 'Accepté'),
        ('PAYE', 'Payé'),
        ('REFUSE', 'Refusé'),
    )
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    numero = models.CharField(max_length=50, unique=True)
    date_emission = models.DateField(default=datetime.date.today)
    date_echeance = models.DateField(blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='BROUILLON')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    @property
    def total_ht(self):
        return sum(item.total_ligne for item in self.lignes.all())

    @property
    def total_ttc(self):
        return sum(item.total_ligne_ttc for item in self.lignes.all())

class Devis(DocumentBase):
    def save(self, *args, **kwargs):
        if not self.numero:
            # Simple auto-numbering logic: DEV-YYYY-XXXX
            year = datetime.date.today().year
            last_devis = Devis.objects.filter(numero__contains=f'DEV-{year}').order_by('-id').first()
            if last_devis:
                last_num = int(last_devis.numero.split('-')[-1])
                self.numero = f'DEV-{year}-{(last_num + 1):04d}'
            else:
                self.numero = f'DEV-{year}-0001'
        super().save(*args, **kwargs)

    class Meta:
        verbose_name_plural = "Devis"

class Facture(DocumentBase):
    devis_origine = models.ForeignKey(Devis, on_delete=models.SET_NULL, null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.numero:
            year = datetime.date.today().year
            last_fact = Facture.objects.filter(numero__contains=f'FAC-{year}').order_by('-id').first()
            if last_fact:
                last_num = int(last_fact.numero.split('-')[-1])
                self.numero = f'FAC-{year}-{(last_num + 1):04d}'
            else:
                self.numero = f'FAC-{year}-0001'
        super().save(*args, **kwargs)

class LigneArticle(models.Model):
    # One line can belong to either a Devis or a Facture
    devis = models.ForeignKey(Devis, on_delete=models.CASCADE, related_name='lignes', null=True, blank=True)
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='lignes', null=True, blank=True)
    designation = models.CharField(max_length=255)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    quantite = models.PositiveIntegerField(default=1)
    tva_taux = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)

    @property
    def total_ligne(self):
        return self.prix_unitaire * self.quantite

    @property
    def total_ligne_ttc(self):
        return self.total_ligne * (1 + self.tva_taux / 100)
