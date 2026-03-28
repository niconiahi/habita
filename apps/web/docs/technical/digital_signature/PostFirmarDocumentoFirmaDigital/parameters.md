# Parameters

```json
{
  "DocumentoBase64 (Cadena)": "Documento que se quiere firmar en base 64",
  "HashSHA256Hexadecimal (Cadena)": "Hash SHA256 en hexadecimal del documento que se quiere firmar",
  "IdentificadorGrupo (Cadena)": "Se utiliza para agrupar el documento que va a subir a otros documentos previamente subidos",
  "Personas": [
    {
      "CodigoUnicoIdentificacion (Cadena) [Obligatorio]": "CUIL de la persona que va a firmar el documento",
      "CuitOrganizacion (Cadena)": "CUIT de la organización que va a firmar el documento",
      "OrdenFirma (Entero)": "Indica cual es el turno de firma de la persona",
      "CuadroVisibleFirma_X (Decimal)": "Coordenadas en el eje X de la representación visual de la firma",
      "CuadroVisibleFirma_Y (Decimal)": "Coordenadas en el eje Y de la representación visual de la firma",
      "CuadroVisibleFirma_Ancho (Decimal)": "Ancho de la representación visual de la firma",
      "CuadroVisibleFirma_Alto (Decimal)": "Alto de la representación visual de la firma",
      "CuadroVisibleFirma_ImagenBase64 (Cadena)": "Imagen en base64 de la representación visual de la firma",
      "CuadroVisibleFirma_PlantillaID (Entero)": "Identificador de plantilla de la representación visual de la firma. 1: Completa. 2: Completa sin imagen. 3: Solo imagen. 4: Solo nombre del firmante ",
      "RazonFirma (Cadena)": "Razón de firma",
      "CuadroVisibleFirma_Pagina (Entero)": "Página donde se ubicara la representación visual de la firma",
      "CuadroVisibleFirma_TodasPaginas (Booleano)": "Indica si la representación visual de la firma debera ubicarse en todas las paginas",
      "UrlRedireccionOK (Cadena)": "URL donde redireccionar luego de terminar de firmar",
      "UrlRedireccionError (Cadena)": "URL donde redireccionar si se produce un error al firmar",
      "UrlRedireccionRechazar (Cadena)": "URL donde redireccionar si se rechaza la firma",
      "ForzarGeneracionErrorParaTest (Booleano)": "Generar un error al rechazar la firma del documento para probar URL de Error",
      "NroSerieCertificado (Cadena)": "Nro. de serie del certificado con el que se quiere firmar. Utilizar en caso de que la persona tenga mas de 1 certificado de la misma persona fisica o juridica",
      "PinEncriptado (Cadena)": ""
    }
  ],
  "Origen (Cadena)": "",
  "UserIdCreador (Entero)": ""
}
```
