from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DevisViewSet, FactureViewSet

router = DefaultRouter()
router.register(r'devis', DevisViewSet)
router.register(r'factures', FactureViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
