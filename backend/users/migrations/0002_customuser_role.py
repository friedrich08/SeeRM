from django.db import migrations, models


def set_existing_roles(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    for user in CustomUser.objects.all():
        if user.is_superuser:
            user.role = 'ADMIN'
        else:
            user.role = 'SALES'
        user.save(update_fields=['role'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='role',
            field=models.CharField(
                choices=[
                    ('ADMIN', 'Administrateur'),
                    ('MANAGER', 'Manager'),
                    ('SALES', 'Commercial'),
                    ('FINANCE', 'Finance'),
                    ('SUPPORT', 'Support'),
                ],
                default='SALES',
                max_length=20,
            ),
        ),
        migrations.RunPython(set_existing_roles, migrations.RunPython.noop),
    ]
