# AbacatePay API Documentation

## Cobrança (Billing)

### Criar uma nova Cobrança

Permite que você crie um link de cobrança para seu cliente pagar você.

*Endpoint:* POST /billing/create

#### Autenticação

- *Authorization* (string, header, required): Cabeçalho de autenticação Bearer no formato Bearer <abacatepay-api-key> onde <abacatepay-api-key> é a sua chave de API.

#### Body Parameters

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| frequency | enum<string> | Sim | Define o tipo de frequência da cobrança. Padrão: ONE_TIME |
| methods | enum<string>[] | Sim | Métodos de pagamento que serão utilizados. Atualmente, apenas PIX é suportado. |
| products | object[] | Sim | Lista de produtos que seu cliente está pagando. Mínimo: 1 elemento |
| returnUrl | string<uri> | Sim | URL para redirecionar o cliente caso o mesmo clique na opção "Voltar" |
| completionUrl | string<uri> | Sim | URL para redirecionar o cliente quando o pagamento for concluído |
| customerId | string | Não | O id de um cliente já cadastrado em sua loja |
| customer | object | Não | Dados do seu cliente. Caso o cliente não exista ele será criado |
| allowCoupons | boolean | Não | Se verdadeiro cupons podem ser usados na billing. Padrão: false |
| coupons | string[] | Não | Lista de cupons disponíveis para serem usados com a billing. Máximo: 50 |
| externalId | string | Não | Identificador único da sua aplicação para cobranças |

#### Valores Possíveis

- *frequency*: ONE_TIME, MULTIPLE_PAYMENTS
- *methods*: ["PIX"] (array obrigatório com 1 elemento)

#### Exemplo de Request

json
{
  "frequency": "ONE_TIME",
  "methods": ["PIX"],
  "products": [
    {
      "externalId": "prod-1234",
      "name": "Assinatura de Programa Fitness",
      "description": "Acesso ao programa fitness premium por 1 mês.",
      "quantity": 2,
      "price": 2000
    }
  ],
  "returnUrl": "https://example.com/billing",
  "completionUrl": "https://example.com/completion",
  "customerId": "cust_abcdefghij",
  "allowCoupons": false,
  "coupons": ["ABKT10", "ABKT5", "PROMO10"],
  "externalId": "seu_id_123"
}


#### Response

*200 - Success*
json
{
  "data": { /* dados da cobrança */ },
  "error": null
}


---

## PIX QRCode

### Criar QRCode PIX

Permite que você crie um código copia-e-cola e um QRCode Pix para seu cliente fazer o pagamento.

*Endpoint:* POST /pixQrCode/create

#### Autenticação

- *Authorization* (string, header, required): Cabeçalho de autenticação Bearer no formato Bearer <abacatepay-api-key> onde <abacatepay-api-key> é a sua chave de API.

#### Body Parameters

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| amount | number | Sim | Valor da cobrança em centavos |
| expiresIn | number | Não | Tempo de expiração da cobrança em segundos |
| description | string | Não | Mensagem que aparecerá na hora do pagamento do PIX. Máximo: 140 caracteres |
| customer | object | Não | Os dados do seu cliente para criá-lo. Se informado, todos os campos são obrigatórios: name, cellphone, email e taxId |
| metadata | object | Não | Metadados opcionais para a cobrança |

#### Response

*200 - Success*
json
{
  "data": { /* dados do QRCode */ },
  "error": null
}


### Checar Status do QRCode PIX

Checar status do pagamento do QRCode Pix.

*Endpoint:* GET /pixQrCode/check

#### Autenticação

- *Authorization* (string, header, required): Cabeçalho de autenticação Bearer no formato Bearer <abacatepay-api-key> onde <abacatepay-api-key> é a sua chave de API.

#### Query Parameters

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | string | Sim | ID do QRCode Pix |

#### Response

*200 - Success*
json
{
  "data": { /* status do pagamento */ },
  "error": null
}


---

## Links Úteis

- [Listar Cobranças](#)
- [Simular Pagamento](#)
- [GitHub](https://github.com)
- [LinkedIn](https://linkedin.com)
