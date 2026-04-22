import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Conversation, Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

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
        sender_id = text_data_json.get('sender_id')
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
