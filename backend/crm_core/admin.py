from django.contrib import admin
from .models import Client, Contact

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("nom_societe", "email_principal", "telephone", "type_client", "updated_at")
    search_fields = ("nom_societe", "email_principal", "siret")
    list_filter = ("type_client", "created_at")


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("prenom", "nom", "client", "email", "telephone_direct", "poste")
    search_fields = ("prenom", "nom", "email", "client__nom_societe")
