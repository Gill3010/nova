# Lambda de Revisión Preliminar — Nova × OJS × AWS Bedrock

Esta función AWS Lambda en Python 3.12 implementa el **Orquestador de Análisis** descrito en la Propuesta Técnica de Arquitectura Híbrida OJS-AWS.

## Flujo de Trabajo

```
EventBridge (cada 15 min)
    │
    ▼
handler.py ──► ojs_client.py   (Consulta manuscritos en revisión en OJS/GoDaddy)
               │
               ▼
           extractor.py        (Descarga PDF/Word y extrae texto limpio)
               │
               ▼
           anonymizer.py       (Detecta y elimina identidades del texto)
               │
               ▼
           bedrock_client.py   (Claude 3.5 Sonnet aplica rúbrica científica)
               │
               ▼
           nova_client.py      (POST /api/revisiones/sistema → Nova guarda el reporte)
```

## Estructura de Archivos

```
lambda/
├── handler.py              # Punto de entrada — EventBridge trigger
├── modules/
│   ├── ojs_client.py       # Cliente de la API REST de OJS
│   ├── extractor.py        # Extracción de texto de PDF y Word
│   ├── anonymizer.py       # Detección de identidades (Regex + NLP)
│   ├── bedrock_client.py   # Integración con Amazon Bedrock (Claude)
│   └── nova_client.py      # Cliente de la API interna de Nova
├── requirements.txt        # Dependencias Python
├── template.yaml           # Plantilla AWS SAM para despliegue
└── README.md               # Este archivo
```

## Configuración de Variables de Entorno

Define estas variables de entorno en la consola de AWS Lambda o en `template.yaml`:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `OJS_BASE_URL` | URL base del portal OJS | `https://relaticpanama.org/_journals` |
| `OJS_API_KEY` | API Key de administrador de OJS | `abc123...` |
| `OJS_JOURNAL_PATH` | Path del journal en OJS | `reic` |
| `NOVA_API_URL` | URL del servidor Nova | `https://api.tudominio.com` |
| `NOVA_INTERNAL_API_KEY` | API Key interna de Nova | `CHANGE_THIS_...` |
| `BEDROCK_MODEL_ID` | ID del modelo Bedrock | `anthropic.claude-3-5-sonnet-20241022-v2:0` |
| `AWS_REGION_NAME` | Región de AWS | `us-east-1` |
| `S3_BUCKET` | Bucket S3 para guardar reportes | `nova-revisiones` |
| `PROCESSED_PARAM` | Nombre del parámetro en SSM | `/nova/lambda/last_processed_ids` |

## Despliegue con AWS SAM

```bash
# 1. Instalar AWS SAM CLI
pip install aws-sam-cli

# 2. Construir la función (instala dependencias)
sam build

# 3. Desplegar interactivamente
sam deploy --guided

# 4. Despliegues posteriores
sam deploy
```

## Prueba Local

```bash
# Invocar la función localmente con un evento de prueba
sam local invoke ReviewOrchestrator --event events/test_event.json
```

## Costo Estimado

- **AWS Lambda**: $0.00/mes (nivel gratuito — 1M invocaciones/mes)
- **Amazon Bedrock (Claude 3.5 Sonnet)**: ~$0.15–$0.30 por manuscrito
- **Amazon S3**: ~$0.023/GB/mes
- **AWS SES**: $0.00/mes (62,000 correos gratuitos)
- **AWS SSM Parameter Store**: $0.00/mes (parámetros estándar gratuitos)
