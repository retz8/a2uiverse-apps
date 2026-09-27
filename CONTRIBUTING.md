# Contributing

These are the vendor apps of [A2UIVerse](https://github.com/retz8/a2uiverse), which is in active development and isn't done. Feedback from anyone interested in it is welcome.

## Feedback and questions

Start a thread in the platform repo's [Discussions](https://github.com/retz8/a2uiverse/discussions): an idea, a question, how an app looked or behaved inside A2UIVerse.

## Bugs

Open an [issue](https://github.com/retz8/a2uiverse-apps/issues/new/choose) here with the app, the mode it ran in (`deterministic`, `stub` or `live`), what you expected, and what happened. Never paste a token or any other credential into an issue.

## Code changes

Open a discussion or an issue before writing code, so the change is agreed on first. On a pull request, `pnpm verify` must be green at the root, and `uv run pytest` in every agent the change touches. [Running an app](README.md#running-an-app) covers the setup, and [Building a new app](README.md#building-a-new-app) a new one.

## Security

Report a vulnerability privately, as [SECURITY.md](SECURITY.md) describes, never in an issue or a discussion.

## Code of conduct

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
