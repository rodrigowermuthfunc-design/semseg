# COMPDEC Gestão Integrada — V2

Sistema web/PWA para gestão integrada da Coordenadoria Municipal de Proteção e Defesa Civil, com foco em estoque, equipes, NUPDECs, voluntariado, capacitação, comunicação e prontidão operacional.

## Como executar

Use um servidor HTTP local (não abra apenas com `file://`, pois o PWA/service worker exige HTTP):

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Funções implementadas nesta V2

- Dashboard gerencial com indicadores e pendências.
- Estoque central COMPDEC, estoques de equipes e de NUPDECs.
- QR Code por item/código interno e impressão de identificação.
- Movimentação com origem, destino, motivo e responsável.
- Cautela de equipamentos com entrega, prazo, condição e devolução.
- Solicitação de materiais pelas NUPDECs com aprovação/rejeição.
- Aprovação de solicitação gera movimentação para o estoque da NUPDEC.
- Cadastro e edição de NUPDECs com georreferenciamento e ponto de encontro.
- Ficha completa da NUPDEC com voluntários, estoque, treinamentos, reuniões, avisos e prontidão.
- Painel de prontidão por NUPDEC.
- Cadastro e edição de equipes.
- Cadastro de voluntários com vínculo, disponibilidade e habilidades.
- Histórico individual do voluntário por lista nominal de presença.
- Treinamentos/instruções/simulados com lista de presença.
- Reuniões com ata, deliberações e lista de presença.
- Avisos emitidos com nível, público, destino e canais.
- Central de documentos: atas, fotos, certificados, relatórios e termos.
- Auditoria de alterações e ações sensíveis.
- Relatórios CSV e backup JSON.
- Perfis demonstrativos: Gestor, Coordenador, Almoxarifado, Líder NUPDEC e Consulta.
- PWA instalável com cache básico da aplicação.

## Índice de prontidão

O protótipo calcula 0–100 pontos usando:

- NUPDEC ativa: 15 pontos.
- 5 ou mais voluntários ativos: 20 pontos.
- Reunião em até 60 dias: 15 pontos.
- Treinamento em até 120 dias: 20 pontos.
- Conferência do estoque em até 60 dias: 15 pontos.
- Georreferenciamento: 5 pontos.
- Comunicação/aviso testado em até 60 dias: 10 pontos.

Esses pesos são parametrizáveis na futura versão de produção.

## Limitações do protótipo

Os dados ficam no `localStorage`. Arquivos anexados de até 700 KB podem ser guardados como Data URL apenas para demonstração. Não usar esta versão como banco oficial nem para dados pessoais reais.

## Arquitetura recomendada para produção

- Frontend: React + TypeScript + Vite.
- Firebase Authentication: login institucional e perfis.
- Cloud Firestore: cadastros, estoque, atividades e auditoria.
- Firebase Storage: atas, fotos, certificados e termos.
- Cloud Functions: auditoria imutável, notificações e rotinas de consistência.
- Firebase Hosting/App Hosting: publicação institucional.
- PWA: uso em campo e operação com conectividade limitada.

## Coleções Firestore sugeridas

- `users`
- `nupdecs`
- `teams`
- `volunteers`
- `inventoryItems`
- `stockLocations`
- `stockMovements`
- `custodies`
- `materialRequests`
- `trainings`
- `meetings`
- `alerts`
- `attendance`
- `documents`
- `auditLogs`
- `readinessSnapshots`

## Segurança / LGPD

- Aplicar privilégio mínimo por perfil.
- Líder de NUPDEC deve acessar apenas seu núcleo.
- Dados de contato de voluntários não devem aparecer em telas públicas.
- Auditoria deve ser append-only em produção.
- Exclusões sensíveis devem preferir inativação/soft delete.
- Arquivos devem usar regras de acesso no Firebase Storage.
