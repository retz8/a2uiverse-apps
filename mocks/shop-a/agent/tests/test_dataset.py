"""The tier's dataset is coherent (task-4.6 decision 18).

A regression bed is only worth anything if the fixture under it is right. These pin the
two properties the whole phase leans on: the stores agree about product identity, and
they disagree about everything else — subset, values, and order — so a wiring's index
refs carry real information rather than being a straight zip.
"""

from __future__ import annotations

import json

import pytest

from app import dataset


@pytest.fixture(scope="module")
def raw() -> dict:
    return json.loads(dataset.DATASET_PATH.read_text(encoding="utf-8"))


def test_every_listed_id_is_a_known_product(raw):
    known = {p["id"] for p in raw["products"]}
    for store, entry in raw["stores"].items():
        listed = {row["id"] for row in entry["listing"]}
        assert listed <= known, f"{store} lists ids no product record defines"


def test_a_store_lists_each_camera_at_most_once(raw):
    for store, entry in raw["stores"].items():
        ids = [row["id"] for row in entry["listing"]]
        assert len(ids) == len(set(ids)), f"{store} lists a camera twice"


def test_three_cameras_are_shared_and_one_is_exclusive_to_each_store(raw):
    a = {row["id"] for row in raw["stores"]["shop-a"]["listing"]}
    b = {row["id"] for row in raw["stores"]["shop-b"]["listing"]}
    assert len(a & b) == 3
    assert len(a - b) == 1 and len(b - a) == 1


def test_the_shared_cameras_sit_at_different_indices_in_the_two_stores(raw):
    # Index refs would carry no information if the listings were a straight zip.
    index = {
        store: {row["id"]: i for i, row in enumerate(entry["listing"])}
        for store, entry in raw["stores"].items()
    }
    shared = set(index["shop-a"]) & set(index["shop-b"])
    assert any(index["shop-a"][cid] != index["shop-b"][cid] for cid in shared)


def test_no_store_is_already_in_one_of_its_sorted_orders(raw):
    # A reorder instrument that moved nothing would bump no generation.
    for store, entry in raw["stores"].items():
        order = [row["id"] for row in entry["listing"]]
        for key in dataset.SORT_KEYS:
            rows = sorted(entry["listing"], key=lambda r: r[key], reverse=key == "rating")
            assert order != [row["id"] for row in rows], f"{store} is already sorted by {key}"


def test_this_store_slices_itself_with_identity_joined_to_values(raw):
    items = dataset.catalogue()
    names = {p["id"]: p["name"] for p in raw["products"]}
    assert [row["id"] for row in items] == [
        row["id"] for row in raw["stores"][dataset.STORE_ID]["listing"]
    ]
    for item in items:
        assert set(item) == {"id", "name", "price", "rating"}
        assert item["name"] == names[item["id"]]
        assert isinstance(item["price"], (int, float))
        assert isinstance(item["rating"], (int, float))


def test_a_detail_adds_the_shared_blurb_and_an_unstocked_camera_has_none():
    stocked = dataset.catalogue()[0]["id"]
    assert dataset.detail(stocked)["blurb"]
    assert dataset.detail("no-such-camera") is None


def test_the_policy_is_this_store_s_own(raw):
    assert dataset.policy() == raw["stores"][dataset.STORE_ID]["policy"]


def test_sorting_orders_each_key_the_way_a_shopper_means_it():
    by_price = [row["price"] for row in dataset.sorted_catalogue("price")]
    by_rating = [row["rating"] for row in dataset.sorted_catalogue("rating")]
    assert by_price == sorted(by_price)
    assert by_rating == sorted(by_rating, reverse=True)
    with pytest.raises(ValueError):
        dataset.sorted_catalogue("colour")
