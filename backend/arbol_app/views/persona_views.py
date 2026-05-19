from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
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

    # ----------------------------------------------------------
    # Consultas de relaciones familiares
    # ----------------------------------------------------------

    @action(detail=True, methods=['get'], url_path='padres')
    def padres(self, request, pk=None):
        persona = self.get_object()
        padres = []
        if persona.padre:
            padres.append(persona.padre)
        if persona.madre:
            padres.append(persona.madre)
        serializer = PersonaSerializer(padres, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='abuelos')
    def abuelos(self, request, pk=None):
        persona = self.get_object()
        abuelos = set()
        if persona.padre:
            if persona.padre.padre:
                abuelos.add(persona.padre.padre)
            if persona.padre.madre:
                abuelos.add(persona.padre.madre)
        if persona.madre:
            if persona.madre.padre:
                abuelos.add(persona.madre.padre)
            if persona.madre.madre:
                abuelos.add(persona.madre.madre)
        serializer = PersonaSerializer(list(abuelos), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='bisabuelos')
    def bisabuelos(self, request, pk=None):
        persona = self.get_object()
        bisabuelos = set()
        # Obtener abuelos y luego sus padres
        abuelos_ids = set()
        if persona.padre:
            if persona.padre.padre:
                abuelos_ids.add(persona.padre.padre.id)
            if persona.padre.madre:
                abuelos_ids.add(persona.padre.madre.id)
        if persona.madre:
            if persona.madre.padre:
                abuelos_ids.add(persona.madre.padre.id)
            if persona.madre.madre:
                abuelos_ids.add(persona.madre.madre.id)
        for abuelo_id in abuelos_ids:
            abuelo = Persona.objects.get(id=abuelo_id)
            if abuelo.padre:
                bisabuelos.add(abuelo.padre)
            if abuelo.madre:
                bisabuelos.add(abuelo.madre)
        serializer = PersonaSerializer(list(bisabuelos), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='tatarabuelos')
    def tatarabuelos(self, request, pk=None):
        persona = self.get_object()
        tatarabuelos = set()
        # Obtener bisabuelos y luego sus padres
        bisabuelos_ids = set()
        # Recolectar bisabuelos primero (similar a bisabuelos)
        abuelos_ids = set()
        if persona.padre:
            if persona.padre.padre:
                abuelos_ids.add(persona.padre.padre.id)
            if persona.padre.madre:
                abuelos_ids.add(persona.padre.madre.id)
        if persona.madre:
            if persona.madre.padre:
                abuelos_ids.add(persona.madre.padre.id)
            if persona.madre.madre:
                abuelos_ids.add(persona.madre.madre.id)
        for abuelo_id in abuelos_ids:
            abuelo = Persona.objects.get(id=abuelo_id)
            if abuelo.padre:
                bisabuelos_ids.add(abuelo.padre.id)
            if abuelo.madre:
                bisabuelos_ids.add(abuelo.madre.id)
        for bisabuelo_id in bisabuelos_ids:
            bisabuelo = Persona.objects.get(id=bisabuelo_id)
            if bisabuelo.padre:
                tatarabuelos.add(bisabuelo.padre)
            if bisabuelo.madre:
                tatarabuelos.add(bisabuelo.madre)
        serializer = PersonaSerializer(list(tatarabuelos), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='hermanos')
    def hermanos(self, request, pk=None):
        persona = self.get_object()
        hermanos = Persona.objects.filter(
            Q(padre=persona.padre) | Q(madre=persona.madre)
        ).exclude(id=persona.id)
        serializer = PersonaSerializer(hermanos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='tios')
    def tios(self, request, pk=None):
        persona = self.get_object()
        tios = set()
        # Hermanos de los padres
        if persona.padre:
            tios.update(Persona.objects.filter(Q(padre=persona.padre.padre) | Q(madre=persona.padre.madre)).exclude(id=persona.padre.id))
        if persona.madre:
            tios.update(Persona.objects.filter(Q(padre=persona.madre.padre) | Q(madre=persona.madre.madre)).exclude(id=persona.madre.id))
        serializer = PersonaSerializer(list(tios), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='primos_hermanos')
    def primos_hermanos(self, request, pk=None):
        persona = self.get_object()
        primos = set()
        # Hijos de los tíos
        tios_ids = set()
        if persona.padre:
            tios_ids.update(Persona.objects.filter(Q(padre=persona.padre.padre) | Q(madre=persona.padre.madre)).exclude(id=persona.padre.id).values_list('id', flat=True))
        if persona.madre:
            tios_ids.update(Persona.objects.filter(Q(padre=persona.madre.padre) | Q(madre=persona.madre.madre)).exclude(id=persona.madre.id).values_list('id', flat=True))
        for tio_id in tios_ids:
            primos.update(Persona.objects.filter(Q(padre=tio_id) | Q(madre=tio_id)))
        serializer = PersonaSerializer(list(primos), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='hijos')
    def hijos(self, request, pk=None):
        persona = self.get_object()
        hijos = Persona.objects.filter(Q(padre=persona) | Q(madre=persona))
        serializer = PersonaSerializer(hijos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='nietos')
    def nietos(self, request, pk=None):
        persona = self.get_object()
        hijos = Persona.objects.filter(Q(padre=persona) | Q(madre=persona))
        nietos_ids = set()
        for hijo in hijos:
            nietos_ids.update(Persona.objects.filter(Q(padre=hijo) | Q(madre=hijo)).values_list('id', flat=True))
        nietos = Persona.objects.filter(id__in=nietos_ids)
        serializer = PersonaSerializer(nietos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='bisnietos')
    def bisnietos(self, request, pk=None):
        persona = self.get_object()
        nietos = self.nietos(request, pk).data
        bisnietos_ids = set()
        for nieto in nietos:
            bisnietos_ids.update(Persona.objects.filter(Q(padre=nieto['id']) | Q(madre=nieto['id'])).values_list('id', flat=True))
        bisnietos = Persona.objects.filter(id__in=bisnietos_ids)
        serializer = PersonaSerializer(bisnietos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='tataranietos')
    def tataranietos(self, request, pk=None):
        persona = self.get_object()
        bisnietos = self.bisnietos(request, pk).data
        tataranietos_ids = set()
        for bisnieto in bisnietos:
            tataranietos_ids.update(Persona.objects.filter(Q(padre=bisnieto['id']) | Q(madre=bisnieto['id'])).values_list('id', flat=True))
        tataranietos = Persona.objects.filter(id__in=tataranietos_ids)
        serializer = PersonaSerializer(tataranietos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='sobrinos')
    def sobrinos(self, request, pk=None):
        persona = self.get_object()
        hermanos = Persona.objects.filter(Q(padre=persona.padre) | Q(madre=persona.madre)).exclude(id=persona.id)
        sobrinos_ids = set()
        for hermano in hermanos:
            sobrinos_ids.update(Persona.objects.filter(Q(padre=hermano) | Q(madre=hermano)).values_list('id', flat=True))
        sobrinos = Persona.objects.filter(id__in=sobrinos_ids)
        serializer = PersonaSerializer(sobrinos, many=True)
        return Response(serializer.data)


      
    @action(detail=True, methods=['get'], url_path='arbol-hasta-abuelos')
    def arbol_hasta_abuelos(self, request, pk=None):
        """
        Devuelve un array de personas que incluye:
        - la persona solicitada,
        - sus padres,
        - sus abuelos (paternos y maternos).
        No incluye bisabuelos ni otras generaciones.
        """
        persona = self.get_object()
        ids = {persona.id}
        
        # Añadir padres
        if persona.padre:
            ids.add(persona.padre.id)
        if persona.madre:
            ids.add(persona.madre.id)
        
        # Añadir abuelos (padres de los padres)
        for parent in [persona.padre, persona.madre]:
            if parent:
                if parent.padre:
                    ids.add(parent.padre.id)
                if parent.madre:
                    ids.add(parent.madre.id)
        
        # Obtener todas las personas de una sola consulta
        personas = Persona.objects.filter(id__in=ids).select_related('padre', 'madre')
        serializer = PersonaSerializer(personas, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['get'], url_path='masculinos')
    def masculinos(self, request):
        """
        Devuelve todas las personas de sexo masculino (M).
        Permite búsqueda por nombre/apellido con parámetro 'search'.
        """
        queryset = Persona.objects.filter(sexo='M')
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nombre__icontains=search) |
                Q(apellido1__icontains=search) |
                Q(apellido2__icontains=search)
            )
        queryset = queryset.order_by('nombre')
        serializer = PersonaSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='femeninos')
    def femeninos(self, request):
        """
        Devuelve todas las personas de sexo femenino (F).
        Permite búsqueda por nombre/apellido con parámetro 'search'.
        """
        queryset = Persona.objects.filter(sexo='F')
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nombre__icontains=search) |
                Q(apellido1__icontains=search) |
                Q(apellido2__icontains=search)
            )
        queryset = queryset.order_by('nombre')
        serializer = PersonaSerializer(queryset, many=True)
        return Response(serializer.data)