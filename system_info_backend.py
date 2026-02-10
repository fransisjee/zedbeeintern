from flask import Flask, jsonify
from flask_cors import CORS
import psutil
import platform
import time
import socket
import subprocess
import uuid

app = Flask(__name__)
CORS(app)

# ----------------------------
# ROOT CHECK (backend status)
# ----------------------------
# -------------------------------------------------
# ROOT CHECK
# -------------------------------------------------
@app.route("/")
def home():
    return jsonify({
        "status": "ZedBee System Info Backend is running",
        "endpoint": "/system-info"
    })


# -------------------------------------------------
# HELPERS
# -------------------------------------------------
def get_hostname():
    return socket.gethostname()


def get_os_info():
    """
    Proper OS name + version
    Works on Ubuntu, Armbian, minimal OS
    """
    try:
        os_info = platform.freedesktop_os_release()
        name = os_info.get("NAME", platform.system())
        version = os_info.get("VERSION", "")
        return f"{name} {version}".strip()
    except:
        return platform.platform()


def get_kernel():
    return platform.release()


def get_cpu_usage_top_style():
    """
    Same calculation as:
    top -bn1 | grep '^%Cpu' | awk '{print 100 - $8}'
    """
    cpu_times = psutil.cpu_times_percent(interval=1)
    return round(100 - cpu_times.idle, 1)

def get_cpu_model():
    model = "Unknown"
    try:
        with open("/proc/cpuinfo", "r") as f:
            for line in f:
                line = line.strip()
                if line.startswith("model name"):
                    model = line.split(":", 1)[1].strip()
                    break
                elif line.startswith("Hardware"):       # ARM / some embedded
                    model = line.split(":", 1)[1].strip()
                    break
                elif line.startswith("Processor"):      # some older ARM
                    model = line.split(":", 1)[1].strip()
                    break
    except Exception:
        pass
    return model

#def get_cpu_model():
#    cpu_model = "Unknown"
#    try:
  #      with open("/proc/cpuinfo", "r") as f:
 #           for line in f:
 #               if "model name" in line:
 #                   cpu_model = line.split(":", 1)[1].strip()
 #                 break
  #  except:
  #      pass
  #  return cpu_model


def get_ip_mac():
    ip_address = "N/A"
    mac_address = "N/A"

    interfaces = psutil.net_if_addrs()
    stats = psutil.net_if_stats()

    for iface, addrs in interfaces.items():
        if iface.lower() in ["lo", "lo0"]:
            continue
        if iface in stats and not stats[iface].isup:
            continue

        for addr in addrs:
            if addr.family == socket.AF_INET:
                ip_address = addr.address
            elif addr.family == psutil.AF_LINK:
                mac_address = addr.address

        if ip_address != "N/A":
            break

    return ip_address, mac_address


#ef get_uptime():
#   """
#   Returns uptime like: 74h 27m
#  """
#  boot_time = psutil.boot_time()
#   uptime_seconds = int(time.time() - boot_time)

#   hours = uptime_seconds // 3600
    
def get_uptime():
    """
    Returns uptime like: 74h 27m  and correct boot timestamp
    """
    try:
        # This is the reliable way on most Linux systems
        with open('/proc/uptime', 'r') as f:
            uptime_seconds_float = float(f.readline().split()[0])
        
        boot_time = time.time() - uptime_seconds_float
    except Exception as e:
        # Very rare fallback - but better than wrong value
        print("Warning: /proc/uptime failed:", e)
        boot_time = psutil.boot_time()  # last resort
    
    uptime_seconds = int(time.time() - boot_time)
    hours = uptime_seconds // 3600
    minutes = (uptime_seconds % 3600) // 60
    
    return f"{hours}h {minutes}m", boot_time
 
 #  minutes = (uptime_seconds % 3600) // 60

#   return f"{hours}h {minutes}m", boot_time


#rint("CPU % sent:", get_cpu_usage_top_style())
#rint("Uptime sent:", get_uptime())


# -------------------------------------------------
# SYSTEM INFO API
# -------------------------------------------------
@app.route("/system-info")
def system_info():
    #boot_time = psutil.boot_time()
    #uptime_sec = int(time.time() - boot_time)

    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()
     
    ip_address, mac_address = get_ip_mac()
    uptime_display, boot_time = get_uptime()

    print("Boot time calculated:", boot_time)
    print("Formatted last_reboot:", time.strftime(
        "%Y-%m-%d %H:%M:%S",
        time.localtime(boot_time)
    ))
    print("Uptime string sent:", uptime_display)

  


    return jsonify({

        # OS
        "os": get_os_info(),
        "kernel": get_kernel(),
        "architecture": platform.machine(),
        "hostname": get_hostname(),

        # CPU
        "cpu_usage_percent": get_cpu_usage_top_style(),
        "cpu_cores": psutil.cpu_count(logical=False),
        "cpu_threads": psutil.cpu_count(logical=True),
        "cpu_model": get_cpu_model(),


        # RAM
        "ram_total_gb": round(mem.total / (1024 ** 3), 2),
        "ram_used_gb": round(mem.used / (1024 ** 3), 2),
        "ram_percent": mem.percent,

        # DISK
        "disk_total_gb": round(disk.total / (1024 ** 3), 2),
        "disk_free_gb": round(disk.free / (1024 ** 3), 2),
        "disk_used_gb": round(disk.used / (1024 ** 3), 2),
        "disk_percent": disk.percent,

        # NETWORK
        "ip_address": ip_address,
        "mac_address": mac_address,
        "net_sent_mb": round(net.bytes_sent / (1024 ** 2), 2),
        "net_recv_mb": round(net.bytes_recv / (1024 ** 2), 2),

        # TIME
        "uptime_hours": uptime_display, #  round(uptime_sec / 3600, 1),
        "last_reboot": time.strftime(
            "%Y-%m-%d %H:%M:%S",
            time.localtime(boot_time)
        )
    })

