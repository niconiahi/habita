# Habita - Internal Functionalities Document

---

## Landing Page (`/`)

- View a welcome message
- Navigate to the properties listing

---

## Profile (`/profile`)

**Personal Info**

- Edit your first name
- Edit your last name
- Edit your phone number
- Edit your document number (DNI)
- View your email (cannot be changed)
- Save changes

**Documents**

- Upload personal documents (ID, proof of address, etc.)
- Choose document type when uploading
- View list of uploaded documents
- Download any document

---

## Properties Listing (`/properties`)

- View all available properties as cards
- See property location
- See current rental price (or "Consultar precio" if not set)
- View property photos in a carousel
- Click to view property details

---

## Property Details (`/properties/[id]`)

- View full address (street, neighborhood, city, province)
- View property destiny/purpose (housing, commercial, etc.)
- View list of rooms with dimensions
- View room layout map
- View all property photos
- Click "Reservar" to book a visit
  - If you don't have a credit report uploaded, redirects to help article

---

## Book a Visit (`/properties/[id]/book`)

**Step 1: Select date**

- View available dates
- Select one date
- Click "Seleccionar fecha"

**Step 2: Select time slot**

- View available time slots for selected date
- Select one time slot
- Click "Reservar este horario" to confirm

---

## Payment Test (`/pay`)

- Click "Pagar 50 ARS" to test Mercado Pago integration
- Redirects to Mercado Pago checkout
- Returns to success or failure page

---

## Payment Success (`/pay/success`)

- View payment success confirmation

---

## Payment Failure (`/pay/failure`)

- View payment failure message

---

## Rates Index (`/rates`)

- View current month/year
- For each rate type (IPC, ICL, UVA, CAC, CER, IS, IPIM, Casa Propia):
  - Enter the current value
  - Click "Guardar" to save

---

## Learn Articles (`/learn/[slug]`)

- Read help articles (booking requirements, phone number format, etc.)

---

---

# Admin Section

---

## Properties List (`/admin/properties`)

- View all your properties in a table
- See location, type, and state for each
- **If property is in "Editing" state:**
  - Click "Editar" to edit
  - Click "Publicar" to make it public
- **If property is "Published":**
  - Click "Calendario de visitas" to manage visits
  - Click "Despublicar" to unpublish
- Click "Nueva propiedad" to create a new one

---

## Create Property (`/admin/properties/new`)

**Location**

- Enter address (autocomplete with map)

**Characteristics**

- Select property type (Department or House)
- If department: enter unit number

**Destiny**

- Check one or more purposes (housing, commercial, etc.)

- Click "Crear propiedad" to save

---

## Edit Property (`/admin/properties/[id]/edit`)

**Location**

- Update address
- View/change coordinates on map
- Click "Guardar ubicación"

**Destiny**

- Check/uncheck purposes
- Click "Guardar destino"

**Rooms**

- Click "Agregar ambiente" to add a room
- For each room:
  - Select type (bedroom, bathroom, kitchen, etc.)
  - Enter length and width
  - Click "Guardar ambiente" or "Eliminar ambiente"

**Room Map**

- Drag rooms to position them visually
- Click "Guardar mapa"

**Members**

- View current members (landlord, manager)
- If no landlord: enter email to invite owner
- Click "Invitar dueño"

**Photos**

- Click "Agregar foto" to upload
- View all uploaded photos

**Services**

- Click "Agregar servicio" to add
- For each service:
  - Select type (gas, electricity, water, etc.)
  - Enter service ID/code
  - Click "Guardar servicio" or "Eliminar servicio"

---

## Visit Calendar (`/admin/properties/[id]/calendar`)

**Create time slot**

- Select date
- Enter start time
- Enter end time
- Click "Crear horario"

**Existing slots**

- View all slots in a table (date, start, end, status)
- If slot is "Free": click "Eliminar" to remove it
- Reserved slots cannot be deleted

---

## Property Candidates (`/admin/properties/[id]/candidates`)

