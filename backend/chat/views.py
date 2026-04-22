from rest_framework import serializers, viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Conversation, Message, Notification
from crm_core.serializers import ClientSerializer
from users.permissions import ChatPermission

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

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
        user = self.request.user
        if user.role == 'CLIENT':
            if user.client_link:
                return Conversation.objects.filter(client=user.client_link).order_by('-updated_at')
            return Conversation.objects.none()
        return Conversation.objects.filter(participants=user).distinct().order_by('-updated_at')

    def perform_create(self, serializer):
        user = self.request.user
        client = serializer.validated_data['client']
        
        if user.role == 'CLIENT':
            if client != user.client_link:
                raise PermissionDenied("Vous ne pouvez pas créer de conversation pour un autre client.")
        elif client.owner_id != user.id and user.role != 'ADMIN':
            raise PermissionDenied("Conversation non autorisee pour ce client.")
            
        conversation = serializer.save()
        conversation.participants.add(user)
        # If it's the client creating it, ensure the owner is also a participant so they see it
        if user.role == 'CLIENT' and client.owner:
            conversation.participants.add(client.owner)
