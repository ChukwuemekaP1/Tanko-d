# Guía de Importación de Datos Tanko a Microsoft Access

Esta guía explica cómo importar el archivo `.zip` generado por el endpoint
`GET /api/v1/exports/access` a Microsoft Access para reportes y auditoría.

---

## 1. Descargar el archivo

Desde el dashboard de Jefe de Flota haz clic en **"Exportar datos"**, o llama
el endpoint directamente:

```
GET https://<tu-backend>/api/v1/exports/access?from=2026-01-01&to=2026-06-30
Authorization: Bearer <JWT>
```

Guarda el archivo `tanko-export-<timestamp>.zip` en tu equipo.

## 2. Extraer el ZIP

Descomprime el archivo. Obtendrás cinco archivos CSV:

| Archivo | Contenido |
|---------|-----------|
| `users.csv` | Conductores y jefes de flota |
| `units.csv` | Unidades (vehículos) |
| `fuel_logs.csv` | Registros de carga de combustible |
| `fund_requests.csv` | Solicitudes de fondos y su estado |
| `escrow_config.csv` | Configuración de escrow |

## 3. Crear una base de datos en Access

1. Abre **Microsoft Access** → **Archivo → Nuevo → Base de datos en blanco**.
2. Asigna un nombre (p. ej. `Tanko-Flota-2026.accdb`) y guárdala.

## 4. Importar cada CSV

Repite los pasos siguientes para cada uno de los cinco archivos:

1. Pestaña **Datos externos** → **Nueva fuente de datos** → **Desde archivo** → **Texto**.
2. Selecciona el archivo CSV correspondiente.
3. Elige **Importar el origen de datos en una nueva tabla**.
4. En el asistente:
   - Marca **Delimitado** → separador **Coma (,)**.
   - Activa **Primera fila contiene nombres de campo**.
   - Revisa y ajusta los tipos de columna si es necesario (fechas como `Fecha/Hora`, montos como `Número`).
5. Indica el nombre de la tabla (usa el mismo nombre que el archivo, sin `.csv`).
6. Haz clic en **Finalizar**.

## 5. Definir relaciones (opcional pero recomendado)

Una vez importadas las cinco tablas, ve a **Herramientas de base de datos →
Relaciones** y conecta:

| Tabla padre | Campo | Tabla hijo | Campo |
|-------------|-------|------------|-------|
| `users` | `id` | `units` | `userId` |
| `users` | `id` | `fuel_logs` | `userId` |
| `units` | `id` | `fuel_logs` | `unitId` |
| `users` | `stellarPubKey` | `fund_requests` | `driverPubKey` |
| `users` | `stellarPubKey` | `fund_requests` | `managerPubKey` |

## 6. Ejecutar consultas y reportes

Con las tablas y relaciones configuradas puedes usar el **Generador de consultas**
de Access o SQL directo. Ejemplo:

```sql
SELECT u.name, SUM(f.amount) AS total_gasto
FROM fuel_logs AS f
INNER JOIN users AS u ON f.userId = u.id
GROUP BY u.name
ORDER BY total_gasto DESC;
```

## 7. Filtrado por rango de fechas en la exportación

El endpoint acepta parámetros opcionales `from` y `to` (formato `YYYY-MM-DD`):

```
GET /api/v1/exports/access?from=2026-04-01&to=2026-04-30
```

Esto limita los registros de `fuel_logs` y `fund_requests` al periodo indicado,
manteniendo el catálogo completo de `users`, `units` y `escrow_config`.

---

## Notas

- Los archivos CSV usan codificación **UTF-8**. Si Access muestra caracteres
  extraños en acentos o la ñ, en el asistente de importación selecciona la
  página de códigos **Unicode (UTF-8) 65001**.
- Los campos `createdAt` y `updatedAt` están en formato ISO 8601. Access los
  reconoce automáticamente si el tipo de columna se define como `Fecha/Hora`.
- Este export es de **solo lectura**; no se sincronizan cambios de regreso a
  la base de datos de Tanko.
