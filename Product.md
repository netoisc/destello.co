Eres un diseñador y full-stack cósmico obsesionado con la mejor UX móvil.

Crea el proyecto completo “Destello” v1:

Stack:
- Next.js 14 app router
- Tailwind + shadcn/ui + framer-motion
- Supabase (Postgres + Storage)
- Three.js ligero + @react-three/fiber
- Vercel 100 % gratis

Estética: universo negro profundo, partículas lentas, Sol tenue, tipografía Satoshi/Inter, todo español, mobile-first.

Funcionalidades y UX exactas:

1. /create → slider de 4 pasos (horizontal desktop / scroll vertical móvil con snap):
   Paso 1 → Nombre, descripción, audio
   Paso 2 → Límite total + cuántos Mercurio (0–15)
   Paso 3 → Fecha/hora, lugar, lista opcional “qué traer”
   Paso 4 → “Tu sistema solar listo” + los dos enlaces cósmicos + botón “Ver esfera”

2. Rutas:
   - /e/[eventId]/mercurio → co-anfitriones (sin código)
   - /e/[eventId]/venus → invitados normales
   - /e/[eventId]/venus/[codigo6] → invitados de un Mercurio

3. Al abrir Mercurio o Venus:
   - Pantalla completa negra → destello central → texto:
     “Hola, alguien te invitó a: ✦ NOMBRE EVENTO ✦” (brillo pulsante)
   - Campo código (solo si es Venus con código)
   - Al validar → desliza hacia abajo automático → revela When / Where / Qué traer
   - Botones grandes: [ME APUNTO]  [NO PUEDO]
   - ME APUNTO → ruleta 3D opcional → Big Bang + countdown 10 s → autodestrucción total

4. /e/[eventId]/sphere → solo Sol y Mercurio → esfera 3D viva (Mercurio cerca y brillante, Venus en órbita exterior)

5. 24 h después del evento → todo borrado automáticamente

6. Ruleta: nebulosa giratoria, opciones desaparecen como cometa





Nombre: Destello
Tagline: Invitaciones que brillan y desaparecen.


Funcionalidad:

Se permiten crear eventos a cualquier persona, sin registro previo. 

Un evento es efímero o fugaz, en cuanto se cumpla la fecha del evento, al día siguiente desaparece, ya no podrá verse, los datos que se hayan generado, se elminan definitivamente.

Es un servicio que se basa en cadena o árbol de invitaciones, es decir, parte del Root, quien es el owner del evento. Luego el tiene a sus propios invitados,
y puede agregar co-anfitriones, y estos a su vez, pueden tener sus propios invitados.

Solo existe un owner de cada evento, multiples co-anfitriones. Después de este mivel o rama, ya se pueden tener N niveles de invitados. Invitados del invitado.Pero por ahora vamos a soportar solo 2 niveles de ramificación. 
Es decir:
a) root ->co-anfitriones -> invitados
b) root -> invitados -> invitados


# Reglas

- No hay registro de usuarios
- Un evento no puede crearse en fecha del pasado a la fecha actual, ni mayor a 6 meses
- Un evento es temporal, efímero, se elmina el rastro del sistema un dia despues del evento
- Los invitados, no pueden modificar el evento
- El owner solo podría modificar el evento

# Analogías

- Un evento se considera fugaz y efímero porque el evento pierde su luz y su rastro
- El creador del evento se asocia al SUN
- Los co-anfitriones se consideran como planetas que rodean al sol
- Los invitados, serían como todas las estrellas cercanas y/o que obitan cercanas a cada planeta


# Flujos

## Creación del evento 

- Step 1, Detalles del evento:

Tu nombre:
Nombre del Evento
Descripción (opcional)
Mensaje de audio (opcional) y directamente en la pagina, teniendo en cuenta el permiso del navegador en el móvil o desktop

- Step 2, Invitados:

Limite total de invitados
Anfitriones (opcional)

> Si se agregan anfitriones es una lista separada con comas para facilitar el agregarlos

- Step 3, Coordenadas

Fecha y hora

Lugar (texto libre)

- Step 4, Mas detalles

¿Agregar opciones para que tus invitados puedan participar llevando algo a tu evento?

Si. Mostrar chips predefinidos en el sistema, como: Postres, Piñatas, Botana, Bebidas, Dulces, Fruta. 
Mostrar caja de texto para que agreguen más opciones y al darle agregar se muestran abajo y permite darle X para quitarlos


- Step 5, preview

Se muestra detalles del evento para confirmar. 
Se crea el evento y se genera un link unico, tipo /e/sun-<unique-id> e.g. destello.to/e/sun-3x9k2. Este link es que que se usará por el y por los invitados para identificar al evento

Se genera un código tipo NIP que aydará al dueño del evento a modificar el evento

> Mostrar icono de compartir el link del evento y la adevertencia de cuidar o guardar el NIP porque no se podrá recuperar y sirve por si desea modificar
> Se guarda una cookie para saber que esta persona es el owner y si vuelve a antrar 


## Aceptación del invite

Persona recibe y abre el link, se muestra un mensaje futurista, con animación, algo como si fuera un "bing-bang"

Con animación de scroll hacia abajo por secciones:

- Sección 1
"Si puedes ver esto es porque alguien te ha invitado a:"

<Nombre del evento> en grande y brillante>

Si hay Anfitriones, Anfitriones: <list-separated-by-comma>
Confirmados: <numero de los que ya confirmaron incluidos los anfitriones>

- Seccion 1.1, audio

Si hay audio, mostrar control de reproducción

- Sección 2, Detalles del evento

Fecha, hora -> Mostrar qué dia de la semana es. Letras grandes y claras
Coordenadas: Dirección que haya colocado

- Sección 3, Confirmación

Se le muestra un mensaje muy relajado y amigable, algo como:

¿Qué dices, te nos unes? o ¿Qué dices, nos acompañas?

- Si le da en "Vale, me apunto" entonces:

Se anima la página, tipo lluvia de estrellas, o se ilumina toda la pagina y pasa a la siguiente sección

Si no Acepta la invitación, sucede una animación de "vaciado" o de vacio de estrellas, se desvanecen. Como si se perdiera la invitación en el universo y se agradece 

> Cualquiera que sea la decision del invitado, se alamacena en el cache o cookies del usuario la url del evento para saber si ya fue usado y si entra pero no había aceptado, mostrar la animación de espacio vacío 

- Sección, Gracias

Pedir el Nombre del invitado

>En caso de que hayan colocado opciones para invitados, mostrar:

¿quieres llevar algo?, aqui algunas opciones:

Mostrar opciones con un aspecto futurista, y que visualmente se vean como que pueden darle tap/click

>Cuando una invitado selecciona alguna opción se le muestra una reacción como la que se muestra en zoom o google meet cuando alguien reacciona, tipo aplausos o emoji de fiesta
y se agrega a su lista (usar cookies por si vuelve a entrar que vea detalles del evento y las opciones que elijió para llevar)


- Sección, Nos vemos

Mostrar un mensaje bonito y cool de "Es todo, nos vemos el <fecha>, en <Lugar>"



## Modificar evento

Al final de la pagina del evento (usando el link general), mostrar:
¿Eres el creador del evento?, y si es así, colocar el PIN y llevarlo a la página de modificación



## Esfera animada

El dueño del evento y los invitados que tengan el link y hayan aceptado (se sabe con la cookie), pueden ver una esfera animada con todos los nombres de las personas que asistirán