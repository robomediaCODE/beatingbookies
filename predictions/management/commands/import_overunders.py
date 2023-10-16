from django.core.management.base import BaseCommand
import csv
from competition.models import Player, Team, OverUnder

class Command(BaseCommand):
    help = 'Import season over/under picks from CSV'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file containing the over/under picks.')

    def handle(self, *args, **kwargs):
        csv_file_path = kwargs['csv_file']

        with open(csv_file_path, mode='r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                player_name = row['Player']
                team_name = row['Team']
                over_under_points = float(row['OverUnderPoints'])
                over_under_pick = row['OverUnderPick']  # This is where we capture the 'Over' or 'Under' choice
                is_lock = row['IsLock'].lower() == 'true'
                
                # Get the necessary related objects from the DB
                player = Player.objects.get(user__username=player_name)
                team = Team.objects.get(name=team_name)

                # Create or update the OverUnder instance
                overunder, created = OverUnder.objects.update_or_create(
                    player=player,
                    team=team,
                    defaults={
                        'over_under_points': over_under_points,
                        'over_under_pick': over_under_pick,  # Ensure this choice is saved
                        'is_lock': is_lock
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f'Successfully created over/under pick for {player_name} for team {team_name}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Successfully updated over/under pick for {player_name} for team {team_name}'))
