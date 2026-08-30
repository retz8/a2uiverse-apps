import click
import uvicorn

from deterministic_agent.server import DEFAULT_PORT, build_app


@click.command()
@click.option("--host", default="localhost")
@click.option("--port", default=DEFAULT_PORT)
@click.option(
    "--base-url",
    default=None,
    help=(
        "Public URL to advertise in the agent card (e.g. a devtunnel URL). "
        "Defaults to http://<host>:<port>. Set this when the client reaches the "
        "server through a tunnel/proxy so message/send targets the public URL."
    ),
)
def main(host: str, port: int, base_url: str | None) -> None:
    uvicorn.run(build_app(host, port, base_url), host=host, port=port)


if __name__ == "__main__":
    main()
