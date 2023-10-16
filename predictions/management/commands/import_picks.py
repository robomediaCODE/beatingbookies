from django.core.management.base import BaseCommand
import csv
from competition.models import Player, Game, Pick, Team

class Command(BaseCommand):
    help = 'Import weekly picks and their points from CSV'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file containing the picks and points.')

    def handle(self, *args, **kwargs):
        csv_file_path = kwargs['csv_file']

        with open(csv_file_path, mode='r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                player_name = row['Player']
                week_number = int(row['Week'])
                game_repr = row['Game']
                selected_team_abbr = row['SelectedTeam']
                is_lock = row['IsLock'].lower() == 'true'
                spread_from_csv = float(row['Spread'])
                points_earned = int(row['Points'])

                # Retrieve the related instances from the DB
                player = Player.objects.get(user__username=player_name)
                home_team, away_team = game_repr.split(" vs ")
                game = Game.objects.get(week_number=week_number, home_team__abbreviation=home_team, away_team__abbreviation=away_team, spread=spread_from_csv)
                selected_team = Team.objects.get(abbreviation=selected_team_abbr)

                # Create the Pick instance
                Pick.objects.create(
                    player=player,
                    game=game,
                    selected_team=selected_team,
                    points=points_earned, 
                    is_lock=is_lock  # Save the lock information
                )

                self.stdout.write(self.style.SUCCESS(f'Successfully imported pick for {player_name} for game {game_repr}'))
