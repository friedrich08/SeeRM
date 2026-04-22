from django.contrib import admin
from .models import Devis, Facture, LigneArticle

class LigneArticleInline(admin.TabularInline):
    model = LigneArticle
    extra = 0


@admin.register(Devis)
class DevisAdmin(admin.ModelAdmin):
    list_display = ("numero", "client", "statut", "date_emission", "date_echeance")
    search_fields = ("numero", "client__nom_societe")
    list_filter = ("statut",)
    inlines = [LigneArticleInline]


@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display = ("numero", "client", "statut", "date_emission", "date_echeance", "devis_origine")
    search_fields = ("numero", "client__nom_societe")
    list_filter = ("statut",)
    inlines = [LigneArticleInline]


@admin.register(LigneArticle)
class LigneArticleAdmin(admin.ModelAdmin):
    list_display = ("designation", "prix_unitaire", "quantite", "tva_taux", "devis", "facture")
    search_fields = ("designation",)
