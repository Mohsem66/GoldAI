import os
import sys
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

app = Flask(__name__)
CORS(app)

# Fallback simulation or native MT5
MT5_AVAILABLE = False
try:
    if sys.platform == "win32":
        import MetaTrader5 as mt5
        MT5_AVAILABLE = True
    else:
        print("MetaTrader5 is only supported natively on Windows. Enabling simulation fallback mode.")
except ImportError:
    print("MetaTrader5 python module not found. Enabling simulation fallback mode.")

# Global state
connected_to_mt5 = False
mt5_credentials = {
    "login": os.getenv("MT5_LOGIN", "123456"),
    "server": os.getenv("MT5_SERVER", "ICMarkets-Demo")
}

# In-memory mock trading state for non-Windows or disconnected development
mock_positions = []
mock_history = [
    {
        "ticket": 1289542,
        "symbol": "XAUUSD",
        "signal": "BUY",
        "volume": 0.1,
        "entry": 2045.50,
        "exit": 2052.10,
        "profit": 66.0,
        "time": "2026-08-08 14:32:10"
    },
    {
        "ticket": 1289543,
        "symbol": "EURUSD",
        "signal": "SELL",
        "volume": 0.2,
        "entry": 1.0854,
        "exit": 1.0822,
        "profit": 64.0,
        "time": "2026-08-08 15:45:00"
    }
]

def init_mt5():
    """Initializes and attempts to connect using standard native MT5 or simulation fallback."""
    global connected_to_mt5
    if MT5_AVAILABLE:
        try:
            if not mt5.initialize():
                print(f"MT5 initialization failed: {mt5.last_error()}")
                connected_to_mt5 = False
                return False

            # If default env login is provided, login immediately
            login_id = os.getenv("MT5_LOGIN")
            password = os.getenv("MT5_PASSWORD")
            server = os.getenv("MT5_SERVER", "ICMarkets-Demo")

            if login_id and password:
                login_success = mt5.login(int(login_id), password=password, server=server)
                if login_success:
                    print(f"Successfully connected natively to MT5 Server: {server} as {login_id}")
                    connected_to_mt5 = True
                    return True
                else:
                    print(f"MT5 Login failed natively: {mt5.last_error()}")

            connected_to_mt5 = True
            return True
        except Exception as e:
            print(f"Exception during native MT5 initialization: {e}")
            connected_to_mt5 = False
            return False
    else:
        # Simulation Mode
        print("Simulation Mode Active: MT5 mock connections initialized.")
        connected_to_mt5 = True
        return True

@app.route('/health', methods=['GET'])
@app.route('/api/mt5/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "connected": connected_to_mt5,
        "native_mt5_supported": MT5_AVAILABLE,
        "mode": "Native MT5" if MT5_AVAILABLE else "Simulation Fallback"
    })

@app.route('/connect', methods=['POST'])
@app.route('/api/mt5/connect', methods=['POST'])
def connect():
    global connected_to_mt5, mt5_credentials
    data = request.json or {}
    login = data.get("login")
    password = data.get("password")
    server = data.get("server", "ICMarkets-Demo")

    if not login or not password:
        return jsonify({"status": "failed", "message": "Login and password are required"}), 400

    mt5_credentials["login"] = login
    mt5_credentials["server"] = server

    if MT5_AVAILABLE:
        try:
            if not mt5.initialize():
                return jsonify({"status": "failed", "message": f"Initialization failed: {mt5.last_error()}"}), 500

            success = mt5.login(int(login), password=password, server=server)
            if success:
                connected_to_mt5 = True
                return jsonify({
                    "status": "connected",
                    "message": f"Successfully logged into MT5 Account {login} on {server}"
                })
            else:
                connected_to_mt5 = False
                return jsonify({
                    "status": "failed",
                    "message": f"Login failed: {mt5.last_error()}"
                }), 401
        except Exception as e:
            return jsonify({"status": "failed", "message": str(e)}), 500
    else:
        # Simulation Mock Login
        connected_to_mt5 = True
        return jsonify({
            "status": "connected",
            "message": f"[Simulation Mode] Successfully authenticated MT5 account {login} on {server}"
        })

