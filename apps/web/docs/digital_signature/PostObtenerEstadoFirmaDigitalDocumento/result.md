# Result

```json
{
  "CodigoResultado (Entero)": "Codigo del resultado del proceso",
  "MensajeResultado (Cadena)": "Mensaje del resultado del proceso",
  "Datos": {
    "CodigoEstado (Entero)": "Código del estado de firma del documento consultado",
    "DescripcionEstado (Cadena)": "Descripcion del estado de firma del documento consultado",
    "ArchivoFirmadoBase64 (Cadena)": "En caso de ya estar firmado, archivo firmado en base64",
    "HashSHA256FirmadoHexadecimal (Cadena)": "En caso de ya estar firmado, archivo firmado en Hash SHA-256 (Formato: Hexadecimal)",
    "Estados": [
      {
        "CodigoUnicoIdentificacion (Cadena)": "CUIL de la persona que va a firmar el documento",
        "CuitOrganizacion (Cadena)": "CUIT de la organización que va a firmar el documento",
        "CodigoEstado (Entero)": "Código del estado de firma de esta persona",
        "DescripcionEstado (Cadena)": "Descripcion del estado de firma de esta persona"
      }
    ]
  }
}
```
