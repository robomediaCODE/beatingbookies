from django.urls import path
from predictions import views
from rest_framework_simplejwt.views import TokenRefreshView
from .views import upload_profile_picture

urlpatterns = [
    path('teams/', views.TeamListView.as_view(), name='team-list'),
    path('teams/<int:pk>/', views.TeamDetailView.as_view(), name='team-detail'),

    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),

    path('divisionwinnerpredictions/', views.DivisionWinnerPredictionListView.as_view(), name='divisionwinnerprediction-list'),
    path('divisionwinnerpredictions/<int:pk>/', views.DivisionWinnerPredictionDetailView.as_view(), name='divisionwinnerprediction-detail'),

    path('weeklymatchups/', views.WeeklyMatchupListView.as_view(), name='weeklymatchup-list'),
    path('weeklymatchups/<int:pk>/', views.WeeklyMatchupDetailView.as_view(), name='weeklymatchup-detail'),

    path('weeklypredictions/', views.WeeklyPredictionListView.as_view(), name='weeklyprediction-list'),
    path('weeklypredictions/<int:pk>/', views.WeeklyPredictionDetailView.as_view(), name='weeklyprediction-detail'),

    path('sidebets/', views.SideBetListView.as_view(), name='sidebet-list'),
    path('sidebets/<int:pk>/', views.SideBetDetailView.as_view(), name='sidebet-detail'),

    path('postseasonpredictions/', views.PostSeasonPredictionListView.as_view(), name='postseasonprediction-list'),
    path('postseasonpredictions/<int:pk>/', views.PostSeasonPredictionDetailView.as_view(), name='postseasonprediction-detail'),

    path('api/check-username/<str:username>/', views.CheckUsernameView.as_view(), name='check-username'),

    # JWT Authentication routes
    path('token/', views.CustomTokenObtainPairView.as_view(), name='custom_token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('users/me/', views.CurrentUserView.as_view(), name='current-user'),

    path('users/upload-profile-picture/', views.upload_profile_picture, name='upload-profile-picture'),

    path('users/<int:pk>/delete-profile-picture/', views.delete_profile_picture, name='delete-profile-picture'),

    path('users/delete-profile-picture/', views.delete_profile_picture, name='delete-profile-picture'),
    path('api/users/delete-profile-picture/', views.delete_profile_picture, name='delete-profile-picture'),

    path('currentWeek/', views.get_current_week_endpoint, name='current-week'),

    path('matchups/<int:week>/', views.get_matchups, name='get-matchups'),
    
    path('submitPicks/', views.submit_picks, name='submit-picks'),

    path('existingPicks/', views.ExistingPicksListView.as_view(), name='existing-picks'),

    # Add more paths as you define more views
]
