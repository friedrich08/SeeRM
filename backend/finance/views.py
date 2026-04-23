from django.http import HttpResponse
from django.template.loader import render_to_string
from xhtml2pdf import pisa
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Devis, Facture
from .serializers import DevisSerializer, FactureSerializer
from users.permissions import FinancePermission
import io

class DevisViewSet(viewsets.ModelViewSet):
    queryset = Devis.objects.none()
    serializer_class = DevisSerializer
    permission_classes = [FinancePermission]

    def get_permissions(self):
        if self.action == 'accept':
            return [IsAuthenticated()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        if self.request.user.role in ('ADMIN', 'FINANCE'):
            queryset = Devis.objects.all()
        elif self.request.user.role == 'CLIENT' and self.request.user.client_link_id:
            queryset = Devis.objects.filter(client_id=self.request.user.client_link_id)
        else:
            queryset = Devis.objects.filter(owner=self.request.user)
            
        client_id = self.request.query_params.get('client')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
            
        return queryset.order_by('-updated_at')

    def perform_create(self, serializer):
        client = serializer.validated_data['client']
        if self.request.user.role not in ('ADMIN', 'FINANCE') and client.owner_id != self.request.user.id:
            raise PermissionDenied("Vous ne pouvez pas creer un devis pour ce client.")
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        devis = self.get_object()
        if request.user.role != 'CLIENT' or request.user.client_link_id != devis.client_id:
            raise PermissionDenied("Vous ne pouvez pas accepter ce devis.")
        devis.statut = 'ACCEPTE'
        devis.save(update_fields=['statut', 'updated_at'])
        return Response(self.get_serializer(devis).data)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        devis = self.get_object()
        html_string = render_to_string('finance/devis_pdf.html', {'devis': devis})
        
        result = io.BytesIO()
        pdf = pisa.pisaDocument(io.BytesIO(html_string.encode("UTF-8")), result)

        if not pdf.err:
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="devis_{devis.numero}.pdf"'
            return response
        
        return HttpResponse("Erreur lors de la génération du PDF", status=400)

class FactureViewSet(viewsets.ModelViewSet):
    queryset = Facture.objects.none()
    serializer_class = FactureSerializer
    permission_classes = [FinancePermission]

    def get_queryset(self):
        if self.request.user.role in ('ADMIN', 'FINANCE'):
            queryset = Facture.objects.all()
        elif self.request.user.role == 'CLIENT' and self.request.user.client_link_id:
            queryset = Facture.objects.filter(client_id=self.request.user.client_link_id)
        else:
            queryset = Facture.objects.filter(owner=self.request.user)
            
        client_id = self.request.query_params.get('client')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
            
        return queryset.order_by('-updated_at')

    def perform_create(self, serializer):
        client = serializer.validated_data['client']
        if self.request.user.role not in ('ADMIN', 'FINANCE') and client.owner_id != self.request.user.id:
            raise PermissionDenied("Vous ne pouvez pas creer une facture pour ce client.")
        
        devis_origine = serializer.validated_data.get('devis_origine')
        if devis_origine and self.request.user.role not in ('ADMIN', 'FINANCE') and devis_origine.owner_id != self.request.user.id:
            raise PermissionDenied("Devis d'origine non autorise.")
            
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        facture = self.get_object()
        html_string = render_to_string('finance/facture_pdf.html', {'facture': facture})
        
        result = io.BytesIO()
        pdf = pisa.pisaDocument(io.BytesIO(html_string.encode("UTF-8")), result)

        if not pdf.err:
            response = HttpResponse(result.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="facture_{facture.numero}.pdf"'
            return response
        
        return HttpResponse("Erreur lors de la génération du PDF", status=400)
