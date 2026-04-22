from rest_framework import serializers, viewsets
from rest_framework.exceptions import PermissionDenied
from .models import Conversation, Message
from crm_core.serializers import ClientSerializer
from users.permissions import ChatPermission

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
    queryset = Conversation.objects.none()
    serializer_class = ConversationSerializer
    permission_classes = [ChatPermission]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user).distinct().order_by('-updated_at')

    def perform_create(self, serializer):
        client = serializer.validated_data['client']
        if client.owner_id != self.request.user.id:
            raise PermissionDenied("Conversation non autorisee pour ce client.")
        conversation = serializer.save()
        conversation.participants.add(self.request.user)
