from rest_framework import serializers
from ..models import Persona

class PersonaSerializer(serializers.ModelSerializer):
    padre_nombre = serializers.SerializerMethodField()
    madre_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Persona
        fields = [
            'id', 'nombre', 'apellido1', 'apellido2', 'sexo',
            'fecha_nacimiento', 'fecha_defuncion', 'lugar_nacimiento',
            'lugar_defuncion', 'notas', 'foto', 'padre', 'madre',
            'padre_nombre', 'madre_nombre'
        ]

    def get_padre_nombre(self, obj):
        if obj.padre:
            return f"{obj.padre.nombre} {obj.padre.apellido1 or ''} {obj.padre.apellido2 or ''}".strip()
        return None

    def get_madre_nombre(self, obj):
        if obj.madre:
            return f"{obj.madre.nombre} {obj.madre.apellido1 or ''} {obj.madre.apellido2 or ''}".strip()
        return None