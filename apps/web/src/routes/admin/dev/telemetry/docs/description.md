# /admin/dev/telemetry

Pagina interna de prueba para validar la pipeline de telemetria (logs + traces) end-to-end durante desarrollo. Ofrece botones que disparan distintos escenarios — throws sincronos, async, errores capturados, niveles de log, spans anidados — y muestra el `trace_id` generado para hacer click hacia `/logs` y `/traces` en la observability UI.

Solo accesible en `OTEL_ENVIRONMENT=development` y para usuarios webmaster. Devuelve 404 fuera de dev y 403 si no es webmaster.
