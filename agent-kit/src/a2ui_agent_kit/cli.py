"""The single agent entrypoint: `python -m app --mode deterministic|stub|live`.

An app's `__main__.py` is a shim handing its config to `run()`. Dotenv loading, the
timestamped logging config, and the long keep-alive apply in every mode.
"""

from __future__ import annotations

import logging
from pathlib import Path

import click

from a2ui_agent_kit.config import AgentAppConfig
from a2ui_agent_kit.modes import MODES
from a2ui_agent_kit.sign_in_server import ACCESS_TOKEN_LIFETIME


def build_command(config: AgentAppConfig) -> click.Command:
    @click.command()
    @click.option(
        "--mode",
        type=click.Choice(MODES),
        default="deterministic",
        show_default=True,
        help="deterministic: canned fixtures, no model. stub: model over canned "
        "tools. live: model over the vendor's live toolset.",
    )
    @click.option("--host", default="localhost")
    @click.option("--port", default=config.default_port, show_default=True)
    @click.option(
        "--base-url",
        default=None,
        help=(
            "URL to advertise in the agent card: its message/send endpoint, and with "
            "sign-in the issuer, metadata and token endpoint. Defaults to "
            "http://<host>:<port>. Set this when the caller reaches the server through a "
            "tunnel/proxy so message/send targets a reachable URL."
        ),
    )
    @click.option(
        "--public-url",
        default=None,
        help=(
            "URL the browser reaches the sign-in pages at (e.g. a devtunnel URL): the "
            "sign-in page, the account chooser's form and the finish address a vendor "
            "returns to. Defaults to --base-url."
        ),
    )
    @click.option(
        "--state-dir",
        type=click.Path(file_okay=False, path_type=Path),
        default=None,
        help="Where the sign-in store lives. Defaults to <app>/.state.",
    )
    @click.option(
        "--access-token-lifetime",
        type=click.IntRange(min=1),
        default=ACCESS_TOKEN_LIFETIME,
        show_default=True,
        help="Seconds an issued access token lives. Development only: shorten it to "
        "exercise refresh.",
    )
    def main(
        mode: str,
        host: str,
        port: int,
        base_url: str | None,
        public_url: str | None,
        state_dir: Path | None,
        access_token_lifetime: int,
    ) -> None:
        import uvicorn
        from dotenv import load_dotenv

        from a2ui_agent_kit.server import build_app

        # Debug aid: timestamped logs so request/model/stream ordering is unambiguous.
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s.%(msecs)03d %(levelname)s %(name)s: %(message)s",
            datefmt="%H:%M:%S",
        )
        # app_dir/.env (see .env.example) supplies MODEL_NAME / credentials; anchored
        # to the agent dir so the entrypoint works from any cwd. Real env vars take
        # precedence.
        load_dotenv(config.app_dir / ".env")
        # log_config=None: let uvicorn's loggers propagate to the timestamped root
        # handler. timeout_keep_alive: uvicorn's 5s default kills idle sockets between
        # turns; a tunnel data-plane that reuses the dead upstream connection then
        # hangs the next POST until the browser gives up. Hold connections across
        # realistic turn gaps instead.
        uvicorn.run(
            build_app(
                config,
                mode,
                host,
                port,
                base_url,
                state_dir=state_dir,
                access_token_lifetime=access_token_lifetime,
                public_url=public_url,
            ),
            host=host,
            port=port,
            log_config=None,
            timeout_keep_alive=300,
        )

    return main


def run(config: AgentAppConfig) -> None:
    build_command(config)()
