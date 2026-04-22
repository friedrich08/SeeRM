from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from .models import Opportunity
from .serializers import OpportunitySerializer
from users.permissions import PipelinePermission

class OpportunityViewSet(viewsets.ModelViewSet):
    queryset = Opportunity.objects.none()
    serializer_class = OpportunitySerializer
    permission_classes = [PipelinePermission]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            queryset = Opportunity.objects.all()
        else:
            queryset = Opportunity.objects.filter(owner=self.request.user)
            
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
            
        client_id = self.request.query_params.get('client')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
            
        return queryset.order_by('-updated_at')

    def perform_create(self, serializer):
        client = serializer.validated_data['client']
        if self.request.user.role != 'ADMIN' and client.owner_id != self.request.user.id:
            raise PermissionDenied("Vous ne pouvez pas creer une opportunite pour ce client.")
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        client = serializer.validated_data.get('client')
        if client and self.request.user.role != 'ADMIN' and client.owner_id != self.request.user.id:
            raise PermissionDenied("Client non autorise pour cette opportunite.")
        serializer.save()
