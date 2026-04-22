from django.contrib import admin
from .models import Conversation, Message

class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ("timestamp",)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "created_at", "updated_at")
    search_fields = ("client__nom_societe",)
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("conversation", "sender", "is_from_prospect", "timestamp")
    search_fields = ("content", "conversation__client__nom_societe", "sender__email")
