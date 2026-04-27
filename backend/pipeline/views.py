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
        user = self.request.user
        # All roles except CLIENT can see everything in the pipeline for now, 
        # or we can restrict more based on user.role if needed.
        # Following PipelinePermission 'read' which allows all staff roles.
        if user.role in ('ADMIN', 'MANAGER', 'SALES', 'FINANCE', 'SUPPORT'):
            queryset = Opportunity.objects.all()
        elif user.role == 'CLIENT':
            if user.client_link:
                queryset = Opportunity.objects.filter(client=user.client_link)
            else:
                queryset = Opportunity.objects.none()
        else:
            queryset = Opportunity.objects.filter(owner=user)
            
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
            
        client_id = self.request.query_params.get('client')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
            
        return queryset.order_by('-updated_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'CLIENT':
            raise PermissionDenied("Les clients ne peuvent pas creer d'opportunites.")
        
        client = serializer.validated_data['client']
        # Staff can create for anyone, or we could add more specific checks
        serializer.save(owner=user)

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'CLIENT':
            raise PermissionDenied("Les clients ne peuvent pas modifier les opportunites.")
        
        # Staff roles can update
        serializer.save()
