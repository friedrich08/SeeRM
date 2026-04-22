import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import Conversation, Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        self.user = await self.get_user_from_token()

        if not self.user:
            await self.close(code=4401)
            return

        allowed = await self.user_can_access_conversation(self.room_name, self.user.id)
        if not allowed:
            await self.close(code=4403)
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        sender_id = self.user.id if self.user else None
        is_from_prospect = text_data_json.get('is_from_prospect', False)

        # Save message to database
        await self.save_message(self.room_name, message, sender_id, is_from_prospect)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': sender_id,
                'is_from_prospect': is_from_prospect
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'is_from_prospect': event['is_from_prospect']
        }))

    @database_sync_to_async
    def save_message(self, conversation_id, content, sender_id, is_from_prospect):
        try:
            conv = Conversation.objects.get(id=conversation_id)
            Message.objects.create(
                conversation=conv,
                content=content,
                sender_id=sender_id,
                is_from_prospect=is_from_prospect
            )
        except Exception as e:
            print(f"Error saving message: {e}")

    @database_sync_to_async
    def get_user_from_token(self):
        token = None
        try:
            query_string = self.scope.get('query_string', b'').decode()
            token = parse_qs(query_string).get('token', [None])[0]
            if not token:
                return None
            access = AccessToken(token)
            user_id = access.get('user_id')
            if not user_id:
                return None
            user_model = get_user_model()
            return user_model.objects.filter(id=user_id).first()
        except (InvalidToken, TokenError, ValueError):
            return None

    @database_sync_to_async
    def user_can_access_conversation(self, conversation_id, user_id):
        return Conversation.objects.filter(id=conversation_id, participants__id=user_id).exists()
