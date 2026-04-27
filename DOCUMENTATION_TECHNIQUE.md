# 🏗️ Documentation Technique Complète - Plateforme SeeRM CRM

Ce document constitue la référence technique officielle pour le projet SeeRM. Il détaille l'architecture, les choix technologiques, les flux de données et les procédures de maintenance.

---

## 1. Architecture Globale
La plateforme repose sur une architecture **Découplée (Headless)** :
- **Backend** : API RESTful construite avec Django & Django REST Framework.
- **Frontend** : Application Single Page (SPA) développée avec React et TypeScript.
- **Temps Réel** : Couche WebSocket via Django Channels pour la communication bidirectionnelle.

---

## 2. Stack Technique Détaillée

### 🛠 Backend (Python 3.10+)
- **Framework** : Django 5.x
- **API** : Django REST Framework (DRF)
- **Authentification** : 
    - `dj-rest-auth` & `django-allauth` (Gestion des comptes et Social Login).
    - `djangorestframework-simplejwt` (Authentification par Token sans état).
- **Temps Réel** : `channels` & `channels-redis` (ou In-Memory pour le dev).
- **Base de données** : SQLite (Production-ready pour ce volume de données).
- **Génération PDF** : `xhtml2pdf` & `WeasyPrint`.

### ⚡ Frontend (React 18+)
- **Build Tool** : Vite (pour la rapidité du HMR).
- **Langage** : TypeScript (Assure la sécurité du typage sur les modèles financiers).
- **Gestion d'État** : `Zustand` (Plus performant et moins verbeux que Redux).
- **Routage** : `react-router-dom` v6.
- **Style** : `Tailwind CSS` (Utilitaire de style pour une UI cohérente).
- **Icônes** : `Lucide React`.
- **Appels API** : `Axios` avec intercepteurs pour la gestion automatique des tokens.

---

## 3. Fonctionnalités & Logique Métier

### 📂 Gestion des Clients (Module CRM)
- **Modèle `Client`** : Cœur du système. Lié aux utilisateurs via `client_link`.
- **Augmentation de la valeur** : 
    - La valeur d'un compte est calculée via la somme des montants des opportunités dont le statut est `GAGNE`.
    - Fonction clé : `wonRevenue` dans `ClientProfile.tsx`.
- **Portail Client** : Espace dédié où le client peut modifier son nom, son téléphone et son adresse. Ces modifications utilisent le endpoint `PATCH /api/clients/{id}/`.

### 💬 Système de Messagerie (Real-time Chat)
- **Protocole** : WebSockets.
- **Identification** : Les avatars affichés sont récupérés dynamiquement depuis le modèle `CustomUser` pour les membres de l'équipe, et via le `ClientSerializer` pour les clients.
- **Synchro Visuelle** : L'icône dans la liste des conversations utilise `avatar_url`. Si le client change sa photo dans son profil, elle est mise à jour partout instantanément.

### 💰 Module Finance (Devis & Factures)
- **Workflow** : 
    1. Création de Devis (Staff/Admin).
    2. Acceptation par le Client (Portail).
    3. Transformation en Facture (Signal Django ou action Admin).
- **Calculs** : Effectués en Frontend pour l'affichage (lib `currency.ts`) et validés en Backend pour la sécurité.

---

## 4. Guide des Fonctions Spécifiques

### Backend : `users.models.CustomUser`
- Étend `AbstractUser`.
- Ajoute `role` (ADMIN, MANAGER, SALES, CLIENT, etc.).
- Ajoute `avatar_url` pour la gestion des photos de profil.

### Backend : `crm_core.serializers.ClientSerializer`
- Utilise un `SerializerMethodField` nommé `get_avatar_url`.
- Cherche automatiquement la photo de l'utilisateur lié ayant le rôle `CLIENT` pour l'afficher sur la fiche entreprise.

### Frontend : `useAuthStore.ts`
- Gère l'initialisation de l'auth (`initAuth`).
- Stocke l'utilisateur en mémoire vive pour éviter les appels API redondants.
- Expose la fonction `can(module, action)` pour la gestion granulaire des permissions UI.

---

## 5. Procédures de Maintenance

### Création d'un Admin
```bash
python manage.py createsuperuser
# OU via le script setup_admin.py (voir historique)
```

### Mise à jour des librairies
```bash
pip install -r requirements.txt
npm install
```

### Sauvegarde des données
```bash
python manage.py dumpdata --indent 2 > data_dump_backup.json
```

---

## 6. Questions & Réponses (Q&A)

**Q : Comment changer le logo du site ?**
*R : Modifier le composant `Logo.tsx` dans `src/components/ui/`. Il utilise des SVG pour une netteté parfaite.*

**Q : Le client peut-il supprimer ses factures ?**
*R : Non. Les permissions (`permissions.py`) restreignent la suppression au rôle `ADMIN` et `FINANCE` uniquement.*

**Q : Comment ajouter un nouveau rôle ?**
*R : 1. Ajouter le rôle dans `CustomUser.ROLE_CHOICES` (Backend). 2. Mettre à jour `MODULE_PERMISSIONS` dans `permissions.py`. 3. Mettre à jour le type `AuthUser` dans `useAuthStore.ts` (Frontend).*

---

## 7. Sécurité
- **Row Level Security** : Dans les `ViewSets`, la méthode `get_queryset` est systématiquement surchargée pour filtrer les données afin qu'un utilisateur ne voie que ce qui lui appartient (ex: `filter(client=user.client_link)`).
- **JWT Protection** : Les tokens expirent après 60 minutes et nécessitent un `refresh_token` pour être renouvelés.

---
*Document généré le 27 Avril 2026 pour SeeRM CRM.*
