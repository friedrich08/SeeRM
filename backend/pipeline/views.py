from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Opportunity
from .serializers import OpportunitySerializer

class OpportunityViewSet(viewsets.ModelViewSet):
    queryset = Opportunity.objects.all()
    serializer_class = OpportunitySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Opportunity.objects.all()
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        return queryset
