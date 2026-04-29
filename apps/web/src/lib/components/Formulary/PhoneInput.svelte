<script lang="ts">
  const PHONE_PREFIX = "+549"
  const PHONE_DIGITS_LENGTH = 10

  // Source: ENACOM Numeracion_Geografica.xlsx (enacom.gob.ar/public/datosabiertos)
  // Kept for future use (area code select, province display, masking)
  // const AREA_CODES: Record<string, string> = {
  //   "11": "AMBA",
  //   "220": "Merlo",
  //   "221": "La Plata",
  //   "223": "Mar del Plata",
  //   "230": "Pilar",
  //   "236": "Junín",
  //   "237": "Moreno",
  //   "249": "Tandil",
  //   "260": "San Rafael",
  //   "261": "Mendoza",
  //   "263": "San Martín (Mza)",
  //   "264": "San Juan",
  //   "266": "San Luis",
  //   "280": "Trelew/Rawson",
  //   "291": "Bahía Blanca",
  //   "294": "Bariloche",
  //   "297": "Comodoro Rivadavia",
  //   "298": "General Roca",
  //   "299": "Neuquén",
  //   "336": "Rufino",
  //   "341": "Rosario",
  //   "342": "Santa Fe",
  //   "343": "Paraná",
  //   "345": "Concordia",
  //   "348": "Zárate",
  //   "351": "Córdoba",
  //   "353": "Villa María",
  //   "358": "Río Cuarto",
  //   "362": "Resistencia",
  //   "364": "Pres. Roque Sáenz Peña",
  //   "370": "Formosa",
  //   "376": "Posadas",
  //   "379": "Corrientes",
  //   "380": "La Rioja",
  //   "381": "Tucumán",
  //   "383": "Catamarca",
  //   "385": "Santiago del Estero",
  //   "387": "Salta",
  //   "388": "Jujuy",
  //   "2202": "González Catán",
  //   "2221": "Atalaya",
  //   "2223": "Altamirano",
  //   "2224": "Glew",
  //   "2225": "Alejandro Korn",
  //   "2226": "Alejandro Petion",
  //   "2227": "Antonio Carboni",
  //   "2229": "Ezeiza",
  //   "2241": "Chascomús",
  //   "2242": "Lezama",
  //   "2243": "General Belgrano",
  //   "2244": "Las Flores",
  //   "2245": "Dolores",
  //   "2246": "Santa Teresita",
  //   "2252": "General Lavalle",
  //   "2254": "Pinamar/Cariló",
  //   "2255": "Villa Gesell",
  //   "2257": "Mar de Ajó",
  //   "2261": "Lobería",
  //   "2262": "Necochea",
  //   "2264": "Claraz",
  //   "2265": "Coronel Vidal",
  //   "2266": "Balcarce",
  //   "2267": "General Madariaga",
  //   "2268": "General Guido",
  //   "2271": "Abbott",
  //   "2272": "Las Marianas",
  //   "2273": "Carmen de Areco",
  //   "2274": "Carlos Spegazzini",
  //   "2281": "Azul",
  //   "2283": "Tapalqué",
  //   "2284": "Olavarría",
  //   "2285": "Laprida",
  //   "2286": "General Lamadrid",
  //   "2291": "Miramar",
  //   "2292": "Benito Juárez",
  //   "2296": "Ayacucho",
  //   "2297": "Rauch",
  //   "2302": "General Pico",
  //   "2314": "Bolívar",
  //   "2316": "Arboledas",
  //   "2317": "9 de Julio",
  //   "2320": "José C. Paz",
  //   "2323": "Luján",
  //   "2324": "Mercedes",
  //   "2325": "San Andrés de Giles",
  //   "2326": "San Antonio de Areco",
  //   "2331": "Adolfo Van Praet",
  //   "2333": "Colonia Barón",
  //   "2334": "Conhello",
  //   "2335": "Arata",
  //   "2336": "Huinca Renancó",
  //   "2337": "América",
  //   "2338": "Algarrobo del Águila",
  //   "2342": "Bragado",
  //   "2343": "Elvira",
  //   "2344": "Álvarez de Toledo",
  //   "2345": "25 de Mayo",
  //   "2346": "Chivilcoy",
  //   "2352": "Chacabuco",
  //   "2353": "Arribeños",
  //   "2354": "El Dorado",
  //   "2355": "Arenaza",
  //   "2356": "Coronel Granada",
  //   "2357": "Carlos Salas",
  //   "2358": "Los Toldos",
  //   "2392": "30 de Agosto",
  //   "2393": "Salazar",
  //   "2394": "Ingeniero Thomson",
  //   "2395": "Bellocq",
  //   "2396": "Chiclana",
  //   "2473": "Colón",
  //   "2474": "Gahan",
  //   "2475": "Carabelas",
  //   "2477": "Pergamino",
  //   "2478": "Arrecifes",
  //   "2622": "Tunuyán",
  //   "2624": "Uspallata",
  //   "2625": "Alvear (Mza)",
  //   "2626": "La Paz (Mza)",
  //   "2646": "Valle Fértil",
  //   "2647": "Colangüil",
  //   "2648": "Barreal/Calingasta",
  //   "2651": "Candelaria",
  //   "2655": "Juan Llerena",
  //   "2656": "Merlo (SL)",
  //   "2657": "Villa Mercedes",
  //   "2658": "Anchorena",
  //   "2901": "Ushuaia",
  //   "2902": "El Calafate",
  //   "2903": "Lago Blanco",
  //   "2920": "Viedma",
  //   "2921": "Pehuen Có",
  //   "2922": "Coronel Pringles",
  //   "2923": "Pigüé",
  //   "2924": "17 de Agosto",
  //   "2925": "Bernasconi",
  //   "2926": "Coronel Suárez",
  //   "2927": "Algarrobo",
  //   "2928": "Pedro Luro",
  //   "2929": "Guaminí",
  //   "2931": "General Conesa (RN)",
  //   "2932": "Bajo Hondo",
  //   "2933": "Huanguelén",
  //   "2934": "Sierra de la Ventana",
  //   "2935": "Rivera",
  //   "2936": "Carhué",
  //   "2940": "Ingeniero Jacobacci",
  //   "2942": "Aluminé",
  //   "2945": "Esquel",
  //   "2946": "Choele Choel",
  //   "2948": "Chos Malal",
  //   "2952": "General Acha",
  //   "2953": "Guatraché",
  //   "2954": "Santa Rosa",
  //   "2962": "Puerto San Julián",
  //   "2963": "Perito Moreno",
  //   "2964": "Río Grande",
  //   "2966": "Río Gallegos",
  //   "2972": "Junín de los Andes",
  //   "2982": "Tres Arroyos",
  //   "2983": "González Chaves",
  //   "3327": "Benavídez",
  //   "3329": "Alsina",
  //   "3382": "Venado Tuerto",
  //   "3385": "Laboulaye",
  //   "3387": "Buchardo",
  //   "3388": "General Villegas",
  //   "3400": "Villa Constitución",
  //   "3401": "Campo Castro",
  //   "3402": "Arroyo Seco",
  //   "3404": "Campo Piaggio",
  //   "3405": "Reconquista",
  //   "3406": "San Cristóbal",
  //   "3407": "Ramallo",
  //   "3408": "Vera",
  //   "3409": "Colonia Bossi",
  //   "3435": "Nogoyá",
  //   "3436": "Victoria",
  //   "3437": "Villaguay",
  //   "3438": "La Paz (ER)",
  //   "3442": "Concepción del Uruguay",
  //   "3444": "Gualeguay",
  //   "3445": "Rosario del Tala",
  //   "3446": "Gualeguaychú",
  //   "3447": "Colón (ER)",
  //   "3454": "Federal",
  //   "3455": "Chajarí",
  //   "3456": "San José de Feliciano",
  //   "3458": "San José",
  //   "3460": "Cañada de Gómez",
  //   "3462": "Casilda",
  //   "3463": "Benjamín Gould",
  //   "3464": "Arequito",
  //   "3465": "Firmat",
  //   "3466": "San Jorge",
  //   "3467": "Totoras",
  //   "3468": "Marcos Juárez",
  //   "3469": "Acebal",
  //   "3471": "Armstrong",
  //   "3472": "Corral de Bustos",
  //   "3476": "San Lorenzo",
  //   "3482": "Reconquista",
  //   "3483": "Calchaquí (SF)",
  //   "3487": "Lima",
  //   "3489": "Campana",
  //   "3491": "San Justo",
  //   "3492": "Rafaela",
  //   "3493": "Sunchales",
  //   "3496": "Tostado",
  //   "3497": "Esperanza",
  //   "3498": "San Carlos Centro",
  //   "3521": "Deán Funes",
  //   "3522": "La Falda",
  //   "3524": "Villa de Soto",
  //   "3525": "Jesús María",
  //   "3532": "Oliva",
  //   "3533": "Las Varillas",
  //   "3537": "Bell Ville",
  //   "3541": "Villa Carlos Paz",
  //   "3542": "Cosquín",
  //   "3543": "Argüello",
  //   "3544": "Villa Dolores",
  //   "3546": "Santa Rosa de Calamuchita",
  //   "3547": "Alta Gracia",
  //   "3548": "La Cumbre",
  //   "3549": "Cruz del Eje",
  //   "3562": "Morteros",
  //   "3563": "Balnearia",
  //   "3564": "San Francisco",
  //   "3571": "Almafuerte",
  //   "3572": "Río Segundo",
  //   "3573": "Villa del Rosario",
  //   "3574": "Río Primero",
  //   "3575": "La Puerta",
  //   "3576": "Arroyito (Cba)",
  //   "3582": "Sampacho",
  //   "3583": "Huinca Renancó",
  //   "3584": "Vicuña Mackenna",
  //   "3585": "Adelia María",
  //   "3711": "Las Lomitas",
  //   "3715": "Ingeniero Juárez",
  //   "3716": "Cte. Fontana",
  //   "3718": "Clorinda",
  //   "3721": "Charadai",
  //   "3725": "General San Martín",
  //   "3731": "Charata",
  //   "3734": "Villa Ángela",
  //   "3735": "Quitilipi",
  //   "3741": "Bernardo de Irigoyen",
  //   "3743": "Puerto Rico (Mis)",
  //   "3751": "Eldorado",
  //   "3754": "Leandro N. Alem",
  //   "3755": "Oberá",
  //   "3756": "Santo Tomé (Ctes)",
  //   "3757": "Puerto Iguazú",
  //   "3758": "Apóstoles",
  //   "3772": "Paso de los Libres",
  //   "3773": "Mercedes (Ctes)",
  //   "3774": "Curuzú Cuatiá",
  //   "3775": "Monte Caseros",
  //   "3777": "Goya",
  //   "3781": "San Roque",
  //   "3782": "Ituzaingó (Ctes)",
  //   "3786": "Itatí",
  //   "3821": "Chepes",
  //   "3825": "Chilecito",
  //   "3826": "Chamical",
  //   "3827": "Aimogasta",
  //   "3832": "Ancasti",
  //   "3835": "Andalgalá",
  //   "3837": "Tinogasta",
  //   "3838": "Belén (Cat)",
  //   "3841": "Monte Quemado",
  //   "3843": "Quimilí",
  //   "3844": "Añatuya",
  //   "3845": "Loreto",
  //   "3846": "Campo Gallo",
  //   "3854": "Termas de Río Hondo",
  //   "3855": "Frías",
  //   "3856": "Bandera",
  //   "3857": "Selva",
  //   "3858": "Villa Ojo de Agua",
  //   "3861": "Concepción (Tuc)",
  //   "3862": "Trancas",
  //   "3863": "Monteros",
  //   "3865": "Aguilares",
  //   "3867": "Tafí del Valle",
  //   "3868": "Cafayate",
  //   "3869": "Simoca",
  //   "3873": "Tartagal",
  //   "3876": "Joaquín V. González",
  //   "3877": "Las Lajitas",
  //   "3878": "Orán",
  //   "3885": "La Quiaca",
  //   "3886": "Libertador Gral. San Martín",
  //   "3887": "Abra Pampa",
  //   "3888": "San Pedro (Jujuy)",
  //   "3891": "Graneros",
  //   "3892": "Amaicha del Valle",
  //   "3894": "Burruyacú",
  // }

  interface Props {
    name: string
    value?: string
    error?: string
    label?: string
  }

  let {
    name,
    value = "",
    error,
    label = "Teléfono",
  }: Props = $props()

  // svelte-ignore state_referenced_locally
  let digits = $state(
    value.startsWith(PHONE_PREFIX)
      ? value.slice(PHONE_PREFIX.length)
      : "",
  )

  let full_number = $derived(
    digits.length > 0 ? `${PHONE_PREFIX}${digits}` : "",
  )

  function handle_input(event: Event) {
    const target = event.currentTarget as HTMLInputElement
    digits = target.value.slice(0, PHONE_DIGITS_LENGTH)
  }

  function handle_beforeinput(event: InputEvent) {
    if (
      digits.length >= PHONE_DIGITS_LENGTH &&
      (event.inputType === "insertText" ||
        event.inputType === "insertFromPaste")
    ) {
      event.preventDefault()
    }
  }
