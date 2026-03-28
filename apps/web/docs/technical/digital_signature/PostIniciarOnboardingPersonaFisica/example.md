# Example

```csharp
public async Prueba()
{
    string URL = "https://test.firmador.alpha2000.com.ar/api/FirmaDigital/PostIniciarOnboardingPersonaFisica";

    string CadenaAutenticacion = "LOGIN|21/02/2026|WebApi_accetta|********";

    string ClavePrivada = "nQ6Wc8B7A4TzH5M9P2K";
    string Salteo = "11258z12";
    string Key = "af1238554vzidjH8";

    string Token = Encriptar(CadenaAutenticacion, ClavePrivada, Salteo, Key);

    var RequestBody = new
    {
        Parametro1 = "Valor1",
        Parametro2 = "Valor2"
    }


    HttpClient Client = new HttpClient();

    Client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);
    Client.DefaultRequestHeaders.Add("IdentificadorUsuario", etsw+IjwDSV9Wl27EvYa9A==);

    string Json = JsonConvert.SerializeObject(RequestBody);
    StringContent Content = new StringContent(Json, Encoding.UTF8, "application/json");

    try
    {
        var Response = await Client.PostAsync(URL, Content);
        var responseContent = await Response.Content.ReadAsStringAsync();

        Console.WriteLine("Código de estado: " + Response.StatusCode);
        Console.WriteLine("Respuesta: " + responseContent);
    }
    catch (Exception ex)
    {
        Console.WriteLine("Error al llamar al API: " + ex.Message);
    }

}

public static string Encriptar(string CadenaAutenticacion, string ClavePrivada, string Salteo = null, string Key = null)
{

    byte[] TextoPlanoBytes = Encoding.UTF8.GetBytes(CadenaAutenticacion);
    byte[] BytesKey = new Rfc2898DeriveBytes(ClavePrivada, Encoding.ASCII.GetBytes(Salteo)).GetBytes(256 / 8);
    var KeySimetrica = new RijndaelManaged() { Mode = CipherMode.CBC, Padding = PaddingMode.Zeros };
    var Encriptador = KeySimetrica.CreateEncryptor(BytesKey, Encoding.ASCII.GetBytes(Key));
    byte[] CipherTextBytes;

    using (var MemoryStream = new MemoryStream())
    {

        using (var CryptoStream = new CryptoStream(MemoryStream, Encriptador, CryptoStreamMode.Write))
        {
            CryptoStream.Write(TextoPlanoBytes, 0, TextoPlanoBytes.Length);
            CryptoStream.FlushFinalBlock();
            CipherTextBytes = MemoryStream.ToArray();
            CryptoStream.Close();
        }

        MemoryStream.Close();
    }

    return Convert.ToBase64String(CipherTextBytes);
}
```
