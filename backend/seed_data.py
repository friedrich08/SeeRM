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
            ("admin@relatel.tg", "Admin", "Relatel", True, "ADMIN"),
            ("sales@relatel.tg", "Awa", "Mensah", False, "SALES"),
            ("finance@relatel.tg", "Kodjo", "Ameko", False, "FINANCE"),
            ("support@relatel.tg", "Sena", "Tete", False, "SUPPORT"),
            ("manager@relatel.tg", "Komi", "Ablode", False, "MANAGER"),
            ("ops@relatel.tg", "Mawuena", "Koffi", False, "SALES"),
        ]
        for email, first_name, last_name, is_admin, role in users_data:
            if is_admin:
                user, _ = CustomUser.objects.get_or_create(
                    email=email,
                    defaults={
                        "first_name": first_name,
                        "last_name": last_name,
                        "role": role,
                        "is_staff": True,
                        "is_superuser": True,
                    },
                )
                user.role = role
                user.set_password("Admin@12345")
                user.save()
            else:
                user = CustomUser.objects.create_user(
                    email=email,
                    password="Relatel@123",
                    first_name=first_name,
                    last_name=last_name,
                    role=role,
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
            (
                "TVT (Television Togolaise)",
                "22810000000007",
                "Quartier Administratif, Lome",
                "info@tvt.tg",
                "+228 22 21 32 32",
                "CLIENT",
            ),
        ]
        clients = []
        sales_users = []
        for u in users:
            if not u.is_superuser:
                sales_users.append(u)

        for nom_societe, siret, adresse, email, telephone, type_client in clients_payload:
            owner = sales_users[len(clients) % len(sales_users)]
            clients.append(
                Client.objects.create(
                    nom_societe=nom_societe,
                    siret=siret,
                    adresse=adresse,
                    email_principal=email,
                    telephone=telephone,
                    type_client=type_client,
                    owner=owner,
                )
            )

        client_accounts = {
            "CEET": "client.ceet@relatel.tg",
            "Lome Business School (LBS)": "client.lbs@relatel.tg",
            "Cannalbox": "client.cannalbox@relatel.tg",
            "Ecobank": "client.ecobank@relatel.tg",
            "Yas Togo": "client.yas@relatel.tg",
            "Togo Digital Services": "client.tds@relatel.tg",
            "TVT (Television Togolaise)": "client.tvt@relatel.tg",
        }
        for client in clients:
            email = client_accounts.get(client.nom_societe)
            if not email:
                continue
            account = CustomUser.objects.create_user(
                email=email,
                password="Client@123",
                first_name=client.nom_societe.split()[0][:30],
                last_name="Client",
                role="CLIENT",
            )
            account.client_link = client
            account.save()

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
            ("Audit cybersecurite", clients[0], Decimal("9500000"), "PERDU", "NORMAL", today - datetime.timedelta(days=12)),
            ("Refonte CRM multicanal", clients[3], Decimal("18000000"), "GAGNE", "HIGH", today - datetime.timedelta(days=4)),
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
                owner=client.owner,
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
            devis_created.append(Devis.objects.create(client=client, statut=statut, notes=notes, owner=client.owner))

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
            factures.append(
                Facture.objects.create(client=client, devis_origine=devis_origine, statut=statut, owner=client.owner)
            )

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

        conversation_threads = {
            "CEET": [
                (True, "Bonjour, ou en est le devis final CEET ?"),
                (False, "Nous finalisons les derniers ajustements reseau ce matin."),
                (True, "Parfait. Nous voulons aussi une option de support etendu le soir."),
                (False, "C'est note. Je vous ajoute une variante avec astreinte 18h-22h."),
                (True, "Merci, il nous faudra aussi le planning de deploiement par site."),
                (False, "Je vous partage un planning detaille avec les 5 sites prioritaires avant 16h."),
            ],
            "Lome Business School (LBS)": [
                (True, "Pouvez-vous confirmer les dates de formation LBS ?"),
                (False, "Oui, debut le 15 du mois prochain avec deux cohortes."),
                (True, "Nous preferons concentrer les ateliers sur trois jours complets."),
                (False, "Possible. Je passe le programme en format intensif et je vous renvoie le support."),
                (True, "Ajoutez aussi une session pour l'equipe admissions."),
                (False, "D'accord, je l'integre dans le planning revise."),
            ],
            "Cannalbox": [
                (True, "Nous souhaitons renegocier la phase 2."),
                (False, "D'accord, on ajuste le scope et le budget."),
                (True, "Le comite prefere demarrer par deux sites pilotes au lieu de cinq."),
                (False, "Bonne approche. Je reduis le lot initial et je recalcule le montant."),
                (True, "Gardez quand meme l'option multi-sites dans le devis."),
                (False, "Oui, je la laisse en variante dans la proposition commerciale."),
            ],
            "Ecobank": [
                (True, "Le comite Ecobank valide sous reserve juridique."),
                (False, "Parfait, nous partageons les documents aujourd'hui."),
                (True, "L'equipe conformite veut revoir la clause de retention des donnees."),
                (False, "Je fais passer un avenant avec la nouvelle clause cet apres-midi."),
                (True, "Merci. On vise une signature avant vendredi."),
                (False, "C'est jouable, je pousse le juridique de notre cote."),
            ],
            "Yas Togo": [
                (True, "Yas demande un pilote plus court."),
                (False, "On peut proposer un pilote sur 6 semaines."),
                (True, "Il faut aussi limiter la premiere vague a l'equipe B2B Lome."),
                (False, "Compris. Je segmente le pilote et je retire les agences regionales."),
                (True, "Envoyez-nous la nouvelle version du planning aujourd'hui si possible."),
                (False, "Je vous l'envoie avant 17h avec les jalons revus."),
            ],
            "Togo Digital Services": [
                (True, "Pouvez-vous activer une astreinte weekend ?"),
                (False, "Oui, l'option est disponible dans l'avenant."),
                (True, "Nous voulons un point hebdomadaire de suivi avec vos operations."),
                (False, "Je planifie un comite chaque mardi matin avec support et delivery."),
                (True, "Tres bien. Ajoutez aussi un reporting mensuel sur les incidents."),
                (False, "C'est prevu, avec SLA, volume et temps moyen de resolution."),
            ],
            "TVT (Television Togolaise)": [
                (True, "Quel est le statut de l'audit TVT ?"),
                (False, "L'audit est en cours de finalisation."),
                (True, "La direction veut surtout la synthese des risques prioritaires."),
                (False, "Nous aurons un executive summary avec les 10 points critiques."),
                (True, "Ajoutez aussi les actions rapides a lancer sous 30 jours."),
                (False, "Oui, elles seront separees entre quick wins et chantiers structurants."),
            ],
        }
        for client in clients:
            conv = Conversation.objects.create(client=client)
            conv.participants.add(client.owner, users[0], *CustomUser.objects.filter(role='ADMIN'))
            linked_client_user = CustomUser.objects.filter(role='CLIENT', client_link=client).first()
            if linked_client_user:
                conv.participants.add(linked_client_user)
            for is_from_prospect, content in conversation_threads.get(client.nom_societe, []):
                Message.objects.create(
                    conversation=conv,
                    sender=None if is_from_prospect else client.owner,
                    content=content,
                    is_from_prospect=is_from_prospect,
                )

    print("Done. Database populated with fresh demo data.")
    print("Admin user: admin@relatel.tg / Admin@12345")
    print("Demo user: sales@relatel.tg / Relatel@123")


if __name__ == "__main__":
    populate()