- View list of people who booked a visit
- See name, email, phone
- Navigate to candidate profile

---

## Contracts List (`/admin/contracts`)

- Filter contracts by state (Editing, Active, Finished)
- View all contracts in a table
- See property, tenant name, end date
- **If contract is "Editing":** click "Editar"
- Click "Nuevo contrato" to create one

---

## Create Contract - Select Property (`/admin/contracts/new`)

- Select a property from dropdown
- Click "Continuar"

---

## Create Contract - Details (`/admin/properties/[id]/contracts/new`)

**Type**

- Select contract type (long-term, short-term)

**Price**

- Enter initial rental price

- Click "Crear contrato"

---

## Edit Contract (`/admin/properties/[id]/contracts/[id]/edit`)

**Landlord section**

- View landlord info (name, email, phone, DNI)
- If missing: link to add in property edit

**Tenant section**

- View tenant info (name, email, phone, DNI)
- If missing: link to add from candidates

**Section 2: State (Contract Items)**

- Click "Agregar item" to add inventory item
- For each item:
  - Enter name
  - Select state (good, regular, bad, etc.)
  - Click "Guardar item" or "Eliminar item"
  - Add photos to item
  - Delete photos from item

**Section 3: Destiny**

- Select contract purpose from property destinies
- Click "Guardar destino"

**Section 6: Term**

- Enter start date
- Enter end date
- Click "Guardar plazo"

**Section 7: Rental price escalation**

- Select escalation type (IPC, ICL, UVA, etc.)
- Select escalation frequency (every 1, 2, 3... months)
- Click "Guardar valores"

**Section 8: Payment method**

- Enter CBU (bank account number)
- Click "Guardar CBU"

**Section 9: Late payment fine**

- Enter fine percentage
- Click "Guardar porcentaje"

**Section 14: Returns**

- Enter return percentage
- Click "Guardar porcentaje"

**Section 15: Early termination**

- Enter early termination description/terms
- Click "Guardar recesión anticipada"

**Section 16: Property showings**

- Enter allowed showing hours during rental
- Click "Guardar cantidad"

**Section 17: Warranty**

- Select warranty type:
  - **Property warranty:** enter guarantor name, DNI, email, property address, cadastral info
  - **Income warranty:** save to add guarantors, then add/edit/remove guarantors (name, DNI, email)
  - **Surety warranty:** enter guarantor info + insurance company name, policy number, email
- Click "Crear garantía" or "Guardar garantía"

**Section 21: Jurisdiction**

- Select court/jurisdiction
- Click "Guardar jurisdicción"

**Actions**

- Click "Generar contrato" to generate PDF

**Documents**

- Click "Agregar documento" to upload contract files
- Choose document type
- View uploaded documents
- Download or delete documents

**Periods**

- View rental periods
- For first period: edit initial price
- Click "Guardar precio"

---

## Contract Tenant Page (`/admin/properties/[id]/contracts/[id]/tenant`)

**Current rent price**

- View current rental amount

**Payment receipts (by month)**

- For each month and receipt type:
  - If uploaded: click "Descargar" to download
  - If not uploaded: upload file and click "Subir"

---

## Candidates List (`/admin/candidates`)

- View all candidates in a table
- See name, visit date/time, property
- Click "Ver perfil" to see details
- Click "Asignar como inquilino" to convert to tenant

---

## Candidate Profile (`/admin/candidates/[id]`)

- View name
- View email
- View phone (if available)

---

## Tenants List (`/admin/tenants`)

- View all tenants in a table
- See name, email, assigned property
- Click "Ver perfil" to see details

---

## Tenant Profile (`/admin/tenants/[id]`)

- View name
- View email

---

## Realtor / Organization Management (`/admin/realtor`)

**Organization**

- View organization name

**Invite manager**

- Enter manager email
- Click "Enviar Invitacion"

**Managers list**

- View all managers (name, email, assigned properties count)
- Click "Remover" to remove a manager
