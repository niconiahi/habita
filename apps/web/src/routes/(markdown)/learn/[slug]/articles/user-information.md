---
slug: user-information
title: Información de usuario
---

# Información de usuario

Tu perfil contiene datos personales. Acá te explicamos cómo los protegemos.

## Encriptación

Toda la información personal que guardes en tu perfil se **encripta antes de almacenarse**. Esto significa que, incluso en el caso de una filtración de datos, tu información está protegida matemáticamente y no puede ser leída por terceros.

La encriptación que usamos garantiza que:

- **Solo vos y el sistema pueden acceder a tus datos** en texto legible
- **Si alguien accede a la base de datos**, solo vería texto cifrado sin sentido
- **No se puede revertir la encriptación** sin las claves correspondientes

## Cómo funciona

Cuando guardás información en tu perfil, el sistema la transforma usando un algoritmo de encriptación antes de escribirla en la base de datos. Cada vez que vos o el sistema necesitan leer esa información, se desencripta en el momento. En ningún punto se almacena información legible.

Este proceso es automático y transparente — no necesitás hacer nada especial. Simplemente completá tu perfil y el sistema se encarga de proteger tus datos.

## Qué pasa si hay una filtración

En el caso hipotético de que alguien acceda a la base de datos sin autorización, lo único que vería es texto cifrado. Sin las claves de encriptación, que se almacenan por separado y de forma segura, **es matemáticamente imposible reconstruir la información original**.
