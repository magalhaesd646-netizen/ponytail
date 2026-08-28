"""Real-time sports betting arbitrage detector.

Fetches moneyline (h2h) odds from The Odds API (https://the-odds-api.com/)
across multiple bookmakers and flags events where the best available price
on every outcome guarantees a profit regardless of the result ("arbitrage"
or "surebet").

This tool is read-only: it never logs into a betting account and never
places a bet. It only compares publicly available odds and does the math.
"""

import time

import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

ODDS_API_BASE = "https://api.the-odds-api.com/v4"


def compute_arbitrage(event, market_key="h2h"):
    """Find the best price per outcome for one event and check whether
    combining them across bookmakers guarantees a profit.

    Only h2h (moneyline / match winner) markets are supported: unlike
    totals/spreads, outcome names are directly comparable across
    bookmakers without needing to match a line/point value.
    """
    best_by_outcome = {}  # outcome_name -> (best_price, bookmaker_title)

    for bookmaker in event.get("bookmakers", []):
        for market in bookmaker.get("markets", []):
            if market["key"] != market_key:
                continue
            for outcome in market["outcomes"]:
                name = outcome["name"]
                price = outcome["price"]
                current = best_by_outcome.get(name)
                if current is None or price > current[0]:
                    best_by_outcome[name] = (price, bookmaker["title"])

    # Need every outcome of the market covered (e.g. home+away, or
    # home+draw+away) to actually be able to hedge the full event.
    outcome_count = {len(m["outcomes"]) for b in event.get("bookmakers", [])
                      for m in b.get("markets", []) if m["key"] == market_key}
    if not outcome_count or len(best_by_outcome) < max(outcome_count):
        return None

    implied_sum = sum(1 / price for price, _ in best_by_outcome.values())
    if implied_sum >= 1:
        return None  # no arbitrage: books' margin still exceeds the edge

    profit_pct = (1 / implied_sum - 1) * 100
    legs = [
        {
            "outcome": name,
            "bookmaker": bookmaker,
            "odds": price,
            "stake_share": (1 / price) / implied_sum,
        }
        for name, (price, bookmaker) in best_by_outcome.items()
    ]

    return {
        "event_id": event["id"],
        "sport": event["sport_key"],
        "commence_time": event["commence_time"],
        "home_team": event["home_team"],
        "away_team": event["away_team"],
        "profit_pct": round(profit_pct, 3),
        "implied_sum": round(implied_sum, 5),
        "legs": legs,
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/sports")
def list_sports():
    api_key = request.args.get("apiKey")
    if not api_key:
        return jsonify({"error": "apiKey é obrigatório"}), 400

    resp = requests.get(
        f"{ODDS_API_BASE}/sports", params={"apiKey": api_key}, timeout=10
    )
    if resp.status_code != 200:
        return jsonify({"error": resp.text}), resp.status_code
    return jsonify(resp.json())


@app.route("/api/arbitrage")
def arbitrage():
    api_key = request.args.get("apiKey")
    sport = request.args.get("sport", "upcoming")
    regions = request.args.get("regions", "us,uk,eu")
    min_profit = float(request.args.get("minProfit", 0))
    total_stake = float(request.args.get("stake", 100))

    if not api_key:
        return jsonify({"error": "apiKey é obrigatório"}), 400

    resp = requests.get(
        f"{ODDS_API_BASE}/sports/{sport}/odds",
        params={
            "apiKey": api_key,
            "regions": regions,
            "markets": "h2h",
            "oddsFormat": "decimal",
        },
        timeout=15,
    )
    if resp.status_code != 200:
        return jsonify({"error": resp.text}), resp.status_code

    events = resp.json()
    opportunities = []
    for event in events:
        arb = compute_arbitrage(event)
        if arb and arb["profit_pct"] >= min_profit:
            for leg in arb["legs"]:
                leg["stake"] = round(leg["stake_share"] * total_stake, 2)
            arb["total_stake"] = total_stake
            arb["guaranteed_return"] = round(total_stake / arb["implied_sum"], 2)
            opportunities.append(arb)

    opportunities.sort(key=lambda o: o["profit_pct"], reverse=True)

    return jsonify(
        {
            "checked_at": time.time(),
            "requests_remaining": resp.headers.get("x-requests-remaining"),
            "requests_used": resp.headers.get("x-requests-used"),
            "events_checked": len(events),
            "opportunities": opportunities,
        }
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)
