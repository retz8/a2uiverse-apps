"""L0 config tests: the per-vendor dataclass is frozen and its defaults hold."""

import dataclasses
from pathlib import Path

import pytest
from a2a.types import AgentSkill

from a2ui_agent_kit.bindings import (
    DEFAULT_INTERFACES,
    GRPC,
    HTTP_JSON,
    JSONRPC,
    Interface,
    grpc_metadata_key,
)
from a2ui_agent_kit.config import DEFAULT_MODEL, AgentAppConfig
from a2ui_agent_kit.sign_in import ApiKeySignIn, FakeAccount

from .conftest import make_config


def _minimal_config(tmp_path: Path) -> AgentAppConfig:
    return AgentAppConfig(
        name="Test Agent",
        description="A test agent.",
        version="0.1.0",
        skills=[AgentSkill(id="s1", name="skill", description="d", tags=["t"])],
        default_port=19999,
        default_grpc_port=19998,
        responder_app_name="a2ui_test_live",
        adk_agent_name="a2ui_test_live_agent",
        app_dir=tmp_path,
        catalog_path=tmp_path / "catalog.json",
        catalog_kind="basic",
        examples_dir=tmp_path / "examples",
        role_description="role",
        workflow_descriptions=("workflow", "shell", "scope"),
        examples_framing="framing",
        brand_guidance_path=tmp_path / "brand.md",
        domain_knowledge_path=tmp_path / "domain.md",
        build_response=lambda action, surface_id: [],
        build_text_response=lambda prompt, surface_id: [],
        question_policy=lambda payload, metas: None,
    )


def test_config_is_frozen(tmp_path):
    config = _minimal_config(tmp_path)
    with pytest.raises(dataclasses.FrozenInstanceError):
        config.default_port = 1  # type: ignore[misc]


def test_llm_mode_fields_default_off(tmp_path):
    config = _minimal_config(tmp_path)
    assert config.stub_tools == ()
    assert config.live_toolset_factory is None
    assert config.after_tool is None
    assert config.model is None


def test_default_model_is_the_kit_constant():
    assert DEFAULT_MODEL == "gemini-3.8-flash"


# ---- the six paths, the credential on gRPC, the account's card (a2uiverse task-20.9) ----



def test_the_default_list_is_a2a_1_0_s_three_then_a2a_0_3_s():
    assert DEFAULT_INTERFACES == (
        Interface(JSONRPC, "1.0"),
        Interface(HTTP_JSON, "1.0"),
        Interface(GRPC, "1.0"),
        Interface(JSONRPC, "0.3"),
        Interface(HTTP_JSON, "0.3"),
        Interface(GRPC, "0.3"),
    )


def test_the_publisher_s_order_is_held(tmp_path):
    order = [("GRPC", "0.3"), *[tuple(i) for i in DEFAULT_INTERFACES if i != ("GRPC", "0.3")]]
    config = make_config("basic", tmp_path, interfaces=order)
    assert [tuple(i) for i in config.interfaces] == order


def test_a_list_repeating_a_path_stops_the_app(tmp_path):
    with pytest.raises(ValueError, match="GRPC at A2A 1.0 more than once"):
        make_config("basic", tmp_path, interfaces=[*DEFAULT_INTERFACES, ("GRPC", "1.0")])


def test_a_list_naming_a_path_the_kit_does_not_serve_stops_the_app(tmp_path):
    with pytest.raises(ValueError, match="ACME-RPC at A2A 1.0, which the kit does not serve"):
        make_config("basic", tmp_path, interfaces=[*DEFAULT_INTERFACES, ("ACME-RPC", "1.0")])


def test_a_list_leaving_a_path_out_stops_the_app(tmp_path):
    with pytest.raises(ValueError, match="leaves out HTTP\\+JSON at A2A 0.3"):
        make_config(
            "basic", tmp_path, interfaces=[i for i in DEFAULT_INTERFACES if i != ("HTTP+JSON", "0.3")]
        )


def test_the_grpc_port_is_required(tmp_path):
    fields = {f.name for f in dataclasses.fields(AgentAppConfig) if f.default is dataclasses.MISSING}
    assert "default_grpc_port" in fields


@pytest.mark.parametrize(
    ("header", "key"),
    [("X-Shop-Key", "x-shop-key"), ("Authorization", "authorization"), ("x_key.v2", "x_key.v2")],
)
def test_a_header_rides_on_grpc_under_its_name_in_lowercase(header, key):
    assert grpc_metadata_key(header) == key


@pytest.mark.parametrize("header", ["Grpc-Key", "X-Key-Bin", "X Key", "X:Key", "Ключ"])
def test_a_key_header_grpc_cannot_carry_stops_the_app_naming_it(tmp_path, header):
    keys = ApiKeySignIn(header=header, description="d", keys={"k": FakeAccount("a", {})})
    with pytest.raises(ValueError, match=f"{header!r} cannot ride on gRPC"):
        make_config("basic", tmp_path, sign_in=keys)


def test_an_account_s_skills_with_no_sign_in_stop_the_app(tmp_path):
    with pytest.raises(ValueError, match="has no sign-in"):
        make_config("basic", tmp_path, account_skills=lambda account: [])


def test_signing_and_the_extended_card_are_off_by_default(tmp_path):
    config = make_config("basic", tmp_path)
    assert config.sign_card is False
    assert config.account_skills is None
