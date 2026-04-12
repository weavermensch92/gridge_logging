import os
import json
import time
import subprocess
import webbrowser
from threading import Thread
import tkinter as tk
from tkinter import messagebox

# Attempt to import pystray, fallback to simple background process if missing
try:
    import pystray
    from PIL import Image, ImageDraw
    HAS_TRAY = True
except ImportError:
    HAS_TRAY = False

HOME = os.path.expanduser("~")
GRIDGE = os.path.join(HOME, ".gridge")
PROXY_JS = os.path.join(GRIDGE, "local-proxy", "proxy.js")
CONFIG_FILE = os.path.join(GRIDGE, "local-proxy", "config.json")
LOGS_FILE = os.path.join(GRIDGE, "logs", "captures.jsonl")
LOG_PORT = 8081

last_log_count = 0

def get_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except: pass
    return {}

def start_proxy():
    # Start proxy.js using node
    subprocess.Popen(["node", PROXY_JS], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def stop_proxy():
    subprocess.run(["pkill", "-f", "local-proxy/proxy.js"])

def open_logs():
    webbrowser.open(f"http://localhost:{LOG_PORT}")

def notify_mac(title, text):
    s = f'display notification "{text}" with title "{title}"'
    subprocess.run(["osascript", "-e", s])

def create_image():
    # Create simple green circle with 'G'
    width = 64
    height = 64
    image = Image.new('RGBA', (width, height), (255, 255, 255, 0))
    dc = ImageDraw.Draw(image)
    dc.ellipse([4, 4, 60, 60], fill=(76, 175, 80))
    # Note: Text rendering in PIL is complex without specific fonts, 
    # so we'll just use a white circle inside for now or a simple shape
    dc.ellipse([16, 16, 48, 48], outline=(255, 255, 255), width=4)
    return image

def monitor_logs(icon=None):
    global last_log_count
    while True:
        if os.path.exists(LOGS_FILE):
            try:
                with open(LOGS_FILE, 'r') as f:
                    lines = f.readlines()
                    count = len(lines)
                    if count > last_log_count:
                        if last_log_count > 0:
                            last_line = json.loads(lines[-1])
                            msg = f"Model: {last_line.get('model', 'Unknown')}\nTokens: {last_line.get('input_tokens', 0)} / {last_line.get('output_tokens', 0)}"
                            notify_mac("Gridge: Log Captured", msg)
                        last_log_count = count
                        if icon:
                            icon.title = f"Gridge AI Logger\nToday: {count} logs"
            except: pass
        time.sleep(5)

if HAS_TRAY:
    def on_exit(icon, item):
        stop_proxy()
        icon.stop()

    def setup_tray():
        menu = pystray.Menu(
            pystray.MenuItem("Gridge AI Logger", lambda: None, enabled=False),
            pystray.Menu.Separator(),
            pystray.MenuItem("Log Viewer", open_logs),
            pystray.MenuItem("Restart Proxy", lambda: (stop_proxy(), time.sleep(1), start_proxy())),
            pystray.Menu.Separator(),
            pystray.MenuItem("Exit", on_exit)
        )
        icon = pystray.Icon("Gridge", create_image(), "Gridge AI Logger", menu)
        
        # Start monitor thread
        Thread(target=monitor_logs, args=(icon,), daemon=True).start()
        
        icon.run()

    if __name__ == "__main__":
        start_proxy()
        setup_tray()
else:
    # Minimal fallback without tray icon
    if __name__ == "__main__":
        print("Pystray not found. Running in background mode.")
        start_proxy()
        notify_mac("Gridge AI Logger", "Running in background (Tray icon requires pystray)")
        monitor_logs()
