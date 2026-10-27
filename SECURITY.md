# Security Policy

## Supported versions

Only the latest commit on `main` is supported. Flexnotes is a static,
client-side application; security fixes are published by updating `main` and
redeploying.

## Reporting a vulnerability

Please do **not** open a public GitHub issue for security problems.

Contact the maintainer directly:

- GitHub: [@temidayoxyz](https://github.com/temidayoxyz) (use a private
  security advisory via *Security → Report a vulnerability* if enabled, or
  another private channel you have for the maintainer).

Include a description of the issue, how to reproduce it, and any impact
assessment you can offer. You can expect an initial response within a week.

## Scope notes

Flexnotes is a fully client-side application:

- Note data never leaves the browser (localStorage only); there is no backend,
  no accounts, and no telemetry, so server-side vulnerabilities do not apply.
- Attack surface worth reporting includes: XSS through stored/imported note
  data, unsafe handling of imported JSON backup files, or any way canvas data
  could be transmitted externally.
- Reports about self-inflicted data loss (clearing browser data, quota
  exhaustion) are appreciated but are documented behaviour — see the README's
  "Privacy & storage" section.
