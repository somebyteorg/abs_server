# EMOS login

Set `EMOS_URL` to the EMOS server base URL. The web login page keeps its username/password form and adds an **emos快捷登录** button. Both use Passport's `emos` provider and the existing `POST /login` endpoint. Without `EMOS_URL`, the existing local login behavior is preserved and the quick-login button is hidden.

With Node.js 24, environment files can be loaded explicitly:

```sh
node --env-file=.env dist-server/index.js
```

The application does not automatically load `.env`. See `.env.example`. Set `EMOS_URL` in the process environment for either development or production.

## Username/password login

Both fields are required. The backend sends `username`, `password`, and `client_ip` to `POST <EMOS_URL>/server/abs/userLogin`. A successful response supplies `emos_id`, `username`, `type`, `is_can_down`, and optional `is_show_adult`.

This flow continues to create or update the matching local account, synchronizing its username, type, active status, and the fixed permissions. `is_can_down` controls download permission; `is_show_adult` controls adult-content access. Update, delete, upload, and e-reader creation permissions are false. Local UUIDs, bookmarks, and playback progress are retained. HTTP 401 displays the external `message` in the form.

## Quick login

The frontend obtains the sign-in URL from `GET /status`; its build does not need a separate EMOS configuration. Visiting the login page displays the form and button without redirecting automatically.

1. Clicking **emos快捷登录** redirects the browser to `<EMOS_URL>/api/sign?state=emos_abs`.
2. EMOS returns the browser to `/audiobookshelf/login?token=...`.
3. The frontend removes the external token from the address bar and sends it in the body of `POST /login`. It is not saved in browser storage or the database.
4. Passport's `emos` strategy calls `GET <EMOS_URL>/api/user/base` with `Authorization: Bearer <token>`.
5. A successful response contains `user_id` and `username`. The server looks up `users.emos_id` using `user_id`, ignoring case, and continues through the existing JWT, session, cookie, and login response handling.

For quick login, existing accounts are reused without changing their username, type, permissions, bookmarks, or playback progress. New accounts use a local UUID, `type: user`, no local password, and the standard user defaults with `download` and `accessExplicitContent` set to false. Both flows match the same case-insensitive `emos_id`; same-name local accounts are not automatically linked.

For quick login, HTTP 401 from EMOS clears the local browser login and returns it to `/audiobookshelf/login`. Inactive local accounts return 403. Service failures show a retry action. Outbound requests have a 10-second timeout and do not follow redirects.

The frontend remembers the requested application page across the external redirect and restores it after sign-in. All login paths use the configured router base path; `/audiobookshelf` is the default.

The Postgres migration `fork-pg-0006-user-emos-id` adds nullable `users.emos_id VARCHAR(10)` and a unique index on `LOWER(emos_id)`. Existing users keep null IDs. It runs through the existing Postgres migration manager at startup. Token/session/refresh behavior remains local.
