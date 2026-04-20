---
slug: user-information
title: Informacion de usuario
---

# Informacion de usuario

Tu perfil contiene datos personales. Aca te explicamos como los protegemos.

## Encriptacion

Toda la informacion personal que guardes en tu perfil se **encripta antes de almacenarse**. Esto significa que, incluso en el caso de una filtracion de datos, tu informacion esta protegida matematicamente y no puede ser leida por terceros.

La encriptacion que usamos garantiza que:

- **Solo vos y el sistema pueden acceder a tus datos** en texto legible
- **Si alguien accede a la base de datos**, solo veria texto cifrado sin sentido
- **No se puede revertir la encriptacion** sin las claves correspondientes

## Como funciona

Cuando guardas informacion en tu perfil, el sistema la transforma usando un algoritmo de encriptacion antes de escribirla en la base de datos. Cada vez que vos o el sistema necesitan leer esa informacion, se desencripta en el momento. En ningun punto se almacena informacion legible.

Este proceso es automatico y transparente — no necesitas hacer nada especial. Simplemente completa tu perfil y el sistema se encarga de proteger tus datos.

## Que pasa si hay una filtracion

En el caso hipotetico de que alguien acceda a la base de datos sin autorizacion, lo unico que veria es texto cifrado. Sin las claves de encriptacion, que se almacenan por separado y de forma segura, **es matematicamente imposible reconstruir la informacion original**.
