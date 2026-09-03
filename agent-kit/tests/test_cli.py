"""CLI shape: the --mode flag, config-derived defaults, importability of beats."""

from click.testing import CliRunner

from a2ui_agent_kit.cli import build_command


def test_help_names_the_three_modes(basic_config):
    result = CliRunner().invoke(build_command(basic_config), ["--help"])
    assert result.exit_code == 0
    for mode in ("deterministic", "stub", "live"):
        assert mode in result.output


def test_port_defaults_to_the_config_port(basic_config):
    result = CliRunner().invoke(build_command(basic_config), ["--help"])
    assert str(basic_config.default_port) in result.output


def test_an_unknown_mode_is_rejected_at_parse_time(basic_config):
    result = CliRunner().invoke(build_command(basic_config), ["--mode", "llm"])
    assert result.exit_code != 0
    assert "Invalid value" in result.output


def test_beats_module_imports():
    from a2ui_agent_kit import beats

    assert beats.Turn(1, "s", "t", "p").beat == 1
