# Tarefa inicial para o Codex

Trabalhe na branch `codex/compdec-secure-v3` e siga `AGENTS.md`.

1. Instale dependências no app e em `functions/`.
2. Rode `npm run typecheck`, `npm run build` e `npm --prefix functions run build`.
3. Corrija qualquer erro de TypeScript/dependência sem enfraquecer regras de segurança.
4. Rode `npm run test:rules` com os emuladores.
5. Revise os módulos: dashboard, estoque, QR, cautelas, solicitações, NUPDECs/mapa, equipes, voluntários, treinamentos, reuniões, avisos, documentos, prontidão, auditoria e usuários.
6. Implemente os fluxos ainda incompletos de UX, mantendo todas as mutações sensíveis no backend.
7. Crie testes adicionais de autorização para cada perfil.
8. Faça revisão de dependências e segurança e registre achados em `security/SECURITY_REVIEW.md`.
9. Não use dados pessoais reais nem segredos.
10. Ao finalizar, abra um PR para `main` com evidências dos testes executados.
