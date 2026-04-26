from django.db import transaction
from rest_framework import serializers
from .models import Devis, Facture, LigneArticle
from .signals import create_document_notifications, send_devis_email, send_facture_email
from crm_core.serializers import ClientSerializer

class LigneArticleSerializer(serializers.ModelSerializer):
    total_ligne = serializers.ReadOnlyField()
    total_ligne_ttc = serializers.ReadOnlyField()

    class Meta:
        model = LigneArticle
        fields = '__all__'

class DevisSerializer(serializers.ModelSerializer):
    lignes = LigneArticleSerializer(many=True, required=False)
    client_detail = ClientSerializer(source='client', read_only=True)
    total_ht = serializers.ReadOnlyField()
    total_ttc = serializers.ReadOnlyField()

    class Meta:
        model = Devis
        fields = '__all__'
        read_only_fields = ('owner',)
        extra_kwargs = {'numero': {'required': False}}

    def validate(self, attrs):
        if self.instance is not None:
            return attrs
        lignes_data = self.context.get('request').data.get('lignes', [])
        if not lignes_data:
            raise serializers.ValidationError({'lignes': "Au moins une ligne avec un prix est requise."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('lignes', None)
        lignes_data = self.context.get('request').data.get('lignes', [])
        devis = Devis.objects.create(**validated_data)
        for ligne_data in lignes_data:
            LigneArticle.objects.create(devis=devis, **ligne_data)
        if devis.statut == 'ENVOYE':
            transaction.on_commit(lambda: send_devis_email(devis))
            transaction.on_commit(lambda: create_document_notifications(devis, "Devis", "/finance"))
        return devis

class FactureSerializer(serializers.ModelSerializer):
    lignes = LigneArticleSerializer(many=True, required=False)
    client_detail = ClientSerializer(source='client', read_only=True)
    total_ht = serializers.ReadOnlyField()
    total_ttc = serializers.ReadOnlyField()

    class Meta:
        model = Facture
        fields = '__all__'
        read_only_fields = ('owner',)
        extra_kwargs = {'numero': {'required': False}}

    def validate(self, attrs):
        if self.instance is not None:
            return attrs
        lignes_data = self.context.get('request').data.get('lignes', [])
        if not lignes_data:
            raise serializers.ValidationError({'lignes': "Au moins une ligne avec un prix est requise."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('lignes', None)
        lignes_data = self.context.get('request').data.get('lignes', [])
        facture = Facture.objects.create(**validated_data)
        for ligne_data in lignes_data:
            LigneArticle.objects.create(facture=facture, **ligne_data)
        if facture.statut == 'ENVOYE':
            transaction.on_commit(lambda: send_facture_email(facture))
            transaction.on_commit(lambda: create_document_notifications(facture, "Facture", "/finance"))
        return facture
