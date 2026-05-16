# arbol_app/signals.py
import os
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from .models import Persona

@receiver(pre_save, sender=Persona)
def eliminar_foto_antigua(sender, instance, **kwargs):
    # Si es un objeto nuevo (aún sin ID), no hay foto anterior que eliminar
    if not instance.pk:
        return

    try:
        # Obtener la instancia antigua desde la base de datos
        old_instance = sender.objects.get(pk=instance.pk)
        old_foto = old_instance.foto
        new_foto = instance.foto

        # Si existía una foto antigua y ha cambiado por una nueva (o se eliminó)
        if old_foto and old_foto != new_foto:
            # Verificar que el archivo exista físicamente antes de borrarlo
            if os.path.isfile(old_foto.path):
                os.remove(old_foto.path)
    except sender.DoesNotExist:
        # Caso muy improbable, no hacer nada
        pass

@receiver(post_delete, sender=Persona)
def eliminar_foto_persona(sender, instance, **kwargs):
    # Cuando se elimina completamente la persona, borrar su foto si existe
    if instance.foto and os.path.isfile(instance.foto.path):
        os.remove(instance.foto.path)