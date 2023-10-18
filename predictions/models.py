from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.models import AbstractUser
    
class User(AbstractUser):
    role = models.CharField(max_length=50, choices=[('player', 'Player'), ('commissioner', 'Commissioner'), ('admin', 'Admin')])
    profile_picture = models.ImageField(upload_to='profile_pictures/', default='default.png')

class Team(models.Model):
    abbreviation = models.CharField(max_length=10)
    name = models.CharField(max_length=100)
    conference = models.CharField(max_length=50)
    division = models.CharField(max_length=50)

    def __str__(self):
        return f"({self.abbreviation}) {self.name}"

class SeasonOverUnderPrediction(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    spread = models.FloatField(default = 0)
    prediction = models.CharField(choices=[('Over', 'Over'), ('Under', 'Under')], max_length=5)
    is_locked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.team.name} ({self.prediction})"

class DivisionWinnerPrediction(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    is_locked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - Division Winner: {self.team.name}"

class WeeklyMatchup(models.Model):
    week_number = models.PositiveIntegerField()
    away_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='away_matches')
    home_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='home_matches')
    away_team_spread = models.FloatField()
    home_team_spread = models.FloatField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"Created By: {self.created_by} - Week {self.week_number} - Away: {self.away_team} vs Home: {self.home_team}"

class WeeklyPrediction(models.Model):
    week_number = models.PositiveIntegerField(null=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    matchup = models.ForeignKey(WeeklyMatchup, on_delete=models.CASCADE)
    prediction = models.CharField(choices=[('Home', 'Home'), ('Away', 'Away')], max_length=5)
    is_locked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.matchup} - User Pick - {self.prediction} - User Lock? - {self.is_locked}"

class SideBet(models.Model):
    proposing_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='proposed_bets')
    accepting_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='accepted_bets')
    related_matchup = models.ForeignKey(WeeklyMatchup, on_delete=models.CASCADE, null=True, blank=True)
    related_team = models.ForeignKey(Team, on_delete=models.CASCADE, null=True, blank=True)
    proposing_user_prediction = models.CharField(choices=[('Home', 'Home'), ('Away', 'Away'), ('Over', 'Over'), ('Under', 'Under')], max_length=5)

    def __str__(self):
        if self.related_matchup:
            return f"Side Bet: {self.proposing_user.username} vs. {self.accepting_user.username} - Week {self.related_matchup.week_number}"
        return f"Side Bet: {self.proposing_user.username} vs. {self.accepting_user.username} - {self.related_team.name}"

class PostSeasonPrediction(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    round = models.CharField(choices=[('Wildcard', 'Wildcard'), ('Divisional', 'Divisional'), ('Conference', 'Conference'), ('Super Bowl', 'Super Bowl')], max_length=20)
    matchup = models.ForeignKey(WeeklyMatchup, on_delete=models.CASCADE)
    prediction = models.CharField(choices=[('Home', 'Home'), ('Away', 'Away')], max_length=5)
    is_locked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.round} Prediction"
    
class SeasonDates(models.Model):
    name = models.CharField(choices=[('Start', 'Start'),('Wildcard', 'Wildcard'), ('Divisional', 'Divisional'), ('Conference', 'Conference'), ('Super Bowl', 'Super Bowl')], max_length=20)  # e.g., "Wildcard", "Divisional", "Conference", "Super Bowl", "Start"
    start_date = models.DateField()

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Season Dates"