# -------------------------------------------------
# RUN SERVER
# -------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


#@app.route("/")
#def home():
#    return jsonify({
#        "status": "ZedBee System Info Backend is running",
#        "endpoints": {
 #           "system_info": "/system-info"
 #       }
 #   })


# ----------------------------
# SYSTEM INFO API
# ----------------------------
#@app.route("/system-info")
#def system_info():

    # time info
 #   boot_time = psutil.boot_time()
 #   uptime = time.time() - boot_time

    # system usage
 #   mem = psutil.virtual_memory()
 #   disk = psutil.disk_usage('/')
 #   net = psutil.net_io_counters()

    # host info
 #   hostname = socket.gethostname()
    
    ####################################

    # OS info (proper ubuntu version)
 #   os_info = platform.freedesktop_os_release();
 #   os_name = os_info.get("NAME", "Linux");
 #   os_version = os_info.get("VERSION", "");

    # Cpu info
   
 #   cpu_cores = psutil.cpu_count(logical=False)
  #  cpu_threads = psutil.cpu_count(logical=True)

    # CPU model 
  #  cpu_model = "Unknown"
 #   try:
 #       with open("/proc/cpuinfo", "r") as f:
  #          for line in f:
 #               if "model name" in line:
 #                   cpu_model = line.split(":", 1)[1].strip()
 #                   break
 #   except:
  #      pass

    #########################
    
    # Get actual system network interface IP and MAC
 #   ip_address = "N/A"
 #   mac_address = "N/A"
    
 #   try:
 #       interfaces = psutil.net_if_addrs()
 #       for interface_name, addrs in interfaces.items():
            # Skip loopback
 #           if interface_name.lower() in ['lo', 'lo0']:
 #               continue
 #           for addr in addrs:
 #               if addr.family == socket.AF_INET:
 #                   ip_address = addr.address
 #                   break
 #           if ip_address != "N/A":
 #               break
        
 #       if_stats = psutil.net_if_stats()
 #       for interface_name, stats in if_stats.items():
 #           if interface_name.lower() in ['lo', 'lo0']:
 #               continue
#          if stats.isup:
#              try:
#                    mac = psutil.net_if_addrs().get(interface_name)
#                    for addr in psutil.net_if_addrs().get(interface_name, []):
 #                       if addr.family == psutil.AF_LINK:
 #                           mac_address = addr.address
 #                           break
 #               except:
 #                   pass
 #               if mac_address != "N/A":
 #                   break
 #   except:
 #       pass

 #   return jsonify({
        # OS INFO
        #"os": platform.system(),
        #"os_release": platform.release(),
        #"kernel": platform.version(),
        #"hostname": hostname,

        # CPU
        # "cpu_percent": psutil.cpu_percent(interval=1),
        
        # OS INFO
 #       "os": os_name,
#        "os_version": os_version,
 #       "kernel": platform.release(),
 #       "hostname": hostname,

        # CPU INFO
 #       "cpu_model": cpu_model,
  #      "cpu_usage_percent": cpu_usage,
 #       "cpu_cores": cpu_cores,
 #       "cpu_threads": cpu_threads,


        # RAM
  #      "ram_total_gb": round(mem.total / (1024**3), 2),
 #       "ram_used_gb": round(mem.used / (1024**3), 2),
#        "ram_percent": mem.percent,

        # DISK
  #      "disk_total_gb": round(disk.total / (1024**3), 2),
 #       "disk_used_gb": round(disk.used / (1024**3), 2),
  #      "disk_free_gb": round(disk.free / (1024**3), 2),
  #      "disk_percent": disk.percent,

        # NETWORK
 #       "ip_address": ip_address,
 #       "mac_address": mac_address,
 #       "net_sent_mb": round(net.bytes_sent / (1024**2), 2),
#        "net_recv_mb": round(net.bytes_recv / (1024**2), 2),

        # TIME
 #       "uptime_minutes": round(uptime / 60),
 #       "last_reboot": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(boot_time))
  #  })


# ----------------------------
# RUN SERVER
# ----------------------------
#if __name__ == "__main__":
#    app.run(host="0.0.0.0", port=5000, debug=True)
