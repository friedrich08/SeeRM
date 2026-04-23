from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncMonth
from crm_core.models import Client
from pipeline.models import Opportunity
from finance.models import Devis, Facture
from django.utils import timezone
import datetime

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Base Querysets
        if user.role in ('ADMIN', 'FINANCE'):
            clients = Client.objects.all()
            opps = Opportunity.objects.all()
            devis = Devis.objects.all()
            factures = Facture.objects.all()
        else:
            clients = Client.objects.filter(owner=user)
            opps = Opportunity.objects.filter(owner=user)
            devis = Devis.objects.filter(owner=user)
            factures = Facture.objects.filter(owner=user)

        # Basic KPI
        revenue_paye = sum(f.total_ttc for f in factures.filter(statut='PAYE'))
        pipeline_value = sum(o.montant_estime for o in opps.exclude(statut__in=['GAGNE', 'PERDU']))
        won_count = opps.filter(statut='GAGNE').count()
        total_opps = opps.count()
        conversion_rate = (won_count / total_opps * 100) if total_opps > 0 else 0

        # Monthly Trends (last 6 months)
        six_months_ago = timezone.now() - datetime.timedelta(days=180)
        monthly_revenue = (
            factures.filter(statut='PAYE', date_emission__gte=six_months_ago)
            .annotate(month=TruncMonth('date_emission'))
            .values('month')
            .annotate(total=Count('id')) # Placeholder for simple count, sum property is hard in aggregate
            .order_by('month')
        )
        
        # Better Monthly Revenue Trend
        revenue_trend = []
        for i in range(5, -1, -1):
            month_date = timezone.now().replace(day=1) - datetime.timedelta(days=i*30)
            m = month_date.month
            y = month_date.year
            val = sum(f.total_ttc for f in factures.filter(statut='PAYE', date_emission__month=m, date_emission__year=y))
            revenue_trend.append({
                "month": month_date.strftime("%b"),
                "revenue": float(val)
            })

        return Response({
            "kpi": {
                "total_revenue": float(revenue_paye),
                "pipeline_value": float(pipeline_value),
                "new_clients": clients.count(),
                "conversion_rate": round(conversion_rate, 1),
                "active_opportunities": opps.exclude(statut__in=['GAGNE', 'PERDU']).count()
            },
            "revenue_trend": revenue_trend,
            "opportunity_stats": {
                "prospect": opps.filter(statut='PROSPECT').count(),
                "qualification": opps.filter(statut='QUALIFICATION').count(),
                "proposition": opps.filter(statut='PROPOSITION').count(),
                "negociation": opps.filter(statut='NEGOCIATION').count(),
                "gagne": opps.filter(statut='GAGNE').count(),
                "perdu": opps.filter(statut='PERDU').count(),
            }
        })
