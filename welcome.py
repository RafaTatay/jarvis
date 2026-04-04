#!/usr/bin/env python3
"""
Jarvis Clap Detector — Cross-platform (Linux / macOS / Windows)
Double-clap → TTS greeting + local audio or YouTube fallback.
"""

import os
import sys
import time
import platform
import threading
import subprocess
import tempfile
import webbrowser
import numpy as np
import sounddevice as sd
from gtts import gTTS

# ── Platform detection ────────────────────────────────────────────────────────
SYSTEM = platform.system()

# ── Settings ──────────────────────────────────────────────────────────────────
SAMPLE_RATE   = 44_100
BLOCK_SIZE    = int(SAMPLE_RATE * 0.05)
THRESHOLD     = 0.10
COOLDOWN      = 0.1
DOUBLE_WINDOW = 2.0

MENSAJE       = "Bienvenido de nuevo Jefe"
URL_YOUTUBE   = "https://www.youtube.com/watch?v=hEIexwwiKKU"
AUDIO_LOCAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "openingIronMan.mp3")

# ── Global state ──────────────────────────────────────────────────────────────
clap_times: list[float] = []
triggered = False
lock = threading.Lock()


# ── Audio playback helpers ────────────────────────────────────────────────────

def _play_mp3_linux(path: str) -> None:
    """Linux: mpg123"""
    subprocess.run(["mpg123", "-q", path], capture_output=True)


def _play_mp3_macos(path: str) -> None:
    """macOS: afplay (built-in, no deps)"""
    subprocess.run(["afplay", path], capture_output=True)


def _play_mp3_windows(path: str) -> None:
    """Windows: Windows Media Player via PowerShell (no extra deps)"""
    ps_cmd = (
        f'$mp = New-Object System.Windows.Media.MediaPlayer; '
        f'$mp.Open([System.Uri]::new("{path}")); '
        f'$mp.Play(); Start-Sleep -Seconds 60'
    )
    subprocess.run(
        ["powershell", "-NoProfile", "-Command", ps_cmd],
        capture_output=True,
    )


_PLAY_BACKENDS = {
    "Linux":   _play_mp3_linux,
    "Darwin":  _play_mp3_macos,
    "Windows": _play_mp3_windows,
}


def play_mp3(path: str) -> None:
    """Play an MP3 file using the platform-appropriate backend."""
    backend = _PLAY_BACKENDS.get(SYSTEM)
    if backend is None:
        print(f"[WARN] Unsupported OS '{SYSTEM}'. Falling back to webbrowser.")
        webbrowser.open(path)
        return
    backend(path)


# ── Dependency check ──────────────────────────────────────────────────────────

def _check_deps_linux() -> None:
    if subprocess.run(["which", "mpg123"], capture_output=True).returncode != 0:
        print("Error: mpg123 not found.\n  Install: sudo apt install mpg123")
        sys.exit(1)


def _check_deps_macos() -> None:
    # afplay ships with macOS — nothing to install
    pass


def _check_deps_windows() -> None:
    # PowerShell + Windows.Media.MediaPlayer are built-in on Win 7+
    result = subprocess.run(
        ["powershell", "-NoProfile", "-Command", "Get-Command powershell"],
        capture_output=True,
    )
    if result.returncode != 0:
        print("Error: PowerShell not found. Please install it.")
        sys.exit(1)


_DEP_CHECKS = {
    "Linux":   _check_deps_linux,
    "Darwin":  _check_deps_macos,
    "Windows": _check_deps_windows,
}


def check_dependencies() -> None:
    checker = _DEP_CHECKS.get(SYSTEM)
    if checker:
        checker()
    else:
        print(f"[WARN] Unknown OS '{SYSTEM}'. Skipping dependency check.")


# ── TTS ───────────────────────────────────────────────────────────────────────

def speak(text: str) -> None:
    """Text-to-speech via gTTS, played with the platform backend."""
    tmp_path = None
    try:
        tts = gTTS(text=text, lang="es", slow=False)
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            tmp_path = f.name
        tts.save(tmp_path)
        play_mp3(tmp_path)
    except Exception as exc:
        print(f"[ERROR] TTS failed: {exc}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ── Audio playback (main track) ───────────────────────────────────────────────

def play_audio() -> None:
    """Play the Iron Man theme locally; open YouTube as fallback."""
    if os.path.exists(AUDIO_LOCAL):
        print(f"[INFO] Playing locally: {os.path.basename(AUDIO_LOCAL)}")
        play_mp3(AUDIO_LOCAL)
    else:
        print(f"[INFO] Local file not found: {AUDIO_LOCAL}")
        print(f"[INFO] Opening YouTube: {URL_YOUTUBE}")
        webbrowser.open(URL_YOUTUBE)


# ── Welcome sequence ──────────────────────────────────────────────────────────

def welcome_sequence() -> None:
    print("\n── Starting welcome sequence ──\n")
    speak(MENSAJE)
    play_audio()
    print("\n── Sequence completed ──\n")


# ── Clap detection callback ───────────────────────────────────────────────────

def audio_callback(indata, frames, time_info, status) -> None:
    global triggered, clap_times
    if triggered:
        return

    rms = float(np.sqrt(np.mean(indata ** 2)))
    now = time.time()

    if rms > THRESHOLD:
        with lock:
            if clap_times and (now - clap_times[-1]) < COOLDOWN:
                return
            clap_times.append(now)
            clap_times = [t for t in clap_times if now - t <= DOUBLE_WINDOW]
            count = len(clap_times)
            print(f"  Clap {count}/2  (RMS={rms:.3f})")
            if count >= 2:
                triggered = True
                clap_times = []
                threading.Thread(target=welcome_sequence, daemon=True).start()


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    global triggered

    check_dependencies()

    print("=" * 55)
    print(f"  OS detected : {SYSTEM}")
    print(f"  Audio file  : {AUDIO_LOCAL}")
    print(f"  Threshold   : {THRESHOLD}")
    print("  Listening for a double-clap…")
    print("  (Ctrl-C to quit)")
    print("=" * 55)

    try:
        with sd.InputStream(
            samplerate=SAMPLE_RATE,
            blocksize=BLOCK_SIZE,
            channels=1,
            dtype="float32",
            callback=audio_callback,
        ):
            while True:
                time.sleep(0.1)
                if triggered:
                    time.sleep(10)
                    triggered = False
                    print("\n  Listening again…\n")
    except KeyboardInterrupt:
        print("\n\nGoodbye!")
        sys.exit(0)


if __name__ == "__main__":
    main()
