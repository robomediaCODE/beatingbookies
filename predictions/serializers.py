from rest_framework import serializers
from .models import Team, User, SeasonOverUnderPrediction, DivisionWinnerPrediction, WeeklyMatchup, WeeklyPrediction, SideBet, PostSeasonPrediction
from django.contrib.auth.hashers import make_password


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    new_password = serializers.CharField(write_only=True, required=False, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'new_password', 'profile_picture', 'role')
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'email': {'required': False}
        }

    def update(self, instance, validated_data):
        new_password = validated_data.pop('new_password', None)
        
        # If 'new_password' exists, hash it before saving
        if new_password:
            new_password = make_password(new_password)
        
        instance = super().update(instance, validated_data)
        
        if new_password:
            instance.set_password(new_password)
            instance.save()
            print(f"Hashed password in serializer: {validated_data.get('password', 'Not Provided')}")
        
        return instance

class SeasonOverUnderPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeasonOverUnderPrediction
        fields = '__all__'

class DivisionWinnerPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DivisionWinnerPrediction
        fields = '__all__'

class WeeklyMatchupSerializer(serializers.ModelSerializer):
    home_team_display = serializers.SerializerMethodField()
    away_team_display = serializers.SerializerMethodField()
    created_by = created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = WeeklyMatchup
        fields = ('id', 'home_team', 'away_team', 'home_team_display', 'away_team_display', 'home_team_spread', 'away_team_spread', 'week_number', 'created_by')

    def get_home_team_display(self, obj):
        if self.context.get('use_abbreviation'):
            return obj.home_team.abbreviation
        return obj.home_team.name

    def get_away_team_display(self, obj):
        if self.context.get('use_abbreviation'):
            return obj.away_team.abbreviation
        return obj.away_team.name

class WeeklyPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyPrediction
        fields = '__all__'

class SideBetSerializer(serializers.ModelSerializer):
    class Meta:
        model = SideBet
        fields = '__all__'

    def validate(self, data):
        if data['related_matchup'] and data['related_team']:
            raise serializers.ValidationError("A side bet can't have both a related matchup and a related team.")
        if not data['related_matchup'] and not data['related_team']:
            raise serializers.ValidationError("A side bet must have either a related matchup or a related team.")
        return data

class PostSeasonPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostSeasonPrediction
        fields = '__all__'