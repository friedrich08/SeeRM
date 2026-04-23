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
    
    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ('owner',)
