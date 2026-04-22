from rest_framework import serializers
from .models import Devis, Facture, LigneArticle
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

    def create(self, validated_data):
        lignes_data = self.context.get('request').data.get('lignes', [])
        devis = Devis.objects.create(**validated_data)
        for ligne_data in lignes_data:
            LigneArticle.objects.create(devis=devis, **ligne_data)
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

    def create(self, validated_data):
        lignes_data = self.context.get('request').data.get('lignes', [])
        facture = Facture.objects.create(**validated_data)
        for ligne_data in lignes_data:
            LigneArticle.objects.create(facture=facture, **ligne_data)
        return facture
