from django.http import HttpResponse
from django.template.loader import render_to_string
from xhtml2pdf import pisa
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from .models import Devis, Facture
from .serializers import DevisSerializer, FactureSerializer
import io

class DevisViewSet(viewsets.ModelViewSet):
    queryset = Devis.objects.all()
    serializer_class = DevisSerializer
    permission_classes = [AllowAny]

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
    queryset = Facture.objects.all()
    serializer_class = FactureSerializer
    permission_classes = [AllowAny]
