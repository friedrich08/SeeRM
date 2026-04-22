from rest_framework import serializers
from .models import Opportunity
from crm_core.serializers import ClientSerializer

class OpportunitySerializer(serializers.ModelSerializer):
    client_detail = ClientSerializer(source='client', read_only=True)
    
    class Meta:
        model = Opportunity
        fields = '__all__'
