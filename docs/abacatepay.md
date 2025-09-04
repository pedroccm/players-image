# AbacatePay API Documentation

## Introdução

A AbacatePay é um gateway de pagamento brasileiro que simplifica a criação de cobranças e o processamento de pagamentos PIX. A API foi desenvolvida para ser intuitiva e fácil de usar.

### Base URL

```
https://api.abacatepay.com/v1/
```

### Autenticação

Todas as requisições devem incluir uma chave de API no header Authorization:

```
Authorization: Bearer <sua_chave_api>
```

### Ambientes

- **Dev Mode**: Chaves criadas em ambiente de desenvolvimento processam transações simuladas
- **Produção**: Chaves criadas em produção processam transações reais

### Estrutura de Resposta

Todas as respostas seguem o padrão:

```json
{
  "data": { /* dados da operação */ },
  "error": null
}
```

---

## Cobrança (Billing)

### Criar uma nova Cobrança

Permite criar uma cobrança (checkout) com múltiplos produtos para seu cliente.

**Endpoint:** `POST /billing/create`

#### Parâmetros Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| frequency | enum<string> | `ONE_TIME` ou `MULTIPLE_PAYMENTS` |
| methods | string[] | Array com métodos de pagamento. Atualmente: `["PIX"]` |
| products | object[] | Lista de produtos (mínimo 1) |
| returnUrl | string | URL de retorno (quando cliente clica "Voltar") |
| completionUrl | string | URL de finalização (após pagamento concluído) |

#### Estrutura do Produto

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| externalId | string | Sim | ID único do produto em seu sistema |
| name | string | Sim | Nome do produto |
| description | string | Não | Descrição do produto |
| quantity | integer | Sim | Quantidade (≥ 1) |
| price | integer | Sim | Preço unitário em centavos (≥ 100) |

#### Parâmetros Opcionais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| customerId | string | ID de cliente já cadastrado |
| customer | object | Dados do cliente (name, cellphone, email, taxId) |
| allowCoupons | boolean | Permite uso de cupons (padrão: false) |
| coupons | string[] | Lista de cupons disponíveis (máx. 50) |
| externalId | string | ID único da cobrança em seu sistema |

#### Exemplo de Request

```json
{
  "frequency": "ONE_TIME",
  "methods": ["PIX"],
  "products": [
    {
      "externalId": "prod-1234",
      "name": "Assinatura Premium",
      "description": "Acesso premium por 1 mês",
      "quantity": 1,
      "price": 2000
    }
  ],
  "returnUrl": "https://seusite.com/voltar",
  "completionUrl": "https://seusite.com/sucesso",
  "customer": {
    "name": "João Silva",
    "cellphone": "(11) 99999-9999",
    "email": "joao@email.com",
    "taxId": "123.456.789-01"
  }
}
```

#### Response

