import io
import sys
from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from xhtml2pdf import pisa

from .models import Devis, Facture
from chat.models import Notification
from users.models import CustomUser
from crm_core.models import Client


def generate_pdf_content(template_name, context):
    html_string = render_to_string(template_name, context)
    result = io.BytesIO()
    pdf = pisa.pisaDocument(io.BytesIO(html_string.encode("UTF-8")), result)
    if not pdf.err:
        return result.getvalue()
    return None


def send_devis_email(instance):
    subject = f"Votre devis SeeRM - {instance.numero}"
    message = f"Bonjour,\n\nVeuillez trouver ci-joint votre devis {instance.numero}.\nMontant total: {instance.total_ttc} FCFA.\n\nCordialement,\nL'equipe SeeRM."

    pdf_content = generate_pdf_content('finance/devis_pdf.html', {'devis': instance})

    email = EmailMessage(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [instance.client.email_principal],
    )
    if pdf_content:
        email.attach(f"devis_{instance.numero}.pdf", pdf_content, "application/pdf")

    email.send(fail_silently=False)


def send_facture_email(instance):
    subject = f"Votre facture SeeRM - {instance.numero}"
    message = f"Bonjour,\n\nVeuillez trouver ci-joint votre facture {instance.numero}.\nMontant total: {instance.total_ttc} FCFA.\n\nCordialement,\nL'equipe SeeRM."

    pdf_content = generate_pdf_content('finance/facture_pdf.html', {'facture': instance})

    email = EmailMessage(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [instance.client.email_principal],
    )
    if pdf_content:
        email.attach(f"facture_{instance.numero}.pdf", pdf_content, "application/pdf")

    email.send(fail_silently=False)


def create_document_notifications(instance, document_type, link):
    recipients = CustomUser.objects.filter(role__in=['ADMIN', 'FINANCE']).exclude(id=instance.owner_id)
    if instance.owner_id:
        owner = CustomUser.objects.filter(id=instance.owner_id).first()
        if owner:
            Notification.objects.create(
                user=owner,
                title=f"{document_type} envoye: {instance.numero}",
                message=f"Le {document_type.lower()} {instance.numero} a ete envoye a {instance.client.nom_societe}.",
                link=link,
            )
    for user in recipients:
        Notification.objects.create(
            user=user,
            title=f"{document_type} envoye: {instance.numero}",
            message=f"{instance.client.nom_societe} a recu le {document_type.lower()} {instance.numero}.",
            link=link,
        )

@receiver(post_save, sender=Client)
def notify_new_client(sender, instance, created, **kwargs):
    if created:
        subject = f"Bienvenue chez SeeRM - {instance.nom_societe}"
        message = f"Bonjour,\n\nNous sommes ravis de vous compter parmi nos nouveaux partenaires.\n\nCordialement,\nL'equipe SeeRM CRM."
        email = EmailMessage(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [instance.email_principal],
        )
        try:
            email.send(fail_silently=False)
            print(f"DEBUG: Welcome email sent to {instance.email_principal}")
        except Exception as e:
            print(f"ERROR sending welcome email: {e}", file=sys.stderr)


@receiver(pre_save, sender=Devis)
def track_devis_status(sender, instance, **kwargs):
    instance._should_send_email = False
    if not instance.pk:
        return
    previous = Devis.objects.filter(pk=instance.pk).values_list('statut', flat=True).first()
    instance._should_send_email = previous != 'ENVOYE' and instance.statut == 'ENVOYE'


@receiver(post_save, sender=Devis)
def notify_devis_update(sender, instance, created, **kwargs):
    if getattr(instance, '_should_send_email', False):
        try:
            transaction.on_commit(lambda: send_devis_email(instance))
            transaction.on_commit(lambda: create_document_notifications(instance, "Devis", "/finance"))
            print(f"DEBUG: Devis email queued for {instance.client.email_principal}")
        except Exception as e:
            print(f"ERROR sending devis email: {e}", file=sys.stderr)


@receiver(pre_save, sender=Facture)
def track_facture_status(sender, instance, **kwargs):
    instance._should_send_email = False
    if not instance.pk:
        return
    previous = Facture.objects.filter(pk=instance.pk).values_list('statut', flat=True).first()
    instance._should_send_email = previous != 'ENVOYE' and instance.statut == 'ENVOYE'


@receiver(post_save, sender=Facture)
def notify_facture_update(sender, instance, created, **kwargs):
    if getattr(instance, '_should_send_email', False):
        try:
            transaction.on_commit(lambda: send_facture_email(instance))
            transaction.on_commit(lambda: create_document_notifications(instance, "Facture", "/finance"))
            print(f"DEBUG: Facture email queued for {instance.client.email_principal}")
        except Exception as e:
            print(f"ERROR sending facture email: {e}", file=sys.stderr)
