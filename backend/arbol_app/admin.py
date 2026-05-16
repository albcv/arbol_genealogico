from django.contrib import admin
from django.utils.html import format_html
from .models import Persona

class PersonaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'apellido1', 'apellido2', 'ver_foto')
    
    def ver_foto(self, obj):
        if obj.foto:
            return format_html('<img src="{}" width="80" height="80" style="border-radius: 50%;" />', obj.foto.url)
        return "Sin foto"
    ver_foto.short_description = "Foto"

admin.site.register(Persona, PersonaAdmin)