</script>

<div class="field">
  <label class="body-md-medium label" for={name}>
    {label}
  </label>
  <div class="phone">
    <span class="body-md-medium prefix">🇦🇷 +54 9</span>
    <input
      id={name}
      class="body-md-medium input"
      type="number"
      oninput={handle_input}
      onbeforeinput={handle_beforeinput}
      placeholder="1112345678"
    />
  </div>
  <p class="body-md-medium error" class:visible={!!error}>
    {error ?? "\u00A0"}
  </p>
  <input type="hidden" {name} value={full_number} />
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
  }

  .label {
    color: var(--color-text-heading);
  }

  .phone {
    display: flex;
    align-items: center;
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-lg);
    overflow: hidden;
  }

  .phone:focus-within {
    outline: var(--focus-ring-width) solid
      var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  .prefix {
    padding: var(--dimension-spacing-2-5)
      var(--dimension-spacing-3);
    color: var(--color-text-body);
    border-right: 1px solid var(--color-border-primary);
    white-space: nowrap;
    user-select: none;
    background-color: var(--color-neutrals-50);
  }

  .phone > input.input {
    flex: 1;
    border: none;
    background: transparent;
    padding: var(--dimension-spacing-2-5)
      var(--dimension-spacing-3-5);
    color: var(--color-text-heading);
    height: auto;
    outline: none;
  }

  .phone > input.input::placeholder {
    color: var(--color-neutrals-300);
  }

  .error {
    color: transparent;
    margin: 0;
  }

  .error.visible {
    color: var(--color-text-error);
  }
</style>
