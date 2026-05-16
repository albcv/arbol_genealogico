from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import Q

class Persona(models.Model):

    SEXO_CHOICES = [
    ('M', 'Masculino'),
    ('F', 'Femenino'),
]
    
    nombre = models.CharField(max_length=100)
    apellido1 = models.CharField(max_length=100, null=True, blank=True)
    apellido2 = models.CharField(max_length=100, null=True, blank=True)
    sexo = models.CharField(max_length=1, choices=SEXO_CHOICES)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    fecha_defuncion = models.DateField(blank=True, null=True)
    lugar_nacimiento = models.CharField(max_length=200, blank=True, null=True)
    lugar_defuncion = models.CharField(max_length=200, blank=True, null=True)
    notas = models.TextField(blank=True, null=True)
    foto = models.ImageField(upload_to='fotos_personas/', blank=True, null=True)

    # Autorreferencia para padres (clave foránea hacia sí misma)
    padre = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hijos_como_padre'
    )
    madre = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hijos_como_madre'
    )

    class Meta:
        verbose_name_plural = "Personas"
        ordering = ['apellido1', 'nombre', 'fecha_nacimiento']
        indexes = [
            models.Index(fields=['padre']),
            models.Index(fields=['madre']),
        ]

    def __str__(self):
        return f"{self.nombre} {self.apellido1} {self.apellido2}".strip() 

    def clean(self):
        # Evitar que una persona sea su propio padre o madre
        if self.padre and self.padre.pk == self.pk:
            raise ValidationError("Una persona no puede ser su propio padre.")
        if self.madre and self.madre.pk == self.pk:
            raise ValidationError("Una persona no puede ser su propia madre.")

    def save(self, *args, **kwargs):
        self.full_clean()  # Ejecuta validaciones antes de guardar
        super().save(*args, **kwargs)

    # Método para obtener los hijos (ambos padres)
    def hijos(self):
        return Persona.objects.filter(Q(padre=self) | Q(madre=self))

    # Método para obtener los hermanos
    def hermanos(self):
        """Devuelve los hermanos (mismo padre o madre), excluyéndose a sí mismo."""
        return Persona.objects.filter(
            (Q(padre=self.padre) | Q(madre=self.madre))
        ).exclude(id=self.id)

    # Método para obtener los abuelos
    def abuelos(self):
        """Devuelve los abuelos (padres del padre y padres de la madre)."""
        q_abuelos = Q()
        if self.padre:
            q_abuelos |= Q(padre=self.padre.padre) | Q(madre=self.padre.madre)
        if self.madre:
            q_abuelos |= Q(padre=self.madre.padre) | Q(madre=self.madre.madre)
        return Persona.objects.filter(q_abuelos).distinct()

    # Método para obtener los tíos (hermanos de los padres)
    def tios(self):
        """Devuelve los tíos (hermanos del padre o de la madre)."""
        q_tios = Q()
        if self.padre:
            q_tios |= Q(padre=self.padre.padre) | Q(madre=self.padre.madre)
        if self.madre:
            q_tios |= Q(padre=self.madre.padre) | Q(madre=self.madre.madre)
        # Los tíos son los hijos de los abuelos, excluyendo a los propios padres
        tios = Persona.objects.filter(q_tios).exclude(id=self.padre_id).exclude(id=self.madre_id)
        return tios.distinct()

    # Método para obtener los primos hermanos
    def primos_hermanos(self):
        """Devuelve los primos hermanos (hijos de los tíos)."""
        # Primero obtenemos los tíos
        tios = self.tios()
        # Luego los hijos de esos tíos
        return Persona.objects.filter(Q(padre__in=tios) | Q(madre__in=tios)).distinct()

    
