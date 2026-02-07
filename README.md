# Sistema Avançat de Rols i Permisos (RBAC) amb Auditoria

Projecte realitzat per a la **Tasca 8** del mòdul de Frameworks de frontend i backend.

## 🚀 Descripció

Aquesta API escrita en Node.js implementa un control d'accés basat en rols (RBAC) d'alt nivell. Permet gestionar permisos granulars, agrupar-los en rols i assignar-los a usuaris, tot sota un sistema de monitorització d'auditoria automàtica.

## 🛠️ Tecnologies

- **Runtime:** Node.js
- **Framework:** Express.js
- **Base de dades:** MongoDB + Mongoose
- **Seguretat:** JWT (JSON Web Tokens) & Bcryptjs
- **Validació:** Express-validator

## 🔑 Característiques Principals

- **Seguretat Granular:** Els permisos es defineixen acció per acció (ex: `tasks:create`).
- **Auditoria Automàtica:** Es registren totes les accions administratives, incloent IP, User-Agent i canvis realitzats.
- **Protecció de Sistema:** Bloqueig d'eliminació per a rols i permisos crítics.
- **Seeding Automàtic:** Script per inicialitzar la base de dades amb una arquitectura de seguretat funcional.

## 🚦 Instal·lació i Ús

1. Instal·lar dependències:

   ```bash
   npm install
   ```

2. Configurar variables d'entorn al fitxer `.env`:

   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/tasca8_rbac
   JWT_SECRET=la_teva_clau_secreta
   JWT_EXPIRE=30d
   ```

3. Inicialitzar la base de dades:

   ```bash
   npm run seed:rbac
   ```

4. Executar en mode desenvolupament:
   ```bash
   npm run dev
   ```

## 🧪 Usuari Administrador Inicial

- **Email:** `admin@test.com`
- **Password:** `Password123!`

---

Realitzat per **Jason Okoro** - 2026