@app.route('/account-info', methods=['GET'])
@app.route('/api/mt5/account-info', methods=['GET'])
def account_info():
    if not connected_to_mt5:
        return jsonify({"status": "unavailable", "message": "MT5 is not connected"}), 400

    if MT5_AVAILABLE:
        try:
            info = mt5.account_info()
            if info is not None:
                return jsonify({
                    "balance": info.balance,
                    "equity": info.equity,
                    "freeMargin": info.margin_free,
                    "margin": info.margin,
                    "profit": info.profit,
                    "currency": info.currency,
                    "status": "active"
                })
            else:
                return jsonify({"status": "failed", "message": f"Failed to fetch info: {mt5.last_error()}"}), 500
        except Exception as e:
            return jsonify({"status": "failed", "message": str(e)}), 500
    else:
        # Mock account info
        mock_equity = 10500.00
        for pos in mock_positions:
            mock_equity += pos.get("profit", 0)
        return jsonify({
            "balance": 10000.00,
            "equity": mock_equity,
            "freeMargin": mock_equity - 150.0,
            "margin": 150.0,
            "profit": mock_equity - 10000.00,
            "currency": "USD",
            "status": "active"
        })

@app.route('/current-price', methods=['GET'])
@app.route('/api/mt5/current-price', methods=['GET'])
def current_price():
    symbol = request.args.get("symbol", "XAUUSD")
    if MT5_AVAILABLE and connected_to_mt5:
        try:
            tick = mt5.symbol_info_tick(symbol)
            if tick is not None:
                return jsonify({
                    "price": tick.ask,
                    "bid": tick.bid,
                    "ask": tick.ask,
                    "spread": round(tick.ask - tick.bid, 2),
                    "status": "online"
                })
            else:
                return jsonify({"price": 2045.55, "bid": 2045.50, "ask": 2045.55, "spread": 0.05, "status": "simulated"})
        except Exception as e:
            return jsonify({"status": "failed", "message": str(e)}), 500
    else:
        # Mock price feed
        return jsonify({
            "price": 2045.55,
            "bid": 2045.50,
            "ask": 2045.55,
            "spread": 0.05,
            "status": "simulated"
        })

