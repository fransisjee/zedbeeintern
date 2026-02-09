from flask import Flask, jsonify
from flask_cors import CORS
import psutil
import platform
import time
import socket
import uuid

app = Flask(__name__)
CORS(app)

# ----------------------------
# ROOT CHECK (backend status)
# ----------------------------
@app.route("/")
def home():
    return jsonify({
        "status": "ZedBee System Info Backend is running",
        "endpoints": {
            "system_info": "/system-info"
        }
    })


# ----------------------------
# SYSTEM INFO API
# ----------------------------
@app.route("/system-info")
def system_info():
    boot_time = psutil.boot_time()
    uptime = time.time() - boot_time

    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    net = psutil.net_io_counters()

    hostname = socket.gethostname()
    
    # Get actual system network interface IP and MAC
    ip_address = "N/A"
    mac_address = "N/A"
    
    try:
        interfaces = psutil.net_if_addrs()
        for interface_name, addrs in interfaces.items():
            # Skip loopback
            if interface_name.lower() in ['lo', 'lo0']:
                continue
            for addr in addrs:
                if addr.family == socket.AF_INET:
                    ip_address = addr.address
                    break
            if ip_address != "N/A":
                break
        
        if_stats = psutil.net_if_stats()
        for interface_name, stats in if_stats.items():
            if interface_name.lower() in ['lo', 'lo0']:
                continue
            if stats.isup:
                try:
                    mac = psutil.net_if_addrs().get(interface_name)
                    for addr in psutil.net_if_addrs().get(interface_name, []):
                        if addr.family == psutil.AF_LINK:
                            mac_address = addr.address
                            break
                except:
                    pass
                if mac_address != "N/A":
                    break
    except:
        pass

    return jsonify({
        # OS INFO
        "os": platform.system(),
        "os_release": platform.release(),
        "kernel": platform.version(),
        "hostname": hostname,

        # CPU
        "cpu_percent": psutil.cpu_percent(interval=1),

        # RAM
        "ram_total_gb": round(mem.total / (1024**3), 2),
        "ram_used_gb": round(mem.used / (1024**3), 2),
        "ram_percent": mem.percent,

        # DISK
        "disk_total_gb": round(disk.total / (1024**3), 2),
        "disk_used_gb": round(disk.used / (1024**3), 2),
        "disk_free_gb": round(disk.free / (1024**3), 2),
        "disk_percent": disk.percent,

        # NETWORK
        "ip_address": ip_address,
        "mac_address": mac_address,
        "net_sent_mb": round(net.bytes_sent / (1024**2), 2),
        "net_recv_mb": round(net.bytes_recv / (1024**2), 2),

        # TIME
        "uptime_minutes": round(uptime / 60),
        "last_reboot": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(boot_time))
    })


# ----------------------------
# RUN SERVER
# ----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
