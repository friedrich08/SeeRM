from rest_framework import serializers
from .models import Client, Contact, ClientNote

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'


class ClientNoteSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source='author.email', read_only=True)

    class Meta:
        model = ClientNote
        fields = '__all__'
        read_only_fields = ('author',)

class ClientSerializer(serializers.ModelSerializer):
    contacts = ContactSerializer(many=True, read_only=True)
    notes = ClientNoteSerializer(many=True, read_only=True)
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ('owner',)

    def get_avatar_url(self, obj):
        # Return the avatar of the first linked user with role CLIENT
        user = obj.linked_users.filter(role='CLIENT').first()
        if user and user.avatar_url:
            return user.avatar_url
        return None
