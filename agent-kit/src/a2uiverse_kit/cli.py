"""The single agent entrypoint: `python -m app --mode deterministic|stub|live`.

An app's `__main__.py` is a shim handing its config to `run()`. Dotenv loading, the
timestamped logging config, and the long keep-alive apply in every mode.
"""

from __future__ import annotations

import logging

import click

from a2uiverse_kit.config import AgentAppConfig
from a2uiverse_kit.modes import MODES


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
            "Public URL to advertise in the agent card (e.g. a devtunnel URL). "
            "Defaults to http://<host>:<port>. Set this when the client reaches the "
            "server through a tunnel/proxy so message/send targets the public URL."
        ),
    )
    def main(mode: str, host: str, port: int, base_url: str | None) -> None:
        import uvicorn
        from dotenv import load_dotenv

        from a2uiverse_kit.server import build_app

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
            build_app(config, mode, host, port, base_url),
            host=host,
            port=port,
            log_config=None,
            timeout_keep_alive=300,
        )

    return main


def run(config: AgentAppConfig) -> None:
    build_command(config)()
