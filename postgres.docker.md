```sh
docker compose -f postgres.yml logs --no-color postgres --tail 200

docker exec -it <container-id-or-name> psql -U postgres -d asp_crm

docker exec -it postgres psql -U postgres -d asp_crm

# To access the PostgreSQL database inside the Docker container, use the following command:
docker exec -i <container-id-or-name> psql -U postgres -d asp_crm <<'SQL'
```

```sql
CREATE TABLE users (
  uid TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
INSERT INTO users (uid, email, display_name, role, password_hash, created_at, updated_at)
VALUES (
  'usr_manual_001',
  'admin@example.com',
  'Admin User',
  'admin',
  '$2b$12$2EvOlmJL1EWeVheQF9qZJ.1qy5frF8nu2j1XtmvU7yONx2qluPKOm',
  NOW(),
  NOW()
);
SQL

SELECT * FROM users;
SQL
```