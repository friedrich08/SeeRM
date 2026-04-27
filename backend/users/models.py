from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('L\'adresse email est obligatoire')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    ROLE_ADMIN = 'ADMIN'
    ROLE_MANAGER = 'MANAGER'
    ROLE_SALES = 'SALES'
    ROLE_FINANCE = 'FINANCE'
    ROLE_SUPPORT = 'SUPPORT'
    ROLE_CLIENT = 'CLIENT'
    
    ROLE_CHOICES = (
        (ROLE_ADMIN, 'Administrateur'),
        (ROLE_MANAGER, 'Manager'),
        (ROLE_SALES, 'Commercial'),
        (ROLE_FINANCE, 'Finance'),
        (ROLE_SUPPORT, 'Support'),
        (ROLE_CLIENT, 'Client'),
    )

    username = None
    email = models.EmailField('adresse email', unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_SALES)
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    
    # New field to link a User to a specific Client company
    client_link = models.ForeignKey(
        'crm_core.Client', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='linked_users'
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email
