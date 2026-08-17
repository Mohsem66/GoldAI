#!/usr/bin/env python3
"""GoldAI MT5 Bridge — Flask on :5001. DEMO only until validated."""

import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

MT5_LOGIN = os.getenv("MT5_LOGIN")
MT5_PASSWORD = os.getenv("MT5_PASSWORD")
MT5_SERVER = os.getenv("MT5_SERVER", "ICMarkets-Demo")
MT5_PATH = os.getenv("MT5_PATH") or None
PORT = int(os.getenv("BRIDGE_PORT", "5001"))

_mt5 = None
_connected = False


def try_import_mt5():
    global _mt5
    if _mt5 is not None:
        return _mt5
    try:
        import MetaTrader5 as mt5
        _mt5 = mt5
        return mt5
    except ImportError:
        return None


def ensure_connected():
    global _connected
    mt5 = try_import_mt5()
    if mt5 is None:
        return False, "MetaTrader5 package not installed (pip install MetaTrader5)"

    if _connected:
        info = mt5.terminal_info()
        if info is not None:
            return True, "already connected"

    init_kwargs = {}
    if MT5_PATH:
        init_kwargs["path"] = MT5_PATH
    if not mt5.initialize(**init_kwargs):
        return False, f"initialize failed: {mt5.last_error()}"

    if MT5_LOGIN and MT5_PASSWORD:
        authorized = mt5.login(int(MT5_LOGIN), password=MT5_PASSWORD, server=MT5_SERVER)
        if not authorized:
            err = mt5.last_error()
            mt5.shutdown()
            return False, f"login failed: {err}"

    _connected = True
    return True, "connected"


@app.get("/health")
def health():
    mt5 = try_import_mt5()
    if mt5 is None:
        return jsonify({
            "status": "degraded", "connected": False,
            "executionState": "DISCONNECTED",
            "message": "MetaTrader5 Python package missing"
        })
    ok, msg = ensure_connected()
    return jsonify({
        "status": "online" if ok else "degraded",
        "connected": ok,
        "executionState": "READY" if ok else "DISCONNECTED",
        "message": msg,
        "server": MT5_SERVER
    })


@app.get("/account-info")
def account_info():
    ok, msg = ensure_connected()
    if not ok:
        return jsonify({"balance": 0, "equity": 0, "freeMargin": 0, "status": "unavailable", "message": msg})
    mt5 = try_import_mt5()
    acc = mt5.account_info()
    if acc is None:
        return jsonify({"balance": 0, "equity": 0, "freeMargin": 0, "status": "unavailable"})
    return jsonify({
        "balance": acc.balance, "equity": acc.equity, "freeMargin": acc.margin_free,
        "currency": acc.currency, "leverage": acc.leverage, "status": "ok"
    })


@app.get("/current-price")
def current_price():
    symbol = request.args.get("symbol", "XAUUSD")
    ok, msg = ensure_connected()
    if not ok:
        return jsonify({"price": 0, "bid": 0, "ask": 0, "status": "unavailable", "message": msg})
    mt5 = try_import_mt5()
    candidates = [symbol, symbol.replace("/", ""), "XAUUSD", "GOLD"]
    tick = None
    used = symbol
    for s in candidates:
        tick = mt5.symbol_info_tick(s)
        if tick is not None:
            used = s
            break
    if tick is None:
        return jsonify({"price": 0, "status": "unavailable", "message": "symbol tick not found"})
    mid = (tick.bid + tick.ask) / 2
    return jsonify({
        "symbol": used, "price": mid, "bid": tick.bid, "ask": tick.ask,
        "spread": round(tick.ask - tick.bid, 5), "status": "ok"
    })


