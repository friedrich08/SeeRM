from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, ContactViewSet
from .analytics import DashboardStatsView

router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'contacts', ContactViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
]
