# Tema Keycloak: Impulso Forestal

Tema de login compatible con Keycloak 26.7.4. Hereda `keycloak.v2` y sustituye únicamente la plantilla de login y sus estilos; las plantillas de recuperación, required actions y otros flujos continúan heredándose del tema padre.

## Instalar en el contenedor local existente

1. Identificar el nombre del contenedor Keycloak y comprobar si `/opt/keycloak/themes` ya está montado desde un directorio o volumen persistente.
2. Si existe un montaje, copiar el directorio `impulso-forestal` al directorio host montado como `/opt/keycloak/themes`. Así el tema queda persistido en ese volumen.
3. Si no existe un montaje, copiar `impulso-forestal` al contenedor activo bajo `/opt/keycloak/themes/impulso-forestal`. El tema permanece en la capa escribible de ese mismo contenedor al detenerlo e iniciarlo, sin recrearlo ni eliminarlo. No sobrevive a eliminar/recrear el contenedor; Docker no permite añadir un bind mount a un contenedor existente sin recrearlo.
4. En el Admin Console, abrir el realm `aserradero`, ir a **Realm Settings > Themes**, seleccionar `impulso-forestal` como Login Theme y guardar.
5. Asegurar que el locale español (`es`) esté habilitado/seleccionado en la configuración de internacionalización del realm.

No ejecutar un rebuild del contenedor. Si no está activada la recarga de temas, puede ser necesario reiniciar el mismo contenedor; esto no es lo mismo que recrearlo.
