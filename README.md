# file-manager-client

React frontend for a cloud file manager deployed on AWS EC2, served via Nginx with HTTPS (Let's Encrypt). Connects to [file-manager-server](https://github.com/valentinpopescu98/file-manager-server) Spring Boot backend.

**Companion project:** [file-manager-server](https://github.com/valentinpopescu98/file-manager-server) — Sprint Boot backend

---

## Features

### Authentication
- Email/password login with JWT stored in localStorage
- Google OAuth2 login (redirect flow via backend)
- Protected routes — unauthenticated users redirected to `/login`
- Logout clears token and redirects

### File List (`/`)
- Paginated file table (configurable items per page: 10 / 20 / 50)
- **Server-side sort** — by name, description, email, upload time (persistent across pages)
- **Client-side sort** — secondary sort on current page only, three-state toggle (asc → desc → off)
- **Filters** — name, description, uploader email, date range (uploaded before / after)
- **Client-side cache** — `useRef(Map)` with FIFO eviction at 20 entries; avoids redundant API calls when navigating back to a previously fetched page
- Download — streamed blob download, filename extracted from `Content-Disposition` header
- Delete — optimistic UI update (removes from list immediately), reverts on error

### File Upload (`/upload`)
- Multi-file selection
- Per-file status tracking: PENDING → PROCESSING → DONE / ERROR
- Async polling — after upload starts, polls `/api/upload/status` every 2 seconds until DONE or ERROR

### Infrastructure
- **Nginx** — serves static React build, reverse proxies `/api/**` and OAuth2 endpoints to backend on port 8080, HTTP → HTTPS redirect
- **HTTPS** — Let's Encrypt certificates via Certbot (`renew-certificates.sh`)
- **Docker + Docker Compose** — containerized build and serve
- **`build-and-run.sh`** — SSH into EC2, clone, build and start container

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | JavaScript (React 18) |
| Routing | React Router v6 |
| HTTP | Axios |
| Web server | Nginx |
| TLS | Let's Encrypt (Certbot) |
| Container | Docker, Docker Compose |
| Server | EC2 (Ubuntu) |

---

## How to run

1. Build and start the server: see [file-manager-server README](https://github.com/valentinpopescu98/file-manager-server/blob/master/README.md)
2. `git clone git@github.com:valentinpopescu98/file-manager-client.git ~/file-manager-client/`
3. Set EC2 instance IP in `~/file-manager-client/.env`
4. `~/file-manager-client/build-and-run.sh`
5. `npm install`

---
- `file-manager-key.pem` = EC2 private key (`~/.ssh/`)
- `id_rsa` = GitHub private key (`~/.ssh/`)
- `user` = EC2 user (e.g. `ubuntu`)
- `host` = EC2 instance public IP
