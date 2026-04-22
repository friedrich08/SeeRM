import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "relatel_prj.settings")
django.setup()

from users.models import CustomUser
from crm_core.models import Client

def create_client_user():
    lbs = Client.objects.filter(nom_societe__icontains='LBS').first()
    if not lbs:
        print("LBS Client not found")
        return
        
    user, created = CustomUser.objects.get_or_create(
        email='client@lbs.tg',
        defaults={
            'first_name': 'Contact',
            'last_name': 'LBS',
            'role': 'CLIENT',
            'client_link': lbs
        }
    )
    
    user.role = 'CLIENT'
    user.client_link = lbs
    user.set_password('SeeRM@2026')
    user.save()
    print(f"Client user created/updated: {user.email} linked to {lbs.nom_societe}")

if __name__ == "__main__":
    create_client_user()
