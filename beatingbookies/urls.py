from django.contrib import admin
from django.urls import path, include
from predictions import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('predictions.urls')),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
]

if settings.DEBUG:  # Only during development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
