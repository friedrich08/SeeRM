from django.conf import settings
from django.core.mail import send_mail
from django.shortcuts import redirect
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser

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
                "avatar_url": user.avatar_url,
                "client_link": user.client_link_id,
                "permissions": build_permissions_payload(user),
            }
        )

    def patch(self, request):
        user = request.user
        data = request.data

        if "first_name" in data:
            user.first_name = data["first_name"]
        if "last_name" in data:
            user.last_name = data["last_name"]
        if "avatar_url" in data:
            user.avatar_url = data["avatar_url"]
        if "email" in data:
            email = data["email"].strip().lower()
            if email and email != user.email:
                if CustomUser.objects.filter(email=email).exclude(id=user.id).exists():
                    return Response({"detail": "Cet email est déjà utilisé."}, status=status.HTTP_400_BAD_REQUEST)
                user.email = email
        
        if "password" in data and data["password"]:
            if len(data["password"]) < 8:
                return Response({"detail": "Le mot de passe doit contenir au moins 8 caractères."}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(data["password"])

        user.save()
        return Response(
            {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "avatar_url": user.avatar_url,
                "client_link": user.client_link_id,
            }
        )


class ProfileAvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if 'avatar' not in request.FILES:
            return Response({"detail": "Aucun fichier n'a été fourni."}, status=status.HTTP_400_BAD_REQUEST)
        
        avatar = request.FILES['avatar']
        user = request.user
        
        # Simple file validation
        if not avatar.name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            return Response({"detail": "Format de fichier non supporté."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Save file to media folder
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        import uuid
        
        ext = avatar.name.split('.')[-1]
        filename = f"avatars/{user.id}_{uuid.uuid4().hex}.{ext}"
        path = default_storage.save(filename, ContentFile(avatar.read()))
        
        # Update user avatar_url
        # If BACKEND_BASE_URL is not set, use a relative path or a default
        backend_base = getattr(settings, "BACKEND_BASE_URL", "http://localhost:8000").rstrip("/")
        user.avatar_url = f"{backend_base}{settings.MEDIA_URL}{path}"
        user.save()
        
        return Response({"avatar_url": user.avatar_url})


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
    authentication_classes = []

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
                subject="Test email SeeRM CRM",
                message="Ceci est un test d'envoi email depuis la page Parametres SeeRM.",
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@seerm.tg"),
                recipient_list=[to_email],
                fail_silently=False,
            )
            if sent_count == 0:
                return Response({"detail": "Aucun email n'a ete envoye."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"detail": "Email de test envoye avec succes."})
        except Exception as exc:
            return Response({"detail": f"Echec d'envoi: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
