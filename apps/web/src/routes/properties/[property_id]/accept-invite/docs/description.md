# Aceptar una invitación a una propiedad

Esta no es una página que se visite directamente — es un enlace especial que los propietarios reciben por email cuando son invitados a administrar una propiedad. Al hacer clic en el enlace se verifica el token de invitación, se comprueba que no haya expirado ni haya sido usado antes, y se confirma que el email del usuario logueado coincida con la invitación.

Si todo está en orden, se le otorga al usuario acceso de propietario a la propiedad y se lo redirige a la página de detalle de la propiedad. Si algo está mal (token expirado, email incorrecto, ya utilizado), simplemente se muestra un error.
