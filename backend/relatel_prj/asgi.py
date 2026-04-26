import os
import django
from django.core.asgi import get_asgi_application

# 1. On définit les settings en PREMIER
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'relatel_prj.settings')

# 2. On initialise Django
django.setup()

# 3. On importe le reste seulement APRÈS django.setup()
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import chat.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            chat.routing.websocket_urlpatterns
        )
    ),
})
