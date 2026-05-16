# arbol_app/apps.py
from django.apps import AppConfig

class ArbolAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'arbol_app'

    def ready(self):
        import arbol_app.signals  