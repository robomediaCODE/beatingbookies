from rest_framework import permissions
from datetime import datetime

class IsSaturdayBefore8PM(permissions.BasePermission):
    """
    Custom permission to check if the current time is before 8 PM on a Saturday.
    """
    def has_permission(self, request, view):
        now = datetime.now()
        is_saturday = now.weekday() == 5  # Monday is 0 and Sunday is 6
        is_before_8pm = now.hour < 20
        return is_saturday and is_before_8pm
    
    def has_object_permission(self, request, view, obj):
        # Check if the prediction belongs to the current user
        return obj.user == request.user
    
class IsCommissionerOrAdmin(permissions.BasePermission):
    """
    Custom permission to check if the user is a commissioner or an admin.
    """
    def has_permission(self, request, view):
        print("Inside IsCommissionerOrAdmin permission")
        print("User role:", request.user.role)
        return request.user.role in ['commissioner', 'admin']


class IsAdmin(permissions.BasePermission):
    """
    Custom permission to check if the user is an admin.
    """
    def has_permission(self, request, view):
        return request.user.role == 'admin'

class IsMatchupCreator(permissions.BasePermission):
    """
    Custom permission to check if the user created the matchup.
    """
    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user







