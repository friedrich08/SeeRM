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
    lignes = LigneArticleSerializer(many=True, read_only=True)
    client_detail = ClientSerializer(source='client', read_only=True)
    total_ht = serializers.ReadOnlyField()
    total_ttc = serializers.ReadOnlyField()

    class Meta:
        model = Devis
        fields = '__all__'

class FactureSerializer(serializers.ModelSerializer):
    lignes = LigneArticleSerializer(many=True, read_only=True)
    client_detail = ClientSerializer(source='client', read_only=True)
    total_ht = serializers.ReadOnlyField()
    total_ttc = serializers.ReadOnlyField()

    class Meta:
        model = Facture
        fields = '__all__'
