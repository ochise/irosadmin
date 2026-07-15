# iROSPlus UI - Enhanced Frontend

This frontend includes:
- Full CRUD UIs for Agents, Entities, Revenue Heads, SubRevenueHeads
- Validation with React Hook Form + Yup
- Role-based UI controls (button visibility determined by decoded JWT role)
- Optimistic UI updates with rollback on failure
- Toast notifications with notistack and improved error handling
- Dark/light theme toggle and persisted preference

Quickstart:
1. `npm install`
2. `npm run dev`
3. Set `VITE_API_BASE` env var if API not at default `http://localhost:5000/api`
4. Login using seeded admin credentials: `admin` / `Admin@123`

Notes:
- The UI expects endpoints: /agents, /entities, /revenueheads, /subrevenueheads
- Pagination currently client-side (slice). For server-side paging, update API calls.
