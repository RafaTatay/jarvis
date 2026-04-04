# Jarvis Clap Detector

Da dos palmadas → saludo por voz → suena el tema de Iron Man.

---

## Requisitos

- Python 3.10+
- Micrófono funcional

### Dependencias Python

```bash
pip install sounddevice numpy gtts
```

### Dependencia por sistema operativo

| OS | Qué instalar |
|---|---|
| **Linux** | `sudo apt install mpg123` |
| **macOS** | Nada (usa `afplay`, ya incluido) |
| **Windows** | Nada (usa PowerShell, ya incluido) |

---

## Estructura de archivos

Pon el `.mp3` en la misma carpeta que el script:

```
welcome.py
openingIronMan.mp3   ← opcional, si no está abre YouTube
```

---

## Uso

```bash
python3 welcome.py
```

Da **dos palmadas** en menos de 2 segundos.
Si no encuentra el `.mp3` local, abre automáticamente el vídeo de YouTube.

`Ctrl-C` para salir.

---

## Ajustes rápidos

| Variable | Por defecto | Qué controla |
|---|---|---|
| `THRESHOLD` | `0.10` | Sensibilidad del micrófono (bajar = más sensible) |
| `DOUBLE_WINDOW` | `2.0 s` | Tiempo máximo entre las dos palmadas |
| `COOLDOWN` | `0.1 s` | Tiempo mínimo entre detecciones |
| `MENSAJE` | `"Bienvenido de nuevo Jefe"` | Texto que dice la voz |
| `URL_YOUTUBE` | enlace Iron Man | Fallback si no hay `.mp3` |
