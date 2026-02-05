# Ghid Utilizator - Mini CRM

Acest ghid te va ajuta să folosești toate funcționalitățile aplicației Mini CRM.

## Cuprins

1. [Autentificare](#autentificare)
2. [Gestionare Contacte](#gestionare-contacte)
3. [Sistem Ticketing (Inbox)](#sistem-ticketing-inbox)
4. [Calendar Personal](#calendar-personal)
5. [Tag-uri](#tag-uri)
6. [Profil Personal](#profil-personal)
7. [Administrare (SUPERADMIN)](#administrare-superadmin)

## Autentificare

### Înregistrare Cont Nou

1. Accesează pagina de login
2. Click pe "Create an account"
3. Introdu email și parolă (minim 8 caractere)
4. Click "Register"
5. Verifică email-ul pentru activare (dacă SMTP este configurat)

### Login

1. Introdu email și parolă
2. Click "Login"
3. Vei fi redirecționat către pagina principală cu contactele tale

### Resetare Parolă

1. Pe pagina de login, click "Forgot password?"
2. Introdu adresa de email
3. Verifică inbox-ul pentru link de resetare
4. Accesează link-ul și introdu noua parolă

## Gestionare Contacte

### Vizualizare Contacte

Pagina principală afișează lista de contacte cu:
- Nume contact
- Persoană de contact
- Email și telefon
- Companie
- Tag-uri asociate
- Acțiuni (Edit, Delete)

### Căutare Contacte

Folosește bara de căutare din partea de sus pentru a găsi contacte după:
- Nume
- Email
- Telefon
- Companie

### Adăugare Contact Nou

1. Click butonul **"+ New Contact"**
2. Completează formularul:
   - **Nume*** (obligatoriu)
   - Persoană de contact
   - Email
   - Telefon
   - Companie
   - Note
   - Tag-uri (selectează unul sau mai multe)
3. Click **"Create"**

### Editare Contact

1. Click butonul **"Edit"** pe cardul contactului
2. Modifică informațiile dorite
3. Click **"Update"** pentru salvare

### Ștergere Contact

1. Click butonul **"Delete"** pe cardul contactului
2. Confirmă ștergerea în dialog

### Export Contacte (CSV)

1. Click butonul **"Export CSV"** din toolbar
2. Fișierul se va descărca automat
3. Conține toate contactele tale cu tag-urile asociate

## Sistem Ticketing (Inbox)

### Vizualizare Tickete

1. Click butonul **"Inbox"** din meniul principal
2. Vezi lista de tickete cu:
   - Subiect
   - Status (Open, In Progress, Resolved, Closed)
   - Prioritate (Low, Medium, High, Urgent)
   - Contact asociat
   - Utilizator asignat
   - Număr de comentarii și atașamente

### Filtrare Tickete

Folosește dropdown-urile pentru a filtra după:
- **Status**: All statuses, Open, In Progress, Resolved, Closed
- **Prioritate**: All priorities, Low, Medium, High, Urgent

Click "Clear filters" pentru a reseta filtrele.

### Creare Ticket Nou

1. Click **"+ New Ticket"**
2. Completează:
   - **Subiect*** (obligatoriu)
   - **Descriere*** (obligatoriu)
   - Prioritate (Low/Medium/High/Urgent)
   - Assign to (alege un utilizator)
   - Contact asociat (opțional)
3. Click **"Create Ticket"**

### Vizualizare Detalii Ticket

Click pe un ticket pentru a vedea:
- Descriere completă
- Status și prioritate
- Comentarii
- Atașamente/fișiere
- Istoric

### Actualizare Status Ticket

În fereastra de detalii:
1. Folosește dropdown-ul de status
2. Alege: Open, In Progress, Resolved, sau Closed
3. Status-ul se actualizează automat

### Adăugare Comentariu

1. În fereastra de detalii ticket
2. Scroll la secțiunea "Comments"
3. Scrie comentariul în textarea
4. Click **"Add Comment"**

### Upload Fișiere la Ticket

1. În fereastra de detalii ticket
2. Click **"📎 Attach File"**
3. Alege fișierul (max 10MB)
4. Fișierul se încarcă automat

**Tipuri de fișiere acceptate:**
- Imagini: .jpg, .jpeg, .png
- Documente: .pdf, .doc, .docx
- Tabele: .xls, .xlsx
- Text: .txt

### Download Atașament

1. Click **"Download"** pe fișierul dorit
2. Fișierul se descarcă în browser

### Ștergere Atașament

1. Click **"Delete"** pe fișierul dorit
2. Confirmă acțiunea

## Calendar Personal

Acces: **Admin menu → Personal Panel**

### Vizualizare Calendar

Calendar-ul afișează:
- Evenimente pentru luna curentă
- Task-uri și întâlniri
- Codificare prin culori după tip

### Creare Eveniment/Task

1. Click pe o zi în calendar SAU click **"+ Add Event"**
2. Completează formularul:
   - **Titlu*** (obligatoriu)
   - **Tip**: Task sau Meeting
   - **Start**: Data și ora de început
   - **End**: Data și ora de sfârșit
   - **All Day**: Bifează pentru eveniment ce durează toată ziua
   - Note (opțional)
3. Click **"Create"**

### Editare Eveniment

1. Click pe eveniment în calendar
2. Modifică detaliile
3. Click **"Update"**

### Ștergere Eveniment

1. Click pe eveniment
2. Click **"Delete"**
3. Confirmă acțiunea

### Export Calendar (iCal)

1. Click **"Export iCal"**
2. Fișierul .ics se descarcă
3. Poate fi importat în Google Calendar, Outlook, etc.

## Tag-uri

### Vizualizare Tag-uri Existente

Tag-urile apar:
- În formularul de contact (pentru selectare)
- Pe cardurile contactelor
- În secțiunea Tag Manager (pentru SUPERADMIN)

### Adăugare Tag-uri la Contact

1. La crearea/editarea unui contact
2. Bifează tag-urile dorite din listă
3. Click "Create"/"Update"

### Filtrare Contact după Tag

Tag-urile vor fi vizibile pe contacte pentru filtrare rapidă.

## Profil Personal

Acces: **Admin menu → Personal Panel**

### Actualizare Informații Profil

1. Scroll la secțiunea "User Profile"
2. Modifică:
   - Language (En/Ro)
   - Timezone
   - Notification Preference (Push/Email/None)
3. Click **"Update Profile"**

### Schimbare Parolă

1. Secțiunea "Change Password"
2. Introdu:
   - Current Password
   - New Password (min 8 caractere)
   - Confirm New Password
3. Click **"Change Password"**

### Retrimite Email Verificare

Dacă contul nu este verificat:
1. Vezi banner-ul de avertizare
2. Click **"Resend verification email"**
3. Verifică inbox-ul

## Administrare (SUPERADMIN)

### Acces Menu Admin

Click pe **"Admin"** în meniul principal pentru dropdown cu:
- Personal Panel
- Activity Log
- User Management

### User Management

**Acces:** Admin → User Management

#### Vizualizare Utilizatori

Lista afișează:
- Email
- Rol (USER/ADMIN/SUPERADMIN)
- Status (ACTIVE/SUSPENDED)
- Email verificat (✓/✗)
- Data creării

#### Creare Utilizator Nou

1. Click **"Create User"**
2. Completează:
   - Email*
   - Password*
   - Role (USER/ADMIN/SUPERADMIN)
   - Status (ACTIVE/SUSPENDED)
   - Phone (opțional)
3. Click **"Create"**

#### Editare Utilizator

1. Click **"Edit"** pe utilizator
2. Modifică detaliile
3. Click **"Update User"**

**Restricții:**
- Nu poți edita propriul rol sau status
- Doar SUPERADMIN poate crea/edita alți SUPERADMIN

#### Toggle Status Utilizator

Click pe **"Toggle Status"** pentru a activa/suspenda rapid un utilizator.

#### Toggle Email Verification

Click pe **"Toggle Verified"** pentru a verifica/deverifica manual un email.

#### Ștergere Utilizator

1. Click **"Delete"** pe utilizator
2. Confirmă acțiunea
3. Nu poți șterge propriul cont

#### Vizualizare Activity Log Utilizator

Click **"View Log"** pentru a vedea toate acțiunile unui utilizator.

### Tag Manager

**Acces:** Admin → User Management → Tags tab

#### Vizualizare Tag-uri

Lista afișează toate tag-urile cu numărul de contacte asociate.

#### Creare Tag Nou

1. Introdu numele în câmpul "Tag name"
2. Click **"+ Add Tag"**

#### Ștergere Tag

1. Click **"Delete"** pe tag
2. Confirmă acțiunea
3. Tag-ul se elimină din toate contactele

### Translation Manager

**Acces:** Admin → User Management → Translations tab

Gestionează traducerile pentru interfață (EN/RO).

#### Vizualizare Traduceri

Lista afișează:
- Cheie (key)
- Traducere în engleză (EN)
- Traducere în română (RO)

#### Editare Traducere

1. Click **"Edit"** pe traducere
2. Modifică textele EN și/sau RO
3. Click **"Update"**

#### Creare Traducere Nouă

1. Click **"Add Translation"**
2. Introdu:
   - Key (identificator unic)
   - EN (text în engleză)
   - RO (text în română)
3. Click **"Create"**

### Email Log Viewer

**Acces:** Admin → User Management → Email Logs tab

Vizualizează toate email-urile trimise de sistem:
- Recipient
- Subject
- Status (PENDING/SENT/FAILED)
- Data trimiterii
- Mesaj de eroare (dacă există)

#### Filtrare Email Logs

Folosește dropdown-ul pentru a filtra după status:
- All statuses
- Pending
- Sent
- Failed

#### Retry Email Eșuat

Click **"Retry"** pe un email cu status FAILED pentru a reîncerca trimiterea.

### Activity Log

**Acces:** Admin → Activity Log

Vizualizează toate acțiunile importante din sistem:
- USER_CREATE, USER_UPDATE, USER_DELETE
- USER_STATUS, USER_VERIFY
- LOGIN, LOGOUT
- Contact și ticket operations

#### Filtre Activity Log

- **Action**: Filtrează după tipul de acțiune
- **User**: Filtrează după utilizator
- **Date Range**: Filtrează după perioadă

#### Export Activity Log

Click **"Export CSV"** pentru a descărca log-urile în format CSV.

## Sfaturi și Trucuri

### Navigare Rapidă

- Folosește butonul **"Inbox"** pentru acces rapid la tickete
- Dropdown-ul **"Admin"** grupează toate funcțiile administrative
- Folosește **"Back to Contacts"** pentru a reveni la lista principală

### Organizare Eficientă

1. **Tag-uri**: Creează tag-uri pentru tipuri de clienți (VIP, Prospect, etc.)
2. **Tickete**: Folosește priorități pentru a organiza task-urile
3. **Calendar**: Planifică follow-up-uri cu clienții

### Comenzi Rapide

- **Ctrl + F**: Caută în pagină (funcționează în liste)
- **Esc**: Închide modal-uri
- **Ctrl + Shift + R**: Hard refresh pentru actualizări

## Întrebări Frecvente (FAQ)

**Î: De ce nu pot șterge propriul cont?**
**R:** Din motive de securitate, nu poți șterge contul pe care îl folosești momentan.

**Î: Cum revin la pagina principală?**
**R:** Click pe logo-ul aplicației sau butonul "Back to Contacts".

**Î: Pot exporta ticketele?**
**R:** Momentan, doar contactele pot fi exportate în CSV. Export tickete va fi adăugat în viitor.

**Î: Cât de des se actualizeaz auto refresh la tickete?**
**R:** Detaliile ticketelor se actualizează automat la fiecare 5 secunde când fereastra este deschisă.

## Suport

Pentru întrebări sau probleme:
- Contactează administratorul de sistem
- Verifică documentația tehnică în [API Documentation](./API_DOCUMENTATION.md)
- Raportează bug-uri pe GitHub
