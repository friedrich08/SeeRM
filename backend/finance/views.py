from django.http import HttpResponse
from django.template.loader import render_to_string
from xhtml2pdf import pisa
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from .models import Devis, Facture
from .serializers import DevisSerializer, FactureSerializer
from users.permissions import FinancePermission
import io

class DevisViewSet(viewsets.ModelViewSet):
    queryset = Devis.objects.none()
    serializer_class = DevisSerializer
    permission_classes = [FinancePermission]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return Devis.objects.all().order_by('-updated_at')
        return Devis.objects.filter(owner=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        client = serializer.validated_data['client']
        if self.request.user.role != 'ADMIN' and client.owner_id != self.request.user.id:
            raise PermissionDenied("Vous ne pouvez pas creer un devis pour ce client.")
        serializer.save(owner=self.request.user)

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
        if self.request.user.role == 'ADMIN':
            return Facture.objects.all().order_by('-updated_at')
        return Facture.objects.filter(owner=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        client = serializer.validated_data['client']
        if self.request.user.role != 'ADMIN' and client.owner_id != self.request.user.id:
            raise PermissionDenied("Vous ne pouvez pas creer une facture pour ce client.")
        
        devis_origine = serializer.validated_data.get('devis_origine')
        if devis_origine and self.request.user.role != 'ADMIN' and devis_origine.owner_id != self.request.user.id:
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
