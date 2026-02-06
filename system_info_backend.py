from flask import Flask, jsonify
from flask_cors import CORS
import psutil
import platform
import time

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return jsonify({
        "status": "ZedBee System Info Backend is running",
        "endpoints": {
            "system_info": "/system-info"
        }
    })

@app.route("/system-info")
def system_info():
    boot_time = psutil.boot_time()
    uptime = time.time() - boot_time
    mem = psutil.virtual_memory()
    net = psutil.net_io_counters()
    
    return jsonify({
        "os": platform.system(),
        "hostname": platform.node(),
        "cpu_percent": psutil.cpu_percent(interval=1),
        "ram_percent": mem.percent,
        "ram_total": round(mem.total / (1024**3), 2),
        "ram_used": round(mem.used / (1024**3), 2),
        "disk_percent": psutil.disk_usage('/').percent,
        "uptime_minutes": round(uptime / 60),
        "last_reboot": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(boot_time)),
        "net_sent": round(net.bytes_sent / (1024**2), 2),
        "net_recv": round(net.bytes_recv / (1024**2), 2)
    })

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
