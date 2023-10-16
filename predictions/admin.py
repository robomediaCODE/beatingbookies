from django.contrib import admin
from .models import Team, WeeklyMatchup, WeeklyPrediction, SideBet, PostSeasonPrediction, SeasonOverUnderPrediction, DivisionWinnerPrediction, User, SeasonDates

admin.site.register(User)
admin.site.register(Team)
admin.site.register(WeeklyMatchup)
admin.site.register(WeeklyPrediction)
admin.site.register(SideBet)
admin.site.register(PostSeasonPrediction)
admin.site.register(SeasonOverUnderPrediction)
admin.site.register(DivisionWinnerPrediction)

@admin.register(SeasonDates)
class SeasonDatesAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date')
