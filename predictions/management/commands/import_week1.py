import csv
from django.core.management import BaseCommand
from competition.models import Game, Team

class Command(BaseCommand):
    help = 'Import Week 1 data from a CSV file using team abbreviations'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='The path to the CSV file')

    def handle(self, *args, **kwargs):
        csv_file_path = kwargs['csv_file']

        with open(csv_file_path, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Look up teams by abbreviation
                home_team = Team.objects.get(abbreviation=row['home_team'])
                away_team = Team.objects.get(abbreviation=row['away_team'])

                Game.objects.create(
                    week_number=row['week_number'],
                    home_team=home_team,
                    away_team=away_team,
                    spread=row['spread'],
                    favored_team=row['favored_team']
                )

            self.stdout.write(self.style.SUCCESS('Data imported successfully using team abbreviations'))
