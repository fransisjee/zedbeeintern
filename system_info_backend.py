from flask import Flask, jsonify
from flask_cors import CORS
import psutil
import platform
import time
import socket

app = Flask(__name__)
CORS(app)


# ---------------------------------------
# Helper: Get Active Network Info
# ---------------------------------------
def get_network_info():
    ip_address = "N/A"
    mac_address = "N/A"
    try:
        interfaces = psutil.net_if_addrs()
        stats = psutil.net_if_stats()

        for interface_name, addrs in interfaces.items():
            name_l = interface_name.lower()
            # Skip loopback and common virtual adapters
            if name_l.startswith("lo") or "virtual" in name_l or "docker" in name_l or name_l.startswith("veth") or "vm" in name_l:
                continue

            # Skip interfaces that are down
            if interface_name in stats and not stats[interface_name].isup:
                continue

            for addr in addrs:
                fam = getattr(addr, 'family', None)
                # IPv4 address
                if fam == socket.AF_INET:
                    if addr.address and not addr.address.startswith("127.") and not addr.address.startswith("169.254."):
                        ip_address = addr.address

                # MAC address - handle platform differences
                if fam == getattr(psutil, 'AF_LINK', None) or fam == getattr(socket, 'AF_PACKET', None) or fam == -1:
                    if addr.address and len(addr.address.strip()) > 0:
                        mac = addr.address.replace('-', ':').lower()
                        if mac != "00:00:00:00:00:00":
                            mac_address = mac

            # If we have both IP and MAC from the same interface, stop
            if ip_address != "N/A" and mac_address != "N/A":
                break
    except Exception:
        pass

    # Fallback: if MAC still not found, use uuid.getnode()
    if mac_address == "N/A":
        try:
            import uuid as _uuid
            node = _uuid.getnode()
            mac_address = ':'.join(['{:02x}'.format((node >> ele) & 0xff) for ele in range(0, 8 * 6, 8)][::-1])
        except Exception:
            pass

    return ip_address, mac_address


# ---------------------------------------
# Root Endpoint
# ---------------------------------------
@app.route("/")
def home():
    return jsonify({
        "status": "ZedBee System Info Backend is running",
        "endpoints": {
            "system_info": "/system-info"
        }
    })


# ---------------------------------------
# System Info Endpoint
# ---------------------------------------
@app.route("/system-info")
def system_info():
    boot_time = psutil.boot_time()
    uptime = time.time() - boot_time

    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    net = psutil.net_io_counters()

    ip_address, mac_address = get_network_info()

    return jsonify({
        # OS INFO
        "os": platform.system(),
        "os_release": platform.release(),
        "kernel": platform.version(),
        "hostname": socket.gethostname(),

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
        "last_reboot": time.strftime(
            '%Y-%m-%d %H:%M:%S',
            time.localtime(boot_time)
        )
    })


# ---------------------------------------
# Run Server
# ---------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
