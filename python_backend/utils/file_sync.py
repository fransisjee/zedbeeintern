import json
import os
import pandas as pd
from sqlalchemy.orm import Session
import models

BASE_DIR = r"d:\anti\configurations database"

def sync_user_to_files(user, db: Session):
    try:
        user_dir = os.path.join(BASE_DIR, user.username)
        os.makedirs(user_dir, exist_ok=True)

        # 1. auth.xlsx (Vertical) [username, password_hash]
        pd.DataFrame([user.username, user.password]).to_excel(
            os.path.join(user_dir, "auth.xlsx"), index=False, header=False
        )

        # Fetch Config
        config_obj = db.query(models.Configuration).filter(models.Configuration.user_id == user.id).first()
        config_data = {}
        if config_obj and config_obj.data:
            try:
                config_data = json.loads(config_obj.data)
            except:
                pass

        # 2. device.xlsx (Vertical) [type, manufacturer]
        device = config_data.get("device", {})
        pd.DataFrame([device.get("type", ""), device.get("manufacturer", "")]).to_excel(
            os.path.join(user_dir, "device.xlsx"), index=False, header=False
        )

        # 3. protocol.xlsx [mode, ...table_rows] - Keeping Horizontal for table structure
        protocol = config_data.get("protocol", {})
        mode = protocol.get("mode", "rtu")
        rows = []
        if mode == "rtu":
            rtu_rows = protocol.get("rtuRows", [])
            for r in rtu_rows:
                rows.append([mode, r.get("slaveId"), r.get("baud"), r.get("parity"), r.get("dataBits"), r.get("stopBits"), r.get("funcCode"), r.get("slaveAddr"), r.get("quantity")])
        else:
            tcp_rows = protocol.get("tcpRows", [])
            for r in tcp_rows:
                rows.append([mode, r.get("ip"), r.get("port"), r.get("gateway"), r.get("funcCode"), r.get("slaveId"), r.get("slaveAddr"), r.get("quantity")])
        
        if not rows:
            rows = [[mode]]
        pd.DataFrame(rows).to_excel(
            os.path.join(user_dir, "protocol.xlsx"), index=False, header=False
        )

        # 4. connections.xlsx (Vertical)
        conn = config_data.get("connections", {})
        wifi = conn.get("wifi", {})
        mqtt = conn.get("mqtt", {})
        mqtt_broker = mqtt.get("broker", {})
        mqtt_topics = mqtt.get("topics", {})
        
        conn_rows = [
            conn.get("activeTab", ""),
            wifi.get("ssid", ""),
            wifi.get("password", ""),
            mqtt.get("platform", ""),
            mqtt_broker.get("url", ""),
            mqtt_broker.get("user", ""),
            mqtt_broker.get("pass", ""),
            mqtt.get("deviceId", ""),
            mqtt_topics.get("pub", ""),
            mqtt_topics.get("sub", ""),
            mqtt_topics.get("ack", "")
        ]
        pd.DataFrame(conn_rows).to_excel(
            os.path.join(user_dir, "connections.xlsx"), index=False, header=False
        )

        # 5. settings.xlsx [status]
        pd.DataFrame(["No additional settings"]).to_excel(
            os.path.join(user_dir, "settings.xlsx"), index=False, header=False
        )

        print(f"Synced vertical files for user: {user.username}")

    except Exception as e:
        print(f"Error syncing user {user.username} to files: {e}")
