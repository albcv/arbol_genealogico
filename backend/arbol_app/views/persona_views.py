from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Persona
from ..serializers import PersonaSerializer
from ..authentication import CookieTokenAuthentication
from ..filters import PersonaFilter

class PersonaViewSet(viewsets.ModelViewSet):
    authentication_classes = [CookieTokenAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = Persona.objects.all().order_by('id')
    serializer_class = PersonaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = PersonaFilter
    search_fields = ['nombre', 'apellido1', 'apellido2', 'fecha_nacimiento']