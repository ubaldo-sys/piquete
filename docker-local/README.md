# Stack local — n8n + Evolution API + Portainer + Cloudflare Tunnel

## O que sobe com docker compose up

| Container  | Acesso                    | Para quê                              |
|------------|---------------------------|---------------------------------------|
| Portainer  | http://localhost:9000     | Interface gráfica para gerenciar tudo |
| n8n        | http://localhost:5678     | Automação / recebe o webhook          |
| Evolution  | http://localhost:8080     | Conecta ao WhatsApp                   |

---

## Pré-requisitos

Instalar Docker Engine no Ubuntu (terminal):

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Depois **feche e reabra o terminal** (necessário para aplicar o grupo docker).

---

## Passo 1 — Subir todos os containers

Na pasta deste arquivo, abra o terminal e rode:

```bash
docker compose up -d
```

Aguarde o download das imagens (só na primeira vez, pode demorar alguns minutos).

Verifique se estão todos rodando:

```bash
docker compose ps
```

Os três devem aparecer como `running`.

---

## Passo 2 — Configurar o Portainer

Acesse http://localhost:9000 no navegador.

1. Na primeira vez, ele pede para criar um usuário administrador — escolha qualquer usuário e senha
2. Na tela seguinte, selecione **"Get Started"** e depois clique em **"local"**
3. Você verá o painel com os três containers rodando

A partir daqui você pode **ver logs**, **parar**, **reiniciar** e **inspecionar** qualquer container pelo navegador, sem precisar do terminal.

---

## Passo 3 — Obter a URL pública com Cloudflare Tunnel

Abra um segundo terminal e rode:

```bash
docker run --rm --network host cloudflare/cloudflared:latest tunnel --url http://localhost:5678
```

Aguarde alguns segundos. Você verá uma linha como:

```
Your quick Tunnel has been created! Visit it at:
https://pink-wolf-abc123.trycloudflare.com
```

Copie essa URL. Ela é válida enquanto este terminal estiver aberto.

---

## Passo 4 — Atualizar a URL do tunnel

Abra o arquivo `.env` nesta pasta e cole a URL:

```
TUNNEL_URL=https://pink-wolf-abc123.trycloudflare.com
```

Reinicie o n8n para que ele reconheça a nova URL:

```bash
docker compose restart n8n
```

Ou pelo Portainer: clique no container `n8n` → botão **Restart**.

---

## Passo 5 — Conectar o WhatsApp na Evolution API

### 5a. Criar uma instância

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: minha-chave-secreta" \
  -d '{"instanceName": "piquete", "qrcode": true}'
```

### 5b. Obter o QR Code

```bash
curl http://localhost:8080/instance/connect/piquete \
  -H "apikey: minha-chave-secreta"
```

A resposta contém um QR Code em base64. Cole o valor em:
https://base64.guru/converter/decode/image

Escaneie com o WhatsApp do celular que enviará as cobranças.

---

## Passo 6 — Criar o workflow no n8n

Acesse http://localhost:5678 e crie uma conta local.

1. Clique em **New Workflow**

2. Adicione o nó **Webhook**:
   - Method: `POST`
   - Path: `enviar-cobranca`

3. Adicione o nó **HTTP Request** conectado ao Webhook:
   - Method: `POST`
   - URL: `http://evolution:8080/message/sendText/piquete`
   - Headers:
     - `apikey`: `minha-chave-secreta`
     - `Content-Type`: `application/json`
   - Body (JSON):
     ```json
     {
       "number": "={{ $json.body.membro.telefone }}",
       "text": "Olá, {{ $json.body.membro.nome_completo }}! 👋\n\nPassando para lembrar que sua mensalidade do Piquete Tropeiros da Lealdade está pendente.\n\nQualquer dúvida, entre em contato.\n\nAbraço!"
     }
     ```

4. Ative o workflow com o toggle no canto superior direito

---

## Passo 7 — Atualizar o projeto React

No projeto `cobranca-piquete`, abra o arquivo `.env` e preencha:

```
VITE_WEBHOOK_URL=https://pink-wolf-abc123.trycloudflare.com
```

Faça o novo deploy:

```bash
npm run build
firebase deploy
```

Teste clicando em "Enviar Cobrança" no site.

---

## Uso no dia a dia (estudo)

**Para iniciar:**
```bash
# Terminal 1 — containers
docker compose up -d

# Terminal 2 — tunnel (deixe aberto)
docker run --rm --network host cloudflare/cloudflared:latest tunnel --url http://localhost:5678
```

Copie a nova URL, atualize `.env` daqui + `.env` do projeto React, reinicie o n8n e faça novo deploy.

**Para parar tudo:**
```bash
docker compose down
```

Os dados ficam salvos nos volumes — não são perdidos ao parar.

---

## Gerenciando pelo Portainer (sem terminal)

| Ação              | Como fazer no Portainer                              |
|-------------------|------------------------------------------------------|
| Ver logs          | Containers → clique no container → Logs              |
| Parar container   | Containers → ícone de parar (quadrado)               |
| Reiniciar         | Containers → ícone de reiniciar (setas circulares)   |
| Ver variáveis     | Containers → clique no container → Inspect           |
| Ver uso de CPU/RAM| Containers → ícone de gráfico (Stats)                |

---

## Senhas e chaves

| Serviço       | Credencial                 | Onde trocar                  |
|---------------|----------------------------|------------------------------|
| Portainer     | definido no primeiro acesso | http://localhost:9000        |
| Evolution API | `minha-chave-secreta`      | `docker-compose.yml`         |
| n8n           | definido no primeiro acesso | http://localhost:5678        |
| WhatsApp      | QR Code do celular          | Passo 5b acima               |
