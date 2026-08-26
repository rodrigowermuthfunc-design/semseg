# AGENTS.md — instruções para Codex

## Objetivo
Evoluir o projeto `COMPDEC Gestão Integrada` de protótipo local para aplicação institucional multiusuário, mantendo a experiência atual e migrando gradualmente os dados para Firebase.

## Prioridades
1. Migrar frontend para React + TypeScript + Vite.
2. Implementar Firebase Authentication e RBAC.
3. Migrar localStorage para Cloud Firestore usando camada de repositórios.
4. Implementar Firebase Storage para documentos.
5. Tornar auditoria imutável por Cloud Function.
6. Manter PWA e responsividade mobile-first.
7. Adicionar testes automatizados das regras de estoque e permissões.

## Perfis
- SUPER_ADMIN: configuração global e gestão total.
- GESTOR_COMPDEC: gestão integral do município.
- COORDENADOR: operação, NUPDECs, atividades e estoque.
- ALMOXARIFADO: estoque, cautelas, inventário e solicitações.
- LIDER_NUPDEC: dados e atividades do próprio núcleo; pode solicitar material.
- CONSULTA: leitura autorizada.

## Regras de negócio críticas
- Movimentação nunca pode deixar saldo negativo.
- Aprovação de solicitação deve ser transacional e gerar `stockMovement`.
- Cautela deve registrar quem recebeu, origem, quantidade, data, prazo e condição.
- Devolução deve devolver saldo ao local de origem e manter histórico.
- Alterações sensíveis geram `auditLog`; usuário comum nunca apaga logs.
- NUPDEC criada deve ter um `stockLocation` correspondente.
- Equipe criada deve ter um `stockLocation` correspondente.
- Listas de presença devem usar IDs de voluntários, não somente texto livre.
- Prontidão deve ser calculada por serviço dedicado e permitir parametrização futura.

## LGPD e segurança
- Não colocar dados reais de voluntários em fixtures públicas.
- Não persistir dados pessoais sensíveis no navegador.
- Validar permissões no backend/Firestore Rules, não apenas na interface.
- Documentos privados devem exigir autenticação para leitura.
- Preferir soft-delete onde houver necessidade de rastreabilidade.

## Estrutura alvo sugerida
src/
  app/
  components/
  features/
    dashboard/
    inventory/
    custodies/
    requests/
    nupdecs/
    teams/
    volunteers/
    trainings/
    meetings/
    alerts/
    documents/
    readiness/
    audit/
  lib/firebase/
  repositories/
  services/
  types/
  utils/

## Testes mínimos
- transferir estoque com saldo suficiente;
- bloquear transferência com saldo insuficiente;
- aprovar solicitação e movimentar estoque;
- devolver cautela e recompor saldo;
- restringir Líder NUPDEC ao próprio núcleo;
- impedir perfil Consulta de escrever;
- validar cálculo do índice de prontidão.
