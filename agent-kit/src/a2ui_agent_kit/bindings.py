"""The six paths a kit agent answers on, and the credential on each binding.

A path is one binding at one A2A version: JSON-RPC, HTTP+JSON and gRPC, each on A2A 1.0 and on
A2A 0.3. A kit agent answers all six. The publisher writes them on the app's config in the
order the card lists them, A2A 1.0's three first by default (a2uiverse task-20.9 decision 6).

On JSON-RPC and HTTP+JSON the credential rides as the HTTP header its scheme names. On gRPC it
rides as one metadata entry under that header's name in lowercase, and a name gRPC cannot carry
as a plain entry cannot ride (a2uiverse task-20.5 decision 9).
"""

from __future__ import annotations

import re
from collections.abc import Sequence
from typing import NamedTuple

from a2a.utils.constants import TransportProtocol

JSONRPC = TransportProtocol.JSONRPC.value
HTTP_JSON = TransportProtocol.HTTP_JSON.value
GRPC = TransportProtocol.GRPC.value
A2A_1_0 = "1.0"
A2A_0_3 = "0.3"


class Interface(NamedTuple):
    """One path: a binding at an A2A version."""

    binding: str
    version: str

    def __str__(self) -> str:
        return f"{self.binding} at A2A {self.version}"


DEFAULT_INTERFACES: tuple[Interface, ...] = tuple(
    Interface(binding, version)
    for version in (A2A_1_0, A2A_0_3)
    for binding in (JSONRPC, HTTP_JSON, GRPC)
)


def interface_order(interfaces: Sequence[Interface | tuple[str, str]]) -> tuple[Interface, ...]:
    """The six paths in the order the publisher wrote them.

    Raises on a list that repeats a path, names one the kit does not serve, or leaves one out.
    """
    order = tuple(Interface(*interface) for interface in interfaces)
    unknown = [interface for interface in order if interface not in DEFAULT_INTERFACES]
    if unknown:
        raise ValueError(
            f"interfaces names {', '.join(str(i) for i in unknown)}, which the kit does not "
            f"serve; it serves {', '.join(str(i) for i in DEFAULT_INTERFACES)}"
        )
    repeated = sorted({str(i) for i in order if order.count(i) > 1})
    if repeated:
        raise ValueError(f"interfaces names {', '.join(repeated)} more than once")
    missing = [interface for interface in DEFAULT_INTERFACES if interface not in order]
    if missing:
        raise ValueError(
            f"interfaces leaves out {', '.join(str(i) for i in missing)}: list all six paths "
            "in the order the card lists them"
        )
    return order


# A key gRPC carries as a plain metadata entry ("gRPC over HTTP2"): `0-9 a-z _ - .`, with
# `grpc-` reserved and `-bin` marking a binary value.
_PLAIN_GRPC_KEY = re.compile(r"^[0-9a-z_.-]+$")


def grpc_metadata_key(header: str) -> str | None:
    """The metadata key a credential sent in `header` rides under on gRPC; None when gRPC
    cannot carry it as a plain entry."""
    key = header.lower()
    if not _PLAIN_GRPC_KEY.match(key) or key.startswith("grpc-") or key.endswith("-bin"):
        return None
    return key