@app.get("/symbol-info")
def symbol_info():
    symbol = request.args.get("symbol", "XAUUSD")
    ok, msg = ensure_connected()
    if not ok:
        return jsonify({"status": "unavailable", "message": msg})
    mt5 = try_import_mt5()
    candidates = [symbol, symbol.replace("/", ""), "XAUUSD", "GOLD"]
    info = None
    used = symbol
    for s in candidates:
        info = mt5.symbol_info(s)
        if info is not None:
            used = s
            break
    if info is None:
        return jsonify({"status": "unavailable", "message": "symbol not found"})
    return jsonify({
        "status": "ok", "symbol": used, "digits": info.digits, "point": info.point,
        "trade_contract_size": info.trade_contract_size,
        "volume_min": info.volume_min, "volume_max": info.volume_max, "volume_step": info.volume_step,
        "trade_tick_value": info.trade_tick_value, "trade_tick_size": info.trade_tick_size,
        "currency_profit": info.currency_profit
    })


@app.post("/execute-trade")
def execute_trade():
    data = request.get_json(force=True, silent=True) or {}
    signal = (data.get("signal") or "").upper()
    volume = float(data.get("volume") or 0.01)
    sl = data.get("stopLoss") or data.get("sl")
    tp1 = data.get("tp1")
    symbol = (data.get("symbol") or "XAUUSD").replace("/", "")

    if "BUY" not in signal and "SELL" not in signal:
        return jsonify({"status": "ERROR", "message": "signal must be BUY or SELL"})

    ok, msg = ensure_connected()
    if not ok:
        return jsonify({"status": "DISCONNECTED", "message": msg})

    mt5 = try_import_mt5()
    info = mt5.symbol_info(symbol)
    if info is None:
        for s in ("XAUUSD", "GOLD"):
            info = mt5.symbol_info(s)
            if info:
                symbol = s
                break
    if info is None:
        return jsonify({"status": "ERROR", "message": f"symbol {symbol} not found in MT5"})

    if not info.visible:
        mt5.symbol_select(symbol, True)

    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        return jsonify({"status": "ERROR", "message": "no tick"})

    side_buy = "BUY" in signal
    order_type = mt5.ORDER_TYPE_BUY if side_buy else mt5.ORDER_TYPE_SELL
    price = tick.ask if side_buy else tick.bid

    volume = max(info.volume_min, min(volume, info.volume_max))
    step = info.volume_step or 0.01
    volume = round(round(volume / step) * step, 2)

    request_order = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": volume,
        "type": order_type,
        "price": price,
        "deviation": 20,
        "magic": 20250817,
        "comment": "GoldAI",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    if sl:
        request_order["sl"] = float(sl)
    if tp1:
        request_order["tp"] = float(tp1)

    result = mt5.order_send(request_order)
    if result is None:
        return jsonify({"status": "ERROR", "message": str(mt5.last_error())})

    if result.retcode != mt5.TRADE_RETCODE_DONE:
        return jsonify({"status": "ERROR", "retcode": result.retcode, "message": result.comment, "executionState": "ERROR"})

    return jsonify({
        "status": "FILLED", "executionState": "FILLED",
        "order": result.order, "volume": volume, "price": result.price, "symbol": symbol
    })


@app.get("/positions")
def positions():
    ok, msg = ensure_connected()
    if not ok:
        return jsonify({"positions": [], "count": 0, "status": "unavailable", "message": msg})
    mt5 = try_import_mt5()
    pos = mt5.positions_get()
    if pos is None:
        return jsonify({"positions": [], "count": 0, "status": "ok"})
    out = []
    for p in pos:
        out.append({
            "ticket": p.ticket, "symbol": p.symbol,
            "type": "BUY" if p.type == 0 else "SELL",
            "volume": p.volume, "price_open": p.price_open,
            "sl": p.sl, "tp": p.tp, "profit": p.profit
        })
    return jsonify({"positions": out, "count": len(out), "status": "ok"})


if __name__ == "__main__":
    print(f"GoldAI MT5 Bridge on http://0.0.0.0:{PORT}")
    print("Use DEMO account only until fully validated.")
    app.run(host="0.0.0.0", port=PORT, debug=False)
