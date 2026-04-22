import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import Conversation, Message
from crm_core.models import Client

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        
        query_string = self.scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        
        self.user = await self.get_user_from_token(params)

        if not self.user:
            await self.close(code=4401)
            return

        # Verification des accès
        if self.user.role == 'CLIENT':
            # Un client ne peut se connecter qu'à sa propre conversation
            # La room_name doit correspondre au client_link_id ou on cherche la conversation liée
            allowed = await self.client_can_access_room(self.user, self.room_name)
            if not allowed:
                await self.close(code=4403)
                return
        else:
            # Staff CRM
            allowed = await self.user_can_access_conversation(self.room_name, self.user.id)
            if not allowed:
                await self.close(code=4403)
                return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        
        is_from_prospect = False
        if self.user.role == 'CLIENT':
            is_from_prospect = True

        # Save message
        await self.save_message(self.room_name, message, self.user.id, is_from_prospect)

        # Send to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': self.user.id,
                'is_from_prospect': is_from_prospect
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'is_from_prospect': event['is_from_prospect']
        }))

    @database_sync_to_async
    def save_message(self, conversation_id, content, sender_id, is_from_prospect):
        try:
            Message.objects.create(
                conversation_id=conversation_id,
                content=content,
                sender_id=sender_id,
                is_from_prospect=is_from_prospect
            )
        except Exception as e:
            print(f"Error saving message: {e}")

    @database_sync_to_async
    def get_user_from_token(self, params):
        try:
            token = params.get('token', [None])[0]
            if not token:
                return None
            access = AccessToken(token)
            user_id = access.get('user_id')
            user_model = get_user_model()
            return user_model.objects.filter(id=user_id).first()
        except:
            return None

    @database_sync_to_async
    def user_can_access_conversation(self, conversation_id, user_id):
        return Conversation.objects.filter(id=conversation_id, participants__id=user_id).exists()

    @database_sync_to_async
    def client_can_access_room(self, user, conversation_id):
        # Le client doit avoir un client_link et ce lien doit correspondre au client de la conversation
        if not user.client_link:
            return False
        return Conversation.objects.filter(id=conversation_id, client=user.client_link).exists()
