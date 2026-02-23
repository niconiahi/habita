# Authentication

```csharp
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
