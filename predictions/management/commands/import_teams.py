from django.core.management.base import BaseCommand
import csv
from predictions.models import Team

class Command(BaseCommand):
    help = 'Import teams from a CSV file'

    def handle(self, *args, **kwargs):
        with open('C:\\Projects\\BeatingBookies\\predictions\\management\\commands\\teams.csv', 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                Team.objects.create(
                    abbreviation=row['abbreviation'],
                    name=row['name'],
                    conference=row['conference'],
                    division=row['division']
                )
            self.stdout.write(self.style.SUCCESS('Successfully imported teams!'))
