# COMPDEC Gestão Integrada — versão segura

Aplicação institucional para estoque, equipes, NUPDECs, voluntários, capacitação, comunicação, documentos, prontidão e auditoria.

## 1. Executar no Codex ou localmente

```bash
npm install
npm --prefix functions install
cp .env.example .env.local
# para desenvolvimento local, altere VITE_USE_EMULATORS=true em .env.local
npm run dev:secure
```

A interface fica em `http://localhost:5173` e a UI dos emuladores Firebase em `http://localhost:4000`.

> Emuladores usam somente dados fictícios. Não carregue dados pessoais reais no ambiente de desenvolvimento.

## 2. Produção

1. Criar projeto Firebase/Google Cloud institucional.
2. Habilitar Authentication with Identity Platform, Firestore, Storage, Functions e Hosting.
3. Cadastrar o app Web e preencher `.env.local` sem versioná-lo.
4. Habilitar verificação de e-mail.
5. Habilitar MFA TOTP para perfis administrativos.
6. Configurar App Check com reCAPTCHA Enterprise e depois ativar enforcement.
7. Revisar IAM do projeto e restringir contas de serviço.
8. Implantar regras e índices.
9. Criar o primeiro `SUPER_ADMIN` por procedimento controlado e depois usar a função administrativa de criação de usuários.
10. Executar revisão de segurança, teste de regras e teste de invasão antes de dados pessoais reais.

## Arquitetura de segurança

- deny-by-default no Firestore e Storage;
- RBAC por custom claims;
- líder de NUPDEC restrito por `nupdecId` no token;
- dados pessoais separados em `volunteerPrivate`;
- operações críticas em Cloud Functions com App Check;
- movimentação/aprovação/cautela transacional;
- auditoria append-only, somente servidor grava;
- exclusões destrutivas bloqueadas nas Rules;
- upload limitado a PDF/JPEG/PNG até 10 MB;
- CSP e cabeçalhos de segurança no Hosting;
- logs sanitizados para não registrar PII crítica.

## Observação importante sobre segurança

Não existe garantia séria de "100% seguro". Esta base aplica controles fortes de engenharia, mas o uso oficial com dados pessoais depende também de configuração correta do Firebase/Google Cloud, MFA, App Check, IAM, governança LGPD, backups, monitoramento, treinamento dos usuários e testes independentes.
