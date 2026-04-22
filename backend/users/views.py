from django.conf import settings
from django.core.mail import send_mail
from django.shortcuts import redirect
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser
from .permissions import SystemPermission, build_permissions_payload
from .social_oauth import ensure_google_social_app


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        first_name = (request.data.get("first_name") or "").strip()
        last_name = (request.data.get("last_name") or "").strip()

        if not email or not password:
            return Response({"detail": "Email et mot de passe sont obligatoires."}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 8:
            return Response({"detail": "Le mot de passe doit contenir au moins 8 caracteres."}, status=status.HTTP_400_BAD_REQUEST)
        if CustomUser.objects.filter(email=email).exists():
            return Response({"detail": "Cet email existe deja."}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "permissions": build_permissions_payload(user),
            }
        )


class GoogleCallbackJWTView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
        if not request.user.is_authenticated:
            return redirect(f"{frontend_url}/auth?google_error=unauthenticated")

        refresh = RefreshToken.for_user(request.user)
        access = str(refresh.access_token)
        return redirect(f"{frontend_url}/auth?access={access}&refresh={str(refresh)}")


class SystemStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        google_configured, google_note = ensure_google_social_app()
        email_ready = bool(getattr(settings, "DEFAULT_FROM_EMAIL", "")) and bool(getattr(settings, "EMAIL_BACKEND", ""))
        return Response(
            {
                "auth": {
                    "register_url": "/api/auth/register/",
                    "login_url": "/api/auth/login/",
                },
                "google_oauth": {
                    "configured": google_configured,
                    "login_url": "/accounts/google/login/?process=login",
                    "note": google_note,
                },
                "admin": {"url": "/admin/"},
                "email": {
                    "configured": email_ready,
                    "backend": getattr(settings, "EMAIL_BACKEND", ""),
                    "from_email": getattr(settings, "DEFAULT_FROM_EMAIL", ""),
                },
            }
        )


class TestEmailView(APIView):
    permission_classes = [IsAuthenticated, SystemPermission]

    def post(self, request):
        to_email = (request.data.get("to_email") or "").strip()
        if not to_email:
            return Response({"detail": "to_email est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sent_count = send_mail(
                subject="Test email Relatel CRM",
                message="Ceci est un test d'envoi email depuis la page Parametres.",
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@relatel.tg"),
                recipient_list=[to_email],
                fail_silently=False,
            )
            if sent_count == 0:
                return Response({"detail": "Aucun email n'a ete envoye."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"detail": "Email de test envoye avec succes."})
        except Exception as exc:
            return Response({"detail": f"Echec d'envoi: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
