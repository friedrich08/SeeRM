from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, ContactViewSet, ClientNoteViewSet
from .analytics import DashboardStatsView, AnalyticsClientView

router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'contacts', ContactViewSet)
router.register(r'client-notes', ClientNoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('analytics-clients/', AnalyticsClientView.as_view(), name='analytics_clients'),
]
