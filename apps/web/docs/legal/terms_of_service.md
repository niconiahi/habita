# Términos de Servicio — Notas

Este documento NO es el ToS final. Son notas y decisiones para que un abogado redacte el documento legal.

---

## Decisión: Habita no verifica la habilitación profesional de sus usuarios

Habita es una herramienta de software, no un organismo regulador. No verifica ni tiene obligación de verificar que los usuarios estén matriculados como corredores inmobiliarios (CUCICBA u otro colegio profesional).

### Precedente: Zonaprop (DRIDCO S.A.U. / Grupo QuintoAndar)

Zonaprop, la plataforma inmobiliaria más grande de Argentina (~10,310 inmobiliarias listadas), opera exactamente con este modelo. Cláusulas relevantes de sus ToS (actualizados 14/04/2025):

**No verifican identidad ni habilitación:**
> "el Sitio Web no puede confirmar que cada Usuario es quien dice ser, ni tampoco tiene la obligación de hacerlo"
> — Condiciones de Uso, cláusula 5.1

**No verifican capacidad para contratar ni autenticidad de datos:**
> "Grupo QuintoAndar tampoco tiene la obligación de verificar la identidad ni la capacidad para contratar de los usuarios del Sitio Web, ni la veracidad, vigencia, y/o autenticidad de los datos que los Usuarios proporcionen sobre sí mismos"
> — Condiciones de Contratación, cláusula 9.1(d)

**No garantizan que el usuario sea quien dice ser ni que tenga derechos sobre los inmuebles:**
> "Grupo QuintoAndar en ningún caso garantiza que: (i) los Usuarios anunciantes sean quienes ostentan ser; (ii) los derechos o interés jurídico que los Usuarios anunciantes tengan, o bien no tengan, sobre los inmuebles anunciados"
> — Condiciones de Uso, cláusula 5.11

**El usuario declara que está habilitado:**
> "El Solicitante declara que los inmuebles que anuncia son de su propiedad o se encuentra legalmente habilitado para ofrecerlos en alquiler o venta"
> — Condiciones de Contratación, cláusula 17.5

**El usuario asume responsabilidad de cumplir con la normativa:**
> "Utilizará los Servicios en un todo de acuerdo con estas Condiciones, los Términos y Condiciones Generales de Uso, y a la normativa vigente"
> — Condiciones de Contratación, cláusula 9.2(b)

**La plataforma no es parte en las transacciones:**
> "Grupo QuintoAndar no interviene en la negociación y/o conclusión de los negocios u operaciones ni tampoco se obliga a mediar entre los usuarios"
> — Condiciones de Contratación, cláusula 9.1(g)

### Fuentes

- [Zonaprop — Términos y Condiciones de Uso](https://help.zonaprop.com.ar/s/article/terminos-y-condiciones-de-uso)
- [Zonaprop — Términos y Condiciones Generales de Contratación](https://help.zonaprop.com.ar/s/article/terminos-y-condiciones-generales-de-contratacion)

---

## Tres pilares para el ToS de Habita

Basado en el precedente de Zonaprop, el ToS de Habita debe tener estas tres cláusulas como mínimo:

### 1. Sin obligación de verificación
Habita no verifica la identidad, habilitación profesional, matriculación, ni capacidad legal de sus usuarios. No tiene obligación de hacerlo.

### 2. Autodeclaración del usuario
El usuario declara que cumple con los requisitos legales vigentes para ejercer la actividad inmobiliaria en su jurisdicción. La responsabilidad legal recae en el usuario, no en Habita.

### 3. Habita no es parte en las transacciones
Habita provee una herramienta de software para gestionar el ciclo del alquiler. No interviene ni media en las transacciones entre las partes (administrador, propietario, inquilino).

---

## Matrícula como dato opcional

- El usuario puede ingresar su número de matrícula de forma voluntaria
- Se muestra en su perfil como dato informativo (similar a como Zonaprop muestra "Matrícula CUCICBA XXXX")
- Habita no valida este dato contra ningún registro externo
- No existe API pública de CUCICBA para verificar — solo un formulario web de búsqueda manual

---

## Contexto regulatorio

### Ley 2340 (CABA)
- En CABA, la matriculación en CUCICBA es obligatoria para ejercer como corredor inmobiliario
- Sin matrícula no se pueden cobrar comisiones legalmente
- Requiere título universitario/terciario en corretaje inmobiliario

### Desregulación en curso (2025-2026)
- El gobierno de Milei impulsa la eliminación de la matriculación obligatoria
- Propuesta: matriculación voluntaria, sin multas por operar sin matrícula, eliminación de aranceles mínimos
- Si se aprueba, la matrícula deja de ser un requisito legal

### Implicación para Habita
- No construir flujos de validación de matrícula (podría quedar obsoleto con la desregulación)
- Mantener el modelo de autodeclaración
- Revisar ToS si la regulación cambia

---

## Próximo paso

Contratar un abogado especializado en tech o derecho inmobiliario para redactar el ToS formal basándose en estas notas. Presupuesto estimado: parte de los $3,000 USD asignados a legal en el pitch deck (Slide 8).
