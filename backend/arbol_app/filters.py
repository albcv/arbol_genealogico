import django_filters
from .models import Persona

class PersonaFilter(django_filters.FilterSet):
    nombre = django_filters.CharFilter(lookup_expr='icontains')
    apellido1 = django_filters.CharFilter(lookup_expr='icontains')
    apellido2 = django_filters.CharFilter(lookup_expr='icontains')
    year_nacimiento_min = django_filters.NumberFilter(field_name='fecha_nacimiento', lookup_expr='year__gte')
    year_nacimiento_max = django_filters.NumberFilter(field_name='fecha_nacimiento', lookup_expr='year__lte')

    class Meta:
        model = Persona
        fields = ['nombre', 'apellido1', 'apellido2', 'year_nacimiento_min', 'year_nacimiento_max']