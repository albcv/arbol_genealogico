from django.urls import path
from ..views.auth_views import login, logout, perfil_usuario, cambiar_password, set_csrf_cookie

urlpatterns = [
    path('login/', login, name='login'),
    path('logout/', logout, name='logout'),
    path('perfil/', perfil_usuario, name='perfil'),
    path('cambiar-password/', cambiar_password, name='cambiar_password'),
    path('csrf/', set_csrf_cookie, name='csrf'),
  
]