@app.route('/execute-trade', methods=['POST'])
@app.route('/open-trade', methods=['POST'])
@app.route('/api/mt5/open-trade', methods=['POST'])
def execute_trade():
    if not connected_to_mt5:
        return jsonify({"status": "unavailable", "message": "MT5 is not connected"}), 400

    data = request.json or {}
    signal = data.get("signal", "").upper()
    entry = data.get("entry")
    stop_loss = data.get("stopLoss") or data.get("sl")
    tp1 = data.get("tp1")
    tp2 = data.get("tp2")
    tp3 = data.get("tp3")
    volume = float(data.get("volume", 0.1))
    symbol = data.get("symbol", "XAUUSD").upper()

    # Normalize XAU/USD
    if "XAU" in symbol or "GOLD" in symbol:
        symbol = "XAUUSD"

    if signal not in ["BUY", "SELL"]:
        return jsonify({"status": "failed", "message": "Invalid signal type. Must be BUY or SELL."}), 400

    # Primary target for default MT5 execution
    tp = tp1 or tp2 or tp3

    if MT5_AVAILABLE:
        try:
            # Check price
            tick = mt5.symbol_info_tick(symbol)
            if tick is None:
                return jsonify({"status": "failed", "message": f"Symbol {symbol} not found on server"}), 400

            price = tick.ask if signal == "BUY" else tick.bid

            order_type = mt5.ORDER_TYPE_BUY if signal == "BUY" else mt5.ORDER_TYPE_SELL

            # Setup filling type based on market standard
            filling_type = mt5.ORDER_FILLING_IOC

            request_dict = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": symbol,
                "volume": volume,
                "type": order_type,
                "price": price,
                "sl": float(stop_loss) if stop_loss else 0.0,
                "tp": float(tp) if tp else 0.0,
                "deviation": 20,
                "magic": 234000,
                "comment": "GoldAI Signal Execution",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": filling_type,
            }

            result = mt5.order_send(request_dict)
            if result.retcode != mt5.TRADE_RETCODE_DONE:
                return jsonify({
                    "status": "failed",
                    "retcode": result.retcode,
                    "message": f"Order execution failed: {result.comment}"
                }), 500

            return jsonify({
                "status": "filled",
                "ticket": result.order,
                "price": result.price,
                "volume": result.volume,
                "message": f"Successfully executed native MT5 {signal} order for {symbol}",
                "details": {
                    "deal": result.deal,
                    "order": result.order,
                    "comment": result.comment
                }
            })

        except Exception as e:
            return jsonify({"status": "failed", "message": str(e)}), 500
    else:
        # Simulated trade fill
        ticket = int(time.time())
        mock_pos = {
            "ticket": ticket,
            "symbol": symbol,
            "signal": signal,
            "volume": volume,
            "entry": entry or 2045.50,
            "stopLoss": stop_loss,
            "tp1": tp1,
            "tp2": tp2,
            "tp3": tp3,
            "profit": 15.0 if signal == "BUY" else -15.0, # Dummy floating profit
            "time": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        mock_positions.append(mock_pos)
        return jsonify({
            "status": "filled",
            "ticket": ticket,
            "price": entry or 2045.50,
            "volume": volume,
            "message": f"[Simulation Mode] Order successfully simulated filled: {signal} {volume} lot {symbol} at {entry or 2045.50}",
            "details": mock_pos
        })

@app.route('/positions', methods=['GET'])
@app.route('/api/mt5/positions', methods=['GET'])
def positions():
    if not connected_to_mt5:
        return jsonify({"status": "unavailable", "message": "MT5 is not connected"}), 400

    if MT5_AVAILABLE:
        try:
            positions_data = mt5.positions_get()
            if positions_data is None:
                return jsonify({"positions": [], "count": 0})

            result = []
            for p in positions_data:
                result.append({
                    "ticket": p.ticket,
                    "symbol": p.symbol,
                    "signal": "BUY" if p.type == mt5.ORDER_TYPE_BUY else "SELL",
                    "volume": p.volume,
                    "entry": p.price_open,
                    "profit": p.profit,
                    "time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(p.time))
                })
            return jsonify({"positions": result, "count": len(result)})
        except Exception as e:
            return jsonify({"status": "failed", "message": str(e)}), 500
    else:
        return jsonify({"positions": mock_positions, "count": len(mock_positions)})

@app.route('/trades-history', methods=['GET'])
@app.route('/api/mt5/trades-history', methods=['GET'])
def trades_history():
    if not connected_to_mt5:
        return jsonify({"status": "unavailable", "message": "MT5 is not connected"}), 400

    if MT5_AVAILABLE:
        try:
            # Fetch history for the last 30 days
            from_date = time.time() - (30 * 24 * 3600)
            history_deals = mt5.history_deals_get(from_date, time.time())
            if history_deals is None:
                return jsonify({"trades": [], "count": 0})

            result = []
            for d in history_deals:
                # Filter deal entries only
                if d.entry == mt5.DEAL_ENTRY_IN:
                    continue
                result.append({
                    "ticket": d.ticket,
                    "symbol": d.symbol,
                    "signal": "BUY" if d.type == mt5.ORDER_TYPE_BUY else "SELL",
                    "volume": d.volume,
                    "entry": d.price,
                    "profit": d.profit,
                    "time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(d.time))
                })
            return jsonify({"trades": result, "count": len(result)})
        except Exception as e:
            return jsonify({"status": "failed", "message": str(e)}), 500
    else:
        return jsonify({"trades": mock_history, "count": len(mock_history)})

if __name__ == '__main__':
    print("--------------------------------------------------")
    print("🌟 Starting GoldAI MetaTrader 5 Python Connector")
    print("--------------------------------------------------")
    init_mt5()
    port = int(os.getenv("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
