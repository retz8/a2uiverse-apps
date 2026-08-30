"""A2A server wiring for the live LLM agent (single-version v0.9.1 card)."""

from __future__ import annotations

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2ui.a2a.extension import get_a2ui_agent_extension
from a2ui.schema.constants import VERSION_0_9_1
from starlette.middleware.cors import CORSMiddleware

from catalog_common import supported_catalog_ids

DEFAULT_PORT = 11002
CORS_ORIGIN_REGEX = r"^(http://localhost:\d+|https://[a-z0-9-]+\.[a-z]+\.devtunnels\.ms)$"


# The card is the router's retrieval corpus: it is embedded once at startup and ranked by
# similarity against the user's utterance, so it describes what this agent can be ASKED FOR,
# in the words someone would ask it in — not how it is built. A skill named for its
# implementation ("Live A2UI generator") is close to noise as an embedding target.
#
# The examples matter more than the descriptions. Each skill carries several, including
# paraphrases, and `inbox_triage` deliberately carries the cross-cutting "what needs my
# attention" phrasings: a request that fans out to several apps at once has to reach this one
# through its own vocabulary, or the fan-out silently drops it.
SKILLS = [
    AgentSkill(
        id="inbox_triage",
        name="Inbox triage",
        description=(
            "Finds the mail that needs the user: threads where someone is waiting on a reply, "
            "what arrived recently, what is still unread, what is worth their attention now."
        ),
        tags=["a2ui", "gmail", "email", "inbox", "triage"],
        examples=[
            "What needs my attention today?",
            "What's on my plate?",
            "Anything I need to deal with this morning?",
            "Show me the emails waiting on a reply",
            "What came in overnight?",
            "Do I have any unread mail from this week?",
        ],
    ),
    AgentSkill(
        id="thread_reading",
        name="Reading a conversation",
        description=(
            "Opens one email thread and shows the conversation: who wrote what, in order, "
            "with the latest message — the one that needs answering — in full."
        ),
        tags=["a2ui", "gmail", "email", "thread"],
        examples=[
            "Open the thread from my advisor",
            "What did they say about the budget?",
            "Show me that email about the schedule change",
            "Read me the last message in that conversation",
        ],
    ),
    AgentSkill(
        id="reply_drafting",
        name="Drafting a reply",
        description=(
            "Composes a reply to a thread and saves it as a draft for the user to review and "
            "send themselves. It can write and save a draft; it cannot send mail."
        ),
        tags=["a2ui", "gmail", "email", "draft", "compose"],
        examples=[
            "Draft a reply saying I can make Thursday",
            "Write back and say I'll have it by Friday",
            "Reply to that thanking them and asking for the file",
            "Draft a short answer declining the meeting",
        ],
    ),
    AgentSkill(
        id="labelling",
        name="Filing and labelling",
        description=(
            "Files mail: adds and removes labels, archives a thread out of the inbox, and "
            "shows what labels exist. It cannot delete anything."
        ),
        tags=["a2ui", "gmail", "email", "labels", "archive"],
        examples=[
            "Archive that thread",
            "Label this one as travel",
            "Take the receipts out of my inbox",
            "What labels do I have?",
        ],
    ),
]


def build_agent_card(base_url: str) -> AgentCard:
    # The v0.9.1 extension spec fixes the URI at .../a2ui/v0.9.1 — "the only URI
    # accepted for this extension" — distinct from the v0.9 wire version marker
    # carried inside A2UI messages.
    extension = get_a2ui_agent_extension(
        VERSION_0_9_1,
        accepts_inline_catalogs=False,
        supported_catalog_ids=supported_catalog_ids(),
    )
    capabilities = AgentCapabilities(streaming=True, extensions=[extension])
    return AgentCard(
        name="Gmail",
        description=(
            "Reads and acts on the user's Gmail mailbox: finds the threads that need them, "
            "opens a conversation, drafts a reply for them to send, and files mail with labels."
        ),
        url=base_url,
        version="0.1.0",
        default_input_modes=["text", "text/plain"],
        default_output_modes=["text", "text/plain"],
        capabilities=capabilities,
        skills=SKILLS,
    )


def build_app(host: str, port: int, base_url: str | None = None):
    # The agent card advertises `base_url` as its service endpoint; set it to a
    # tunnel/proxy URL when the client reaches the server through one. Imports of the
    # ADK-backed responder/executor are deferred here so `build_agent_card` stays
    # importable (and L0-testable) without constructing an LlmAgent.
    from llm_agent.executor import LlmAgentExecutor
    from llm_agent.responder import AdkLlmResponder

    base_url = base_url or f"http://{host}:{port}"
    handler = DefaultRequestHandler(
        agent_executor=LlmAgentExecutor(AdkLlmResponder()),
        task_store=InMemoryTaskStore(),
    )
    server = A2AStarletteApplication(
        agent_card=build_agent_card(base_url), http_handler=handler
    )
    app = server.build()
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=CORS_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app
