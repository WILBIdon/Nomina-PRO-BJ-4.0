# 🚂 Configuración de Persistencia en Railway

Para que tu aplicación **Nómina BJ PRO 4.0** guarde los datos de forma permanente (y no se borren en cada actualización), debes configurar un **Volumen** en Railway.

Sigue estos pasos sencillos:

1.  Entra a tu proyecto en [Railway Dashboard](https://railway.app/).
2.  Haz clic en la tarjeta de tu servicio (la aplicación).
3.  Busca la pestaña llamada **Volumes** (Volúmenes).
4.  Presiona el botón **+ Add Volume** (O "Create Volume").
5.  Te pedirá una ruta ("Mount Path"). Escribe EXACTAMENTE esta ruta:
    
    ```
    /app/server/data
    ```

6.  Haz clic en **Add** o **Deploy**.

### ¿Qué sucederá?
*   Railway reiniciará tu aplicación.
*   Mi código nuevo (`server/index.js`) detectará el volumen vacío y copiará automáticamente tus datos actuales (`empleados.json` y `config.json` de 2026) al nuevo volumen.
*   A partir de ese momento, **todos los cambios, nuevos empleados y liquidaciones se guardarán en ese volumen** y nunca se perderán, incluso si volvemos a actualizar el código.

### Calendario 2026
Además, he agregado internamente la lista de todos los **Festivos de Colombia para 2026** en la configuración, para asegurar que los cálculos sean precisos.

---
_Nominas BJ PRO 4.0_
