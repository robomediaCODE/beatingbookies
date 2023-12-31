# Generated by Django 4.2.5 on 2023-10-07 23:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('predictions', '0004_alter_user_profile_picture'),
    ]

    operations = [
        migrations.AddField(
            model_name='weeklyprediction',
            name='week',
            field=models.PositiveIntegerField(null=True),
        ),
        migrations.AlterField(
            model_name='seasondates',
            name='name',
            field=models.CharField(choices=[('Start', 'Start'), ('Wildcard', 'Wildcard'), ('Divisional', 'Divisional'), ('Conference', 'Conference'), ('Super Bowl', 'Super Bowl')], max_length=20),
        ),
    ]
