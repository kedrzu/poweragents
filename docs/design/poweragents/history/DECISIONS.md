# Retired decisions

Full text of decisions no longer in force, under their original IDs. Never edited after writing,
except to append the next retired form.

## D10

Retired 2026-11-08, replaced by [D12](#d12), itself since replaced by [D21](../DECISIONS.md#d21).


**A mobile companion app is part of the first version, not later.** (2026-11-08, owner)

**Why.** In the reference setup the agent's output reaches the person on the phone (today via a
Telegram bot, which needed technical setup). The phone is where a schedule's result is read.

**Open.** How the phone reaches the daemon (relay vs tunnel), push notifications.

## D19

Retired 2026-11-08, replaced by [D20](../DECISIONS.md#d20).


**A plugin keeps what it learns about the user (e.g. email-sorting rules) as ordinary files in its own
folder, shown in the app under that plugin ("what this plugin knows about me"), not as a project.**
(2026-11-08, owner)

**Why.** People don't think of email sorting as a project; to them a project starts and ends. The files
stay plain and visible, consistent with [D9](#d9) — only their place in the interface differs.

**Rejected.**
- Installing a plugin creates a regular project holding its files — proposed by the design agent
  2026-11-08; "email sorting" is not something people call a project.
- A hidden plugin store — contradicts plain, visible memory ([D9](#d9)).

## D12

Retired 2026-11-08, replaced by [D21](../DECISIONS.md#d21).


**Version one is desktop-only and local. The mobile companion (notifications, talking to the agent)
follows in version two, soon after.** (2026-11-08, owner)

**Why.** Notifications on the phone are where a schedule's result is actually read (the reference
setup uses a Telegram bot, which needed technical setup), so it comes quickly — but not first.

**Rejected.**
- Mobile companion in version one ([history](history/DECISIONS.md#d10)) — owner moved it to version
  two.

**Open, deferred by owner.** How the phone reaches the daemon. Notes so far: Paseo's opt-in relay
(daemon connects outbound, phone pairs by QR, E2E-encrypted, no VPN on the phone) fits; Headscale
alone does not, since the phone would still need the Tailscale VPN client; push notifications need a
server holding the app's APNs/FCM keys, i.e. a hosted component of ours.


## D5

Retired in part 2026-11-08: the "works with any compatible daemon — local, remote or custom" half dropped; rewritten in place as [D5](../DECISIONS.md#d5).


**A daemon runs in the background and exposes everything over a port; the desktop app is a thin
client that works with any compatible daemon — local, remote or custom.** (2026-11-08, owner)

**Why.** It lets the core be swapped (custom file storage, a company cloud) under the same signed
app, and it is the shape a mobile companion and cloud-hosted agents need. Paseo is the model.

> **Checked 2026-11-08:** Paseo's daemon listens on `ws://127.0.0.1:6767`; desktop (Electron), mobile
> (Expo), web and CLI connect to it; remote access via an opt-in E2E-encrypted relay —
> [getpaseo/paseo](https://github.com/getpaseo/paseo), [security](https://paseo.sh/docs/security).

