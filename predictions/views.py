from django.contrib.auth import authenticate
from django.shortcuts import render
from django.conf import settings
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.hashers import make_password
from django.shortcuts import get_object_or_404
from datetime import datetime
from io import BytesIO
from PIL import Image
import os
from rest_framework import generics, status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView
from predictions.models import Team
from predictions.serializers import TeamSerializer
from predictions.permissions import IsSaturdayBefore8PM
from .models import User, SeasonOverUnderPrediction, DivisionWinnerPrediction, WeeklyMatchup, WeeklyPrediction, SideBet, PostSeasonPrediction, SeasonDates
from .serializers import UserSerializer, SeasonOverUnderPredictionSerializer, DivisionWinnerPredictionSerializer, WeeklyMatchupSerializer, WeeklyPredictionSerializer, SideBetSerializer, PostSeasonPredictionSerializer
from .permissions import IsCommissionerOrAdmin, IsMatchupCreator

# Account Register and Login View Code 
class RegisterView(APIView):
    def post(self, request):
        if User.objects.filter(username=request.data['username']).exists():
            return Response({'detail': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=request.data['username'],
            email=request.data['email'],
            password=request.data['password']
        )
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class CheckUsernameView(APIView):
    def get(self, request, username, format=None):
        user_exists = User.objects.filter(username=username).exists()
        return Response({'isAvailable': not user_exists})
    
class CustomTokenObtainPairView(TokenObtainPairView):

    def post(self, request, *args, **kwargs):
        print(f"Received Username: {request.data.get('username')}, Received Password: {request.data.get('password')}")
        response = super().post(request, *args, **kwargs)
        print(f"Response Data: {response.data}")
        return response

class LoginView(APIView):
    def post(self, request):
        print(f"Received Username: {request.data['username']}, Received Password: {request.data['password']}")
        user = authenticate(
            username=request.data['username'],
            password=request.data['password']
        )
        print(f"Authenticated User: {user}")
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def put(self, request, *args, **kwargs):
        user = self.request.user
        mutable_data = request.data.copy()

        print("Before condition")  # Debugging line

        if 'password' in mutable_data:
            print("Inside condition")  # Debugging line
            user.set_password(mutable_data['password'])  # set_password will handle hashing
            user.save()
            mutable_data.pop('password')

        print("After condition")  # Debugging line

        serializer = UserSerializer(user, data=mutable_data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            # Generate new tokens for the user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': serializer.data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    if 'profile_picture' in request.FILES:
        # Add username to the uploaded file name
        new_file_name = f"{request.user.username}_{request.FILES['profile_picture'].name}"
        image = Image.open(request.FILES['profile_picture'])
        image = image.resize((400, 400), Image.LANCZOS)
        temp_image = BytesIO()
        image_format = request.FILES['profile_picture'].content_type.split('/')[-1]
        image.save(temp_image, format=image_format)
        temp_image.seek(0)
        request.FILES['profile_picture'].file = temp_image
        request.user.profile_picture.save(new_file_name, temp_image)
        request.user.save()
        return Response({'message': 'Profile picture updated successfully!', 'profile_picture': request.user.profile_picture.url}, status=200)
    return Response({'message': 'No profile picture uploaded.'}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_individual_pick(request):
    user = request.user
    matchup_id = request.data.get('matchupId')
    team_abbr = request.data.get('teamChoice')  # Team abbreviation from frontend
    is_locked = request.data.get('isLock')
    
    # Retrieve the corresponding WeeklyMatchup object
    matchup = get_object_or_404(WeeklyMatchup, id=matchup_id)
    
    # Convert the team abbreviation to "Home" or "Away"
    prediction = "Home" if matchup.home_team_abbr == team_abbr else "Away"
    
    # The rest of the code remains unchanged
    obj, created = WeeklyPrediction.objects.update_or_create(
        user=user,
        matchup=matchup,
        defaults={
            'prediction': prediction,  # Use the converted value
            'is_locked': is_locked
        },
    )

    if created:
        return Response({'status': 'Pick created successfully'})
    else:
        return Response({'status': 'Pick updated successfully'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_profile_picture(request):
    user = request.user

    # Delete the physical file if it's not the default
    if user.profile_picture and user.profile_picture.name != 'default.png':
        profile_pic_path = os.path.join(settings.MEDIA_ROOT, user.profile_picture.name)
        if os.path.exists(profile_pic_path) and 'default.png' not in profile_pic_path:
            os.remove(profile_pic_path)

    # Reset to default image
    user.profile_picture = 'default.png'
    user.save()

    return Response({'message': 'Profile picture deleted and reset to default.'}, status=status.HTTP_200_OK)

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def put(self, request, *args, **kwargs):
        user = self.request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            if 'new_password' in request.data:
                user.set_password(request.data['new_password'])  # Use set_password to hash the new password
                update_session_auth_hash(request, user)  # Update session so that user doesn't get logged out
            serializer.save()
            
            # Generate new tokens for the user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': serializer.data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
def get_current_week():
    today = datetime.today().date()
    start_date = SeasonDates.objects.get(name="Start").start_date
    wild_card_date = SeasonDates.objects.get(name="Wildcard").start_date
    divisional_date = SeasonDates.objects.get(name="Divisional").start_date
    conference_date = SeasonDates.objects.get(name="Conference").start_date
    super_bowl_date = SeasonDates.objects.get(name="Super Bowl").start_date

    if today < start_date:
        return "Season not started"
    elif today < wild_card_date:
        weeks_since_start = (today - start_date).days // 7 + 1
        return f"Week {weeks_since_start}"
    elif today < divisional_date:
        return "Wildcard"
    elif today < conference_date:
        return "Divisional"
    elif today < super_bowl_date:
        return "Conference"
    else:
        return "Super Bowl or beyond"

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_week_endpoint(request):
    current_week = get_current_week()
    return Response({"currentWeek": current_week})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_matchups(request, week):
    print(f"Received week: {week}")  # Debug statement
    matchups = WeeklyMatchup.objects.filter(week_number=week)
    print(f"Filtered matchups: {matchups}")  # Debug statement
    serializer = WeeklyMatchupSerializer(matchups, many=True)
    return Response({"matchups": serializer.data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_picks(request):    
    user = request.user
    week_str = request.data.get('week_number')  # This will be 'Week 6', for example
    week = int(week_str.split(' ')[1])  # Splits the string into ['Week', '6'] and then converts '6' to an integer
    new_picks = request.data.get('picks')

    print("Received new picks:", new_picks)

    # Validation: Check if there's already a lock or if more than 3 picks are made
    existing_picks = WeeklyPrediction.objects.filter(week_number=week, user=user)
    existing_locks = existing_picks.filter(is_locked=True)
    
    new_locks = [pick for pick_id, pick in new_picks.items() if pick.get('is_locked', False)]
    if len(existing_picks) + len(new_picks) > 3:
        return Response({"error": "You can make only 3 picks per week"}, status=status.HTTP_400_BAD_REQUEST)
    if len(existing_locks) + len(new_locks) > 1:
        return Response({"error": "Only one lock is allowed per week"}, status=status.HTTP_400_BAD_REQUEST)

    # Retrieve all matchups for the week
    matchups = WeeklyMatchup.objects.filter(week_number=week)
    abbr_to_home_away = {}
    for matchup in matchups:
        home_team = Team.objects.get(id=matchup.home_team_id)
        away_team = Team.objects.get(id=matchup.away_team_id)
        abbr_to_home_away[home_team.abbreviation] = "Home"
        abbr_to_home_away[away_team.abbreviation] = "Away"

    for matchup_id, choice_data in new_picks.items():
        print(f"Processing matchup_id: {matchup_id}, choice_data: {choice_data}")
        team_abbr = choice_data.get('prediction')
        is_locked = choice_data.get('is_locked', False)  # Default to False if not provided
        prediction = abbr_to_home_away.get(team_abbr, "Invalid")

        WeeklyPrediction.objects.update_or_create(
            user=user,
            week_number=week,
            matchup_id=matchup_id,
            defaults={
                'prediction': prediction,
                'is_locked': is_locked
            },
        )

    return Response({'status': 'Picks submitted successfully'})


# Serializer View Code 
class TeamListView(generics.ListCreateAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

class TeamDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class SeasonOverUnderPredictionListView(generics.ListCreateAPIView):
    queryset = SeasonOverUnderPrediction.objects.all()
    serializer_class = SeasonOverUnderPredictionSerializer
    permission_classes = [IsCommissionerOrAdmin]

class SeasonOverUnderPredictionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SeasonOverUnderPrediction.objects.all()
    serializer_class = SeasonOverUnderPredictionSerializer
    permission_classes = [IsCommissionerOrAdmin]

class DivisionWinnerPredictionListView(generics.ListCreateAPIView):
    queryset = DivisionWinnerPrediction.objects.all()
    serializer_class = DivisionWinnerPredictionSerializer
    permission_classes = [IsCommissionerOrAdmin]

class DivisionWinnerPredictionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DivisionWinnerPrediction.objects.all()
    serializer_class = DivisionWinnerPredictionSerializer
    permission_classes = [IsCommissionerOrAdmin]

class WeeklyMatchupListView(generics.ListCreateAPIView):
    serializer_class = WeeklyMatchupSerializer
    permission_classes = [IsCommissionerOrAdmin]
    
    def get_queryset(self):
        queryset = WeeklyMatchup.objects.all()
        week = self.request.query_params.get('week', None)
        
        if week:
            # Extract just the number part from 'Week 4'
            week_number = week.split(' ')[1] if ' ' in week else week
            queryset = queryset.filter(week_number=week_number)
        
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({
            "use_abbreviation": self.request.query_params.get('use_abbreviation', 'false').lower() == 'true'
        })
        return context
    
    def create(self, request, *args, **kwargs):
        print(f"Received data: {request.data}")  # Debugging line
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            print(f"Validated data: {serializer.validated_data}")  # Debugging line
            instance = serializer.save()  # Save the instance first so we can modify it
            instance.created_by = request.user  # Set the created_by field to the current user
            instance.save()  # Save the instance again to update the database record
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            print(f"Serializer errors: {serializer.errors}")  # Debugging line
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class WeeklyMatchupDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = WeeklyMatchup.objects.all()
    serializer_class = WeeklyMatchupSerializer
    permission_classes = [IsMatchupCreator]

class WeeklyPredictionListView(generics.ListCreateAPIView):
    queryset = WeeklyPrediction.objects.all()
    serializer_class = WeeklyPredictionSerializer
    permission_classes = [IsSaturdayBefore8PM]

    def create(self, request, *args, **kwargs):
        user_predictions = WeeklyPrediction.objects.filter(user=request.user, matchup__week_number=kwargs['week_number']).count()
        if user_predictions >= 3:
            return Response({"detail": "You can make only 3 predictions per week."}, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class WeeklyPredictionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = WeeklyPrediction.objects.all()
    serializer_class = WeeklyPredictionSerializer

class SideBetListView(generics.ListCreateAPIView):
    queryset = SideBet.objects.all()
    serializer_class = SideBetSerializer

class SideBetDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SideBet.objects.all()
    serializer_class = SideBetSerializer

class PostSeasonPredictionListView(generics.ListCreateAPIView):
    queryset = PostSeasonPrediction.objects.all()
    serializer_class = PostSeasonPredictionSerializer

    def create(self, request, *args, **kwargs):
        round = request.data.get('round')
        user_predictions = PostSeasonPrediction.objects.filter(user=request.user, round=round).count()
        if round == 'Wildcard' and user_predictions >= 4:
            return Response({"detail": "You can make a maximum of 4 predictions for the Wildcard round."}, status=status.HTTP_400_BAD_REQUEST)
        elif round in ['Divisional', 'Conference'] and user_predictions >= 2:
            return Response({"detail": f"You can make a maximum of 2 predictions for the {round} round."}, status=status.HTTP_400_BAD_REQUEST)
        elif round == 'Super Bowl' and user_predictions >= 1:
            return Response({"detail": "You can make only 1 prediction for the Super Bowl."}, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)

class PostSeasonPredictionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PostSeasonPrediction.objects.all()
    serializer_class = PostSeasonPredictionSerializer

class ExistingPicksListView(generics.ListAPIView):
    serializer_class = WeeklyPredictionSerializer

    def get_queryset(self):
        user = self.request.user
        week_str = self.request.query_params.get('week', None)

        # Validate and extract the week number
        if week_str is None or not week_str.startswith('Week '):
            return WeeklyPrediction.objects.none()  # Return an empty queryset or handle error
        week = int(week_str.split(' ')[1])  # Extract the week number and convert to int

        return WeeklyPrediction.objects.filter(week_number=week, user=user)
