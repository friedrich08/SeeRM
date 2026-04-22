from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from .models import Client, Contact
from .serializers import ClientSerializer, ContactSerializer
from users.permissions import ClientsPermission

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.none()
    serializer_class = ClientSerializer
    permission_classes = [ClientsPermission]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return Client.objects.all().order_by('-updated_at')
        return Client.objects.filter(owner=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.none()
    serializer_class = ContactSerializer
    permission_classes = [ClientsPermission]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return Contact.objects.all().order_by('-created_at')
        return Contact.objects.filter(client__owner=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        client = serializer.validated_data['client']
        if self.request.user.role != 'ADMIN' and client.owner_id != self.request.user.id:
            raise PermissionDenied("Vous ne pouvez pas ajouter un contact a ce client.")
        serializer.save()