```json
{
  "data": {
    "id": "bill_123456",
    "url": "https://pay.abacatepay.com/bill-123456",
    "amount": 2000,
    "status": "PENDING",
    "devMode": true,
    "methods": ["PIX"],
    "frequency": "ONE_TIME",
    "customer": {
      "id": "cust_123456",
      "metadata": {
        "name": "João Silva",
        "email": "joao@email.com"
      }
    }
  },
  "error": null
}


---

## PIX QRCode

### Criar QRCode PIX

Cria um QRCode PIX direto com código copia-e-cola e imagem Base64 para pagamentos instantâneos.

**Endpoint:** `POST /pixQrCode/create`

#### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| amount | integer | Sim | Valor da cobrança em centavos |
| expiresIn | integer | Não | Tempo de expiração em segundos |
| description | string | Não | Mensagem no PIX (máx. 140 caracteres) |
| customer | object | Não | Dados do cliente (se fornecido, todos campos obrigatórios) |
| metadata | object | Não | Metadados personalizados |

#### Estrutura do Customer

Se informado, todos os campos são obrigatórios:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string | Nome completo |
| cellphone | string | Celular com DDD |
| email | string | Email válido |
| taxId | string | CPF ou CNPJ |

#### Exemplo de Request

```json
{
  "amount": 5000,
  "expiresIn": 3600,
  "description": "Pagamento teste",
  "customer": {
    "name": "Maria Santos",
    "cellphone": "(11) 98765-4321",
    "email": "maria@email.com",
    "taxId": "123.456.789-01"
  }
}
```

#### Response

```json
{
  "data": {
    "id": "pix_char_123456",
    "amount": 5000,
    "status": "PENDING",
    "devMode": true,
    "brCode": "00020101021226950014br.gov.bcb.pix...",
    "brCodeBase64": "data:image/png;base64,iVBORw0KGgoAAA...",
    "platformFee": 200,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "expiresAt": "2024-01-15T11:30:00.000Z"
  },
  "error": null
}
```

### Checar Status do QRCode PIX

Verifica o status atual de um QRCode PIX.

**Endpoint:** `GET /pixQrCode/check`

#### Query Parameters

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | string | Sim | ID do QRCode PIX |

#### Response

```json
{
  "data": {
    "status": "PENDING",
    "expiresAt": "2024-01-15T11:30:00.000Z"
  },
  "error": null
}
```

#### Status Possíveis

- `PENDING`: Aguardando pagamento
- `PAID`: Pagamento confirmado
- `EXPIRED`: QRCode expirado
- `CANCELLED`: QRCode cancelado
- `REFUNDED`: Pagamento estornado

### Simular Pagamento (Dev Mode)

Simula o pagamento de um QRCode PIX no ambiente de desenvolvimento.

**Endpoint:** `POST /pixQrCode/simulate-payment`

#### Query Parameters

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | string | Sim | ID do QRCode PIX |

#### Body

```json
{
  "metadata": {}
}
```

**Nota:** Esta funcionalidade só funciona em ambiente de desenvolvimento (devMode).


---

## Webhooks

Webhooks permitem receber notificações em tempo real sobre eventos na AbacatePay.

### Configuração

1. Acesse o dashboard da AbacatePay
2. Navegue para **Integrar** → **Webhooks**  
3. Configure:
   - **Nome**: Identificador do webhook
   - **URL**: Endpoint HTTPS que receberá as notificações
   - **Secret**: Chave secreta para validação

### Segurança

Todas as notificações incluem o `webhookSecret` como query parameter:

```
https://seusite.com/webhook?webhookSecret=seu_secret_aqui
```

### Validação

```javascript
app.post('/webhook/abacatepay', (req, res) => {
  const { webhookSecret } = req.query;
  
  if (webhookSecret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid webhook secret' });
  }
  
  const event = req.body;
  console.log('Webhook recebido:', event);
  
  res.status(200).json({ received: true });
});
```

### Eventos Suportados

#### billing.paid

Disparado quando um pagamento é confirmado.

**PIX QRCode:**
```json
{
  "data": {
    "payment": {
      "amount": 1000,
      "fee": 80,
      "method": "PIX"
    },
    "pixQrCode": {
      "amount": 1000,
      "id": "pix_char_123456",
      "kind": "PIX",
      "status": "PAID"
    }
  },
  "devMode": false,
  "event": "billing.paid"
}
```

**Cobrança:**
```json
{
  "data": {
    "payment": {
      "amount": 1000,
      "fee": 80,
      "method": "PIX"
    },
    "billing": {
      "amount": 1000,
      "id": "bill_123456",
      "status": "PAID",
      "customer": {
        "id": "cust_123456",
        "metadata": {
          "name": "João Silva",
          "email": "joao@email.com"
        }
      }
    }
  },
  "devMode": false,
  "event": "billing.paid"
}
```

---

## Links Úteis

- [Documentação Oficial](https://docs.abacatepay.com)
- [Dashboard AbacatePay](https://abacatepay.com)
- [Suporte](mailto:ajuda@abacatepay.com)
