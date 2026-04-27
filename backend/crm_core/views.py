from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Client, Contact, ClientNote
from .serializers import ClientSerializer, ContactSerializer, ClientNoteSerializer
from users.permissions import ClientsPermission

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.none()
    serializer_class = ClientSerializer
    permission_classes = [ClientsPermission]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Client.objects.all().order_by('-updated_at')
        if user.role == 'CLIENT':
            if user.client_link:
                return Client.objects.filter(id=user.client_link.id)
            return Client.objects.none()
        return Client.objects.filter(owner=user).order_by('-updated_at')

    def perform_create(self, serializer):
        if self.request.user.role == 'CLIENT':
            raise PermissionDenied("Les clients ne peuvent pas créer de fiches clients.")
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'CLIENT':
            if not user.client_link or serializer.instance.id != user.client_link.id:
                raise PermissionDenied("Vous ne pouvez modifier que votre propre fiche client.")
        serializer.save()

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.none()
    serializer_class = ContactSerializer
    permission_classes = [ClientsPermission]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Contact.objects.all().order_by('-created_at')
        if user.role == 'CLIENT':
            if user.client_link:
                return Contact.objects.filter(client=user.client_link).order_by('-created_at')
            return Contact.objects.none()
        return Contact.objects.filter(client__owner=user).order_by('-created_at')

    def perform_create(self, serializer):
        client = serializer.validated_data['client']
        if self.request.user.role != 'ADMIN' and client.owner_id != self.request.user.id:
            raise PermissionDenied("Vous ne pouvez pas ajouter un contact a ce client.")
        serializer.save()


class ClientNoteViewSet(viewsets.ModelViewSet):
    queryset = ClientNote.objects.none()
    serializer_class = ClientNoteSerializer
    permission_classes = [ClientsPermission]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return ClientNote.objects.all().order_by('-created_at')
        if user.role == 'CLIENT':
            if user.client_link:
                return ClientNote.objects.filter(client=user.client_link).order_by('-created_at')
            return ClientNote.objects.none()
        return ClientNote.objects.filter(client__owner=user).order_by('-created_at')

    def perform_create(self, serializer):
        client = serializer.validated_data['client']
        if self.request.user.role != 'ADMIN' and client.owner_id != self.request.user.id:
            raise PermissionDenied("Vous ne pouvez pas ajouter une note interne a ce client.")
        serializer.save(author=self.request.user)
