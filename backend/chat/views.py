from rest_framework import serializers, viewsets
from rest_framework.permissions import AllowAny
from .models import Conversation, Message
from crm_core.serializers import ClientSerializer

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'content', 'is_from_prospect', 'timestamp', 'sender']

class ConversationSerializer(serializers.ModelSerializer):
    client_detail = ClientSerializer(source='client', read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Conversation
        fields = ['id', 'client', 'client_detail', 'messages']

class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [AllowAny]
