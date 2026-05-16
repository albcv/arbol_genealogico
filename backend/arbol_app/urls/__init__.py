from django.urls import include, path
from . import auth_urls, persona_urls

urlpatterns = [
    path('', include(auth_urls)),
    path('', include(persona_urls)),
   
]