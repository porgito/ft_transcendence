# Generated by Django 4.2.8 on 2024-04-08 14:56

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('registration', '0008_tournament'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='blocked',
            field=models.ManyToManyField(related_name='blocked_list', to=settings.AUTH_USER_MODEL),
        ),
    ]
