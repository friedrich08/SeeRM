import io
import sys
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from xhtml2pdf import pisa

from .models import Devis, Facture
from crm_core.models import Client

def generate_pdf_content(template_name, context):
    html_string = render_to_string(template_name, context)
    result = io.BytesIO()
    pdf = pisa.pisaDocument(io.BytesIO(html_string.encode("UTF-8")), result)
    if not pdf.err:
        return result.getvalue()
    return None

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

@receiver(post_save, sender=Devis)
def notify_devis_update(sender, instance, created, **kwargs):
    if created or instance.statut == 'ENVOYE':
        subject = f"Votre devis SeeRM - {instance.numero}"
        message = f"Bonjour,\n\nVeuillez trouver ci-joint votre devis {instance.numero}.\n\nCordialement,\nL'equipe SeeRM."
        
        pdf_content = generate_pdf_content('finance/devis_pdf.html', {'devis': instance})
        
        email = EmailMessage(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [instance.client.email_principal],
        )
        if pdf_content:
            email.attach(f"devis_{instance.numero}.pdf", pdf_content, "application/pdf")
        
        try:
            email.send(fail_silently=False)
            print(f"DEBUG: Devis email sent to {instance.client.email_principal}")
        except Exception as e:
            print(f"ERROR sending devis email: {e}", file=sys.stderr)

@receiver(post_save, sender=Facture)
def notify_facture_update(sender, instance, created, **kwargs):
    if created or instance.statut == 'ENVOYE':
        subject = f"Votre facture SeeRM - {instance.numero}"
        message = f"Bonjour,\n\nVeuillez trouver ci-joint votre facture {instance.numero}.\n\nCordialement,\nL'equipe SeeRM."
        
        pdf_content = generate_pdf_content('finance/facture_pdf.html', {'facture': instance})
        
        email = EmailMessage(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [instance.client.email_principal],
        )
        if pdf_content:
            email.attach(f"facture_{instance.numero}.pdf", pdf_content, "application/pdf")
        
        try:
            email.send(fail_silently=False)
            print(f"DEBUG: Facture email sent to {instance.client.email_principal}")
        except Exception as e:
            print(f"ERROR sending facture email: {e}", file=sys.stderr)
