# 🚀 Challenge Técnico Backend - Node.js

## 📌 Cómo Usar

### Requisitos

- Docker instalado
- Docker Compose instalado

### Comandos Básicos

```bash
# Generar archivo de datos (500k líneas por defecto)
make data

# Iniciar todos los servicios (app + SQL Server)
make all
```

## 🔍 Datos de Prueba

- El archivo incluido tiene **500,000 líneas**
- Se probó con éxito hasta **800,000 líneas** (no incluido por límite de GitHub)

**Rendimiento con 800k líneas**:

```json
{
  "durationSeconds": 36.657,
  "memory": {
    "peaks": {
      "rss": 153.75, // Máxima memoria usada (MB)
      "heapUsed": 60.26 // Máximo heap de Node.js usado (MB)
    }
  }
}
```

## 🌐 Endpoints Disponibles

### 1. Health Check

`GET http://localhost:3000/health`

Muestra el estado actual del servicio:

```json
{
  "memory": {
    "current": {
      "rss": 79.27,       // Memoria total usada (MB)
      "heapUsed": 21.3,    // Memoria de JavaScript en uso
      "external": 1.39     // Memoria usada por librerías externas
    },
    "peaks": { ... }      // Valores máximos alcanzados
  }
}
```

### 2. Iniciar Procesamiento

`GET http://localhost:3000/process`

- Inicia el procesamiento del archivo
- Puedes monitorear el progreso con `/health`

### 3. Ver Logs

`GET http://localhost:3000/get-logs?file=error`

Opciones para `file`:

- `error`: Muestra errores de validación
- `process`: Muestra el progreso del procesamiento

  ```

  ```

## ⚠️ Notas

- El servicio está configurado para usar máximo **256MB de RAM**
- Los tiempos pueden variar según tu hardware
