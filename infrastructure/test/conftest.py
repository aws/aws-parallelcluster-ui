"""Pytest fixtures for parallelcluster-ui cloud-radar tests.

Background:
  cloud-radar does not yet process the AWS::LanguageExtensions transform
  (specifically Fn::ForEach::*). Support is proposed in
  https://github.com/DontShaveTheYak/cloud-radar/pull/646 but not yet merged.

  To keep the test code self-contained, we ported here the minimal ForEach
  expansion logic. Once the support for the ForEach expression will be released
  in cloud-radar, then we can remove this logic.
"""

import copy
import re
from pathlib import Path
from typing import Any, List, Tuple

import pytest
import yaml

from cloud_radar.cf.unit import Template


# ---------------------------------------------------------------------------
# Fn::ForEach expansion (ported from cloud-radar PR #646).
# Only the pieces needed to pre-expand a self-contained template are included.
# ---------------------------------------------------------------------------

Replacement = Tuple[str, Any, str]


def _alnum(value: Any) -> str:
    return re.sub(r"[^a-zA-Z0-9]", "", str(value))


def _apply_str(value: str, replacement: Replacement) -> str:
    ident, val, alnum = replacement
    return value.replace(f"${{{ident}}}", str(val)).replace(f"&{{{ident}}}", alnum)


def _substitute(obj: Any, replacements: List[Replacement]) -> Any:
    if not replacements:
        return obj

    repl = replacements[0]
    rest = replacements[1:]
    ident, val, _ = repl

    if isinstance(obj, str):
        return _substitute(_apply_str(obj, repl), rest)

    if isinstance(obj, dict):
        if len(obj) == 1 and "Ref" in obj and obj["Ref"] == ident:
            return _substitute(val, rest)

        if len(obj) == 1 and "Fn::Sub" in obj:
            sub_val = obj["Fn::Sub"]
            if isinstance(sub_val, str):
                return _substitute({"Fn::Sub": _apply_str(sub_val, repl)}, rest)
            if isinstance(sub_val, list) and len(sub_val) == 2:
                tmpl_str, variables = sub_val
                if isinstance(tmpl_str, str):
                    tmpl_str = _apply_str(tmpl_str, repl)
                if isinstance(variables, dict):
                    variables = _substitute(variables, [repl])
                return _substitute({"Fn::Sub": [tmpl_str, variables]}, rest)

        if len(obj) == 1 and "Fn::GetAtt" in obj:
            ga = obj["Fn::GetAtt"]
            if isinstance(ga, list) and len(ga) == 2:
                resource_name = _substitute(ga[0], [repl])
                attr = ga[1]
                attr = val if attr == ident else _substitute(attr, [repl])
                return _substitute({"Fn::GetAtt": [resource_name, attr]}, rest)

        result = {}
        for k, v in obj.items():
            if isinstance(k, str) and k.startswith("Fn::ForEach::"):
                if isinstance(v, list) and len(v) == 3:
                    result[k] = _substitute(v, [repl])
                else:
                    result[k] = v
            else:
                result[_substitute(k, [repl])] = _substitute(v, [repl])
        return _substitute(result, rest)

    if isinstance(obj, list):
        return _substitute([_substitute(item, [repl]) for item in obj], rest)

    return _substitute(obj, rest)


def _expand_entry(key: str, value: Any) -> dict:
    if not (isinstance(value, list) and len(value) == 3):
        raise ValueError(f"Invalid Fn::ForEach structure for {key}")

    ident, collection, output_tmpl = value

    if not isinstance(ident, str):
        raise TypeError(f"Fn::ForEach identifier must be a String in {key}")

    if not isinstance(output_tmpl, dict):
        raise TypeError(f"Fn::ForEach output template must be a Dict in {key}")

    items = collection if isinstance(collection, list) else list(collection.values())

    result = {}
    for item in items:
        replacement = (ident, item, _alnum(item))
        substituted = _substitute(copy.deepcopy(output_tmpl), [replacement])
        substituted = _apply_foreach(substituted)
        if isinstance(substituted, dict):
            result.update(substituted)
    return result


def _apply_foreach(data: Any) -> Any:
    if isinstance(data, dict):
        out = {}
        for k, v in data.items():
            if isinstance(k, str) and k.startswith("Fn::ForEach::"):
                out.update(_expand_entry(k, v))
            else:
                out[k] = _apply_foreach(v)
        return out
    if isinstance(data, list):
        return [_apply_foreach(item) for item in data]
    return data


# ---------------------------------------------------------------------------
# Fixture
# ---------------------------------------------------------------------------

@pytest.fixture
def template():
    template_path = Path(__file__).parent.parent / "parallelcluster-ui.yaml"

    t = Template.from_yaml(template_path.resolve(), {})

    # Pre-expand Fn::ForEach so cloud-radar can render the template.
    t.template = _apply_foreach(t.template)

    # cloud-radar's default !Ref on a resource returns the logical name string.
    # The template does !Select [2|3, !Split ['/', !Ref EcrImage]], which in
    # real CFN receives an ImageBuilder image ARN of the form
    # "arn:...:image/recipe-name/version/build". Provide a fake value with
    # enough slashes via the Cloud-Radar Metadata override.
    ecr_image = t.template.get("Resources", {}).get("EcrImage")
    if ecr_image is not None:
        ecr_image.setdefault("Metadata", {}).setdefault("Cloud-Radar", {})[
            "ref"
        ] = "arn:aws:imagebuilder:us-east-1:123456789012:image/test-recipe/1.0.0/1"

    # render() reloads self.template from self.raw, so keep them in sync.
    t.raw = yaml.dump(t.template)

    return t
