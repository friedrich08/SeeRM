import os
import datetime
from decimal import Decimal

import django
from django.db import transaction

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "relatel_prj.settings")
django.setup()

from chat.models import Conversation, Message
from crm_core.models import Client, Contact
from finance.models import Devis, Facture, LigneArticle
from pipeline.models import Opportunity
from users.models import CustomUser


def populate() -> None:
    print("Reset and populate database...")

    with transaction.atomic():
        Message.objects.all().delete()
        Conversation.objects.all().delete()
        LigneArticle.objects.all().delete()
        Facture.objects.all().delete()
        Devis.objects.all().delete()
        Opportunity.objects.all().delete()
        Contact.objects.all().delete()
        Client.objects.all().delete()
        CustomUser.objects.filter(is_superuser=False).delete()

        users = []
        users_data = [
            ("admin@relatel.tg", "Admin", "Relatel", True),
            ("sales@relatel.tg", "Awa", "Mensah", False),
            ("finance@relatel.tg", "Kodjo", "Ameko", False),
            ("support@relatel.tg", "Sena", "Tete", False),
            ("manager@relatel.tg", "Komi", "Ablode", False),
            ("ops@relatel.tg", "Mawuena", "Koffi", False),
        ]
        for email, first_name, last_name, is_admin in users_data:
            if is_admin:
                user, _ = CustomUser.objects.get_or_create(
                    email=email,
                    defaults={
                        "first_name": first_name,
                        "last_name": last_name,
                        "is_staff": True,
                        "is_superuser": True,
                    },
                )
                user.set_password("Admin@12345")
                user.save()
            else:
                user = CustomUser.objects.create_user(
                    email=email,
                    password="Relatel@123",
                    first_name=first_name,
                    last_name=last_name,
                )
            users.append(user)

        clients_payload = [
            ("CEET", "22810000000001", "Avenue de la Liberation, Lome", "contact@ceet.tg", "+228 22 21 10 00", "CLIENT"),
            (
                "Lome Business School (LBS)",
                "22810000000002",
                "Agoe, Lome",
                "relations@lbs.tg",
                "+228 22 51 00 00",
                "CLIENT",
            ),
            (
                "Cannalbox",
                "22810000000003",
                "Boulevard Eyadema, Lome",
                "pro@cannalbox.tg",
                "+228 22 23 45 67",
                "PROSPECT",
            ),
            (
                "Ecobank",
                "22810000000004",
                "Rue du Commerce, Lome",
                "corporate@ecobank.tg",
                "+228 22 21 03 03",
                "CLIENT",
            ),
            ("Yas Togo", "22810000000005", "Boulevard du Mono, Lome", "b2b@yas.tg", "+228 22 20 80 80", "PROSPECT"),
            (
                "Togo Digital Services",
                "22810000000006",
                "Adidogome, Lome",
                "hello@tds.tg",
                "+228 22 33 44 55",
                "PROSPECT",
            ),
        ]
        clients = []
        for nom_societe, siret, adresse, email, telephone, type_client in clients_payload:
            clients.append(
                Client.objects.create(
                    nom_societe=nom_societe,
                    siret=siret,
                    adresse=adresse,
                    email_principal=email,
                    telephone=telephone,
                    type_client=type_client,
                )
            )

        contacts_payload = [
            (clients[0], "Komi", "Kangni", "komi.kangni@ceet.tg", "+228 90 01 02 03", "Directeur IT"),
            (clients[1], "Afi", "Adjevi", "afi.adjevi@lbs.tg", "+228 90 11 22 33", "Responsable partenariats"),
            (clients[2], "Yao", "Mensah", "yao.mensah@cannalbox.tg", "+228 90 44 55 66", "Responsable commercial"),
            (clients[3], "Amele", "Aho", "amele.aho@ecobank.tg", "+228 90 77 88 99", "Head Digital"),
            (clients[4], "Kokou", "Tse", "kokou.tse@yas.tg", "+228 91 22 33 44", "Chef de projet B2B"),
            (clients[5], "Dede", "Azia", "dede.azia@tds.tg", "+228 91 55 66 77", "Operations"),
        ]
        for client, prenom, nom, email, telephone_direct, poste in contacts_payload:
            Contact.objects.create(
                client=client,
                prenom=prenom,
                nom=nom,
                email=email,
                telephone_direct=telephone_direct,
                poste=poste,
            )

        today = datetime.date.today()
        opportunities_payload = [
            ("Migration SI de facturation", clients[0], Decimal("22000000"), "QUALIFICATION", "HIGH", today + datetime.timedelta(days=20)),
            ("Programme executif CRM campus", clients[1], Decimal("8500000"), "PROPOSITION", "NORMAL", today + datetime.timedelta(days=35)),
            ("Contrat fibre entreprise multi-sites", clients[2], Decimal("14500000"), "NEGOCIATION", "HIGH", today + datetime.timedelta(days=18)),
            ("Plateforme onboarding corporate", clients[3], Decimal("31000000"), "PROPOSITION", "HIGH", today + datetime.timedelta(days=27)),
            ("Campagne acquisition B2B", clients[4], Decimal("12000000"), "PROSPECT", "NORMAL", today + datetime.timedelta(days=15)),
            ("Support applicatif annuel", clients[5], Decimal("6800000"), "GAGNE", "LOW", today + datetime.timedelta(days=10)),
        ]
        for titre, client, montant_estime, statut, priorite, date_echeance in opportunities_payload:
            Opportunity.objects.create(
                titre=titre,
                client=client,
                montant_estime=montant_estime,
                statut=statut,
                priorite=priorite,
                date_echeance=date_echeance,
                description=f"Dossier {titre} en FCFA.",
            )

        devis_payload = [
            (clients[0], "ENVOYE", "Projet modernisation reseau CEET."),
            (clients[1], "ACCEPTE", "Mise en place CRM formation LBS."),
            (clients[2], "BROUILLON", "Backbone entreprises Cannalbox."),
            (clients[3], "ENVOYE", "Onboarding et scoring Ecobank."),
            (clients[4], "REFUSE", "Automatisation service client Yas Togo."),
            (clients[5], "ACCEPTE", "Maintenance et monitoring TDS."),
        ]
        devis_created = []
        for client, statut, notes in devis_payload:
            devis_created.append(Devis.objects.create(client=client, statut=statut, notes=notes))

        devis_lines = [
            (devis_created[0], "Audit infrastructures", Decimal("3500000"), 1),
            (devis_created[0], "Implementation solution", Decimal("8900000"), 2),
            (devis_created[1], "Licences CRM", Decimal("1200000"), 4),
            (devis_created[1], "Formation equipe", Decimal("450000"), 6),
            (devis_created[2], "Etude couverture reseau", Decimal("980000"), 3),
            (devis_created[3], "Integration API bancaire", Decimal("4200000"), 2),
            (devis_created[4], "Pack omnicanal", Decimal("2100000"), 2),
            (devis_created[5], "Supervision mensuelle", Decimal("600000"), 12),
        ]
        for devis, designation, prix_unitaire, quantite in devis_lines:
            LigneArticle.objects.create(
                devis=devis,
                designation=designation,
                prix_unitaire=prix_unitaire,
                quantite=quantite,
                tva_taux=Decimal("18.00"),
            )

        factures = []
        facture_payload = [
            (clients[0], devis_created[0], "PAYE"),
            (clients[1], devis_created[1], "PAYE"),
            (clients[2], devis_created[2], "ENVOYE"),
            (clients[3], devis_created[3], "ACCEPTE"),
            (clients[4], devis_created[4], "BROUILLON"),
            (clients[5], devis_created[5], "ENVOYE"),
        ]
        for client, devis_origine, statut in facture_payload:
            factures.append(Facture.objects.create(client=client, devis_origine=devis_origine, statut=statut))

        facture_lines = [
            (factures[0], "Maintenance preventive", Decimal("1100000"), 3),
            (factures[1], "Ateliers utilisateurs", Decimal("450000"), 5),
            (factures[2], "Installation routeurs", Decimal("1800000"), 2),
            (factures[3], "Securisation API", Decimal("2500000"), 2),
            (factures[4], "Module messagerie", Decimal("900000"), 4),
            (factures[5], "Support 24/7", Decimal("700000"), 6),
        ]
        for facture, designation, prix_unitaire, quantite in facture_lines:
            LigneArticle.objects.create(
                facture=facture,
                designation=designation,
                prix_unitaire=prix_unitaire,
                quantite=quantite,
                tva_taux=Decimal("18.00"),
            )

        conv_texts = [
            ("Bonjour, ou en est le devis final CEET ?", "Nous vous l'envoyons cet apres-midi."),
            ("Pouvez-vous confirmer les dates de formation LBS ?", "Oui, debut le 15 du mois prochain."),
            ("Nous souhaitons renegocier la phase 2.", "D'accord, on ajuste le scope et le budget."),
            ("Le comite Ecobank valide sous reserve juridique.", "Parfait, nous partageons les documents aujourd'hui."),
            ("Yas demande un pilote plus court.", "On peut proposer un pilote sur 6 semaines."),
            ("Pouvez-vous activer une astreinte weekend ?", "Oui, l'option est disponible dans l'avenant."),
        ]
        for idx, client in enumerate(clients):
            conv = Conversation.objects.create(client=client)
            conv.participants.add(users[(idx % (len(users) - 1)) + 1], users[0])
            Message.objects.create(conversation=conv, sender=None, content=conv_texts[idx][0], is_from_prospect=True)
            Message.objects.create(
                conversation=conv,
                sender=users[(idx % (len(users) - 1)) + 1],
                content=conv_texts[idx][1],
                is_from_prospect=False,
            )

    print("Done. Database populated with fresh demo data.")
    print("Admin user: admin@relatel.tg / Admin@12345")
    print("Demo user: sales@relatel.tg / Relatel@123")


if __name__ == "__main__":
    populate()
