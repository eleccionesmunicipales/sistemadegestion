Sistema de Padron Electoral

Backend con base de datos Supabase
1. Crear un proyecto en Supabase.
2. Entrar a SQL Editor y ejecutar el archivo db/schema.sql.
3. Copiar .env.example como .env.
4. Completar en .env:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
5. Instalar dependencias con npm install.
6. Abrir el sistema con npm start.
7. Entrar a http://localhost:8765/.

Importante
- SUPABASE_SERVICE_ROLE_KEY no debe ponerse en index.html ni app.js.
- Esa clave queda protegida en el backend.
- El usuario inicial de la base es admin / admin123.

Como abrir
1. Abrir una terminal en C:\Users\laufe\padron-electoral.
2. Ejecutar npm start.
3. Entrar a http://localhost:8765/.
4. Los datos se guardan en Supabase por medio del backend.
5. Para completar o corregir datos, entrar a Sistema de Gestion y usar el boton Editar de cada fila.
6. Exportar CSV para guardar una copia del padron actualizado.

Vistas
- Sistema de Gestion: permite editar pago, devolucion, movil y paso por PC.
- Resumen: solo para administradores. Muestra votantes, paso por PC, presupuestado, pagado, moviles, devolucion de pasajes y pagos. Al tocar cada tarjeta muestra la lista de personas correspondiente.
- Moviles: muestra la lista y detalle de quienes estan marcados como movil completo o parcial.
- Devolucion de Pasaje: muestra la lista y detalle de quienes tienen devolucion de pasaje.
- Usuarios: permite al administrador crear operadores con nombre, apellido, usuario, contraseña, funcion a cumplir y descripcion de funcion.
- El administrador ve todas las vistas del sistema y puede ver la contraseña creada para cada operador.
- Si al crear un usuario se elige la funcion Admin, ese usuario tambien tendra acceso completo de administrador.
- Los operadores ven Sistema de Gestion. Si su funcion contiene Moviles, tambien ven Moviles. Si su funcion contiene Devolucion de Pasaje, tambien ven Devolucion de Pasaje.
- Reporte: solo para administradores. Muestra el historial de acciones de usuarios y permite generar/imprimir en PDF el listado de registros marcados como Paso por PC.
- El reporte se actualiza automaticamente mientras esta abierto, detectando cambios guardados en el navegador.
- El reporte PDF de Paso por PC incluye el usuario que marco cada registro como pasado por PC.

Campos principales
- Nombres
- Apellidos
- Fecha de nacimiento
- Sexo
- Numero de cedula
- Local de votacion
- Numero de mesa
- Orden
- Barrio/compania
- Estado: POSITIVO, NEGATIVO o DUDOSO
- Tipo: gratis, pago, devolucion de pasaje o movil
- Monto cuando corresponde
- Ciudad para devolucion de pasaje
- Movil completo o parcial para movil
- Paso por PC: si/no

Formato CSV aceptado
nombres,apellidos,fecha_nacimiento,sexo,cedula,local,barrio_compania,estado,mesa,orden,tipo,monto,ciudad,tipo_movil,paso_pc

La importacion fue retirada de la interfaz actual porque el padron ya esta cargado.

Valores esperados
- tipo: gratis, pago, devolucion, movil
- tipo_movil: completo, parcial
- paso_pc: si, no
- sexo: F, M, femenino, masculino, mujer, hombre
- estado: POSITIVO, NEGATIVO, DUDOSO

Ejemplo
nombres,apellidos,fecha_nacimiento,sexo,cedula,local,barrio_compania,estado,mesa,orden,tipo,monto,ciudad,tipo_movil,paso_pc
Juan Carlos,Perez Gomez,1980-05-12,M,1234567,Escuela Central,FATIMA,POSITIVO,4,25,pago,50000,,,si
Maria,Lopez Duarte,1975-10-30,F,7654321,Colegio Nacional,LOURDES,DUDOSO,2,11,devolucion,30000,Asuncion,,no
