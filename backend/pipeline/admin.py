from django.contrib import admin
from .models import Opportunity

@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ("titre", "client", "montant_estime", "statut", "priorite", "date_echeance")
    search_fields = ("titre", "client__nom_societe")
    list_filter = ("statut", "priorite")
