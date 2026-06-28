"""Google Maps helpers for the public booking page.

Two jobs:
  1. resolve_embed_q()  — turn a doctor's Google Maps share link
     (https://maps.app.goo.gl/...) into an `q=` value (lat,lng or place name)
     usable in the keyless `output=embed` map iframe. The browser can't follow
     that redirect itself (CORS), so we do it server-side.
  2. fetch_reviews()    — if GOOGLE_PLACES_API_KEY is configured, pull the
     place rating + a few reviews via the Places API. No key → no reviews.

Results are cached in-memory per link (Google calls are slow / rate-limited).
No new dependencies — uses urllib like core/email.py.
"""
import json
import re
import threading
import time
import urllib.parse
import urllib.request
import urllib.error

from app.core.config import settings

_UA = "Ophtech/1.0 (+https://Ophtech.fr)"
_CACHE_TTL = 6 * 3600  # 6 hours
_cache: dict[str, dict] = {}
_cache_lock = threading.Lock()

_COORDS_RE = re.compile(r"@(-?\d+\.\d+),(-?\d+\.\d+)")
_PLACE_RE = re.compile(r"/place/([^/@]+)")


def _http_get(url: str, timeout: int = 8):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": _UA, "Accept-Language": "fr,en;q=0.8"},
        method="GET",
    )
    return urllib.request.urlopen(req, timeout=timeout)


def _resolve_link(maps_url: str) -> dict:
    """Follow the share link and extract {embed_q, place_name} best-effort."""
    out: dict = {"embed_q": None, "place_name": None}
    try:
        with _http_get(maps_url) as resp:
            final_url = resp.geturl()
    except Exception:
        return out

    decoded = urllib.parse.unquote(final_url)

    coords = _COORDS_RE.search(decoded)
    if coords:
        out["embed_q"] = f"{coords.group(1)},{coords.group(2)}"

    place = _PLACE_RE.search(decoded)
    if place:
        name = place.group(1).replace("+", " ").strip()
        out["place_name"] = name
        if not out["embed_q"]:
            out["embed_q"] = name

    return out


def _fetch_reviews(name_hint: str | None, embed_q: str | None) -> dict:
    """Places API: rating + up to 5 reviews. Empty dict if no key / not found."""
    key = settings.GOOGLE_PLACES_API_KEY
    if not key or not (name_hint or embed_q):
        return {}

    # 1) Resolve a place_id from the place name (biased to coordinates if we have them).
    params = {
        "input": name_hint or embed_q,
        "inputtype": "textquery",
        "fields": "place_id",
        "key": key,
    }
    if embed_q and "," in embed_q:
        params["locationbias"] = f"point:{embed_q}"
    find_url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?" + urllib.parse.urlencode(params)
    try:
        with _http_get(find_url) as resp:
            find = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return {}

    candidates = find.get("candidates") or []
    if not candidates:
        return {}
    place_id = candidates[0].get("place_id")
    if not place_id:
        return {}

    # 2) Place details → rating + reviews.
    det_params = {
        "place_id": place_id,
        "fields": "rating,user_ratings_total,reviews,url",
        "language": "fr",
        "reviews_sort": "newest",
        "key": key,
    }
    det_url = "https://maps.googleapis.com/maps/api/place/details/json?" + urllib.parse.urlencode(det_params)
    try:
        with _http_get(det_url) as resp:
            det = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return {}

    result = det.get("result") or {}
    reviews = [
        {
            "author_name": r.get("author_name"),
            "rating": r.get("rating"),
            "text": r.get("text"),
            "relative_time": r.get("relative_time_description"),
            "profile_photo_url": r.get("profile_photo_url"),
        }
        for r in (result.get("reviews") or [])
    ][:5]

    return {
        "rating": result.get("rating"),
        "total": result.get("user_ratings_total"),
        "reviews": reviews,
        "place_url": result.get("url"),
    }


def get_place_info(maps_url: str | None, adresse: str | None, name_hint: str | None) -> dict:
    """Public entry point. Returns embed_q (for the map iframe) + reviews data.

    Falls back to the cabinet address for the map when there is no usable link.
    """
    cache_key = maps_url or f"addr::{adresse}"
    now = time.time()
    with _cache_lock:
        hit = _cache.get(cache_key)
        if hit and now - hit["_ts"] < _CACHE_TTL:
            return hit["data"]

    embed_q = None
    place_name = name_hint
    if maps_url:
        resolved = _resolve_link(maps_url)
        embed_q = resolved["embed_q"]
        place_name = resolved["place_name"] or name_hint

    if not embed_q and adresse:
        embed_q = adresse

    reviews_data = _fetch_reviews(place_name, embed_q) if maps_url else {}

    data = {
        "embed_q": embed_q,
        "maps_url": maps_url,
        "rating": reviews_data.get("rating"),
        "total": reviews_data.get("total"),
        "reviews": reviews_data.get("reviews", []),
    }

    with _cache_lock:
        _cache[cache_key] = {"_ts": now, "data": data}
    return data
