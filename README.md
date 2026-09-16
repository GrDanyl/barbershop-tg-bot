# Barbershop Telegram Bot

A Telegram bot for booking a barbershop appointment via inline buttons: service → day → time → name → confirmation.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and paste your bot token:

   ```bash
   cp .env.example .env
   ```

   ```
   BOT_TOKEN=your_token_from_BotFather
   ```

3. Start in development mode (auto-restarts on file changes):

   ```bash
   npm run dev
   ```

The SQLite database is created automatically as `bookings.sqlite` in the project root on first run.

## Build and run in production (without Docker)

```bash
npm run build
npm start
```

## Run with Docker (for a VPS)

1. Create a `.env` file next to `docker-compose.yml`:

   ```
   BOT_TOKEN=your_token_from_BotFather
   ```

2. Build and start:

   ```bash
   docker compose up -d --build
   ```

The database is persisted at `./data/bookings.sqlite` on the host (via a volume), so it survives rebuilds and restarts.

Logs:

```bash
docker compose logs -f
```

Stop:

```bash
docker compose down
```

## Project structure

- `src/bot.ts` — Telegraf setup, all dialog step handlers
- `src/dialogFlow.ts` — in-memory dialog state machine, keyed by chat_id
- `src/dateUtils.ts` — generates the next working days (Mon-Sat)
- `src/services.ts` — list of barbershop services (edit directly)
- `src/db/index.ts` — SQLite connection, `bookings` table schema
- `src/db/bookings.ts` — queries: free slots, create booking (with race-condition protection)

## Dialog flow

1. `/start` → choose a service
2. Choose a day (next 5 working days, Mon-Sat)
3. Choose a time (10:00-18:00 slots, already-booked ones excluded)
4. Type your name as a text message
5. Confirm (✅ / ❌)

Every step except the first has a "🔙 Back" button. Stale button taps (on an already-passed step) are ignored. If a slot gets taken seconds before confirmation, the bot reports it and lets you pick another time.

## Editing the services list

Just edit the `SERVICES` array in [src/services.ts](src/services.ts).

## Editing the time slots

The `TIME_SLOTS` array in [src/db/bookings.ts](src/db/bookings.ts).

## Security note

Never commit your `.env` file or `BOT_TOKEN` — `.env` and `*.sqlite` are already listed in `.gitignore`. Use `.env.example` as a template.
