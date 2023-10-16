from django.core.management.base import BaseCommand, CommandError
import csv
from competition.models import Player, Team, DivisionWinner

class Command(BaseCommand):
    help = 'Imports division winners from a given CSV file'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='The path to the CSV file to import.')

    def handle(self, *args, **kwargs):
        csv_file_path = kwargs['csv_file']

        with open(csv_file_path, mode='r') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                player_name = row['Player']
                player = Player.objects.get(user__username=player_name)
                
                divisions = ['East', 'West', 'North', 'South']
                conferences = ['AFC', 'NFC']

                for conference in conferences:
                    for division in divisions:
                        team_abbreviation = row[conference + '_' + division]
                        team = Team.objects.get(abbreviation=team_abbreviation)
                        score = int(row[conference + '_' + division + '_Score'])

                        DivisionWinner.objects.create(
                            player=player,
                            selected_team=team,
                            score=score,
                            conference=conference,
                            division=division
                        )
            self.stdout.write(self.style.SUCCESS('Successfully imported division winners from the CSV file.'))
