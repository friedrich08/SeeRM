from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import GoogleCallbackJWTView, MeView, RegisterView, SystemStatusView, TestEmailView

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="auth_me"),
    path("auth/google/callback/", GoogleCallbackJWTView.as_view(), name="google_callback_jwt"),
    path("system/status/", SystemStatusView.as_view(), name="system_status"),
    path("system/test-email/", TestEmailView.as_view(), name="test_email"),
]
