# AGENTS.md — COMPDEC Gestão Integrada

## Missão
Este repositório contém um sistema institucional que poderá tratar dados pessoais. Segurança, rastreabilidade e minimização de dados são requisitos de produto, não opcionais.

## Como o Codex deve trabalhar
1. Se ainda não existir `package-lock.json`, execute `npm install` e `npm --prefix functions install` uma vez e versione os lockfiles. Depois, prefira `npm ci` e `npm --prefix functions ci` para builds reproduzíveis.
2. Execute `npm run typecheck`, `npm run build` e `npm --prefix functions run build` antes de concluir.
3. Nunca adicione segredos, credenciais, dados reais de voluntários ou arquivos pessoais ao Git.
4. Nunca enfraqueça `firestore.rules`, `storage.rules`, App Check, RBAC ou auditoria para "fazer funcionar".
5. Toda operação crítica de estoque, cautela, usuários, auditoria e aprovação deve ocorrer em Cloud Functions/servidor e usar transação quando houver saldo/estado envolvido.
6. Logs nunca devem conter senha, token, CPF, RG, endereço, telefone, data de nascimento ou conteúdo integral de documentos pessoais.
7. Firestore lê documentos inteiros; dados pessoais de maior restrição devem ficar em documentos/coleções separadas dos dados operacionais.
8. Exclusão destrutiva deve ser exceção. Preferir `active=false`, `status=INATIVO` e política de retenção aprovada.
9. Para novos uploads, permitir somente tipos explicitamente autorizados, limitar tamanho, definir caminhos por escopo e validar novamente no backend quando necessário.
10. Não criar "modo admin" por frontend. Autoridade vem de custom claims, Security Rules e IAM.

## Perfis
- SUPER_ADMIN: configuração global e gestão de privilégios máximos.
- GESTOR_COMPDEC: gestão integral da COMPDEC.
- COORDENADOR: operação, NUPDECs, equipes, atividades, documentos e estoque.
- ALMOXARIFADO: estoque, cautelas e solicitações.
- LIDER_NUPDEC: acesso limitado ao próprio NUPDEC.
- CONSULTA: leitura mínima autorizada.

## Requisitos de produção
- Firebase Authentication with Identity Platform.
- E-mail verificado obrigatório.
- MFA TOTP obrigatório para SUPER_ADMIN, GESTOR_COMPDEC, COORDENADOR e ALMOXARIFADO; recomendado para líderes.
- App Check com reCAPTCHA Enterprise e enforcement em Firestore, Storage, Auth e Functions.
- Firestore/Storage Security Rules em deny-by-default.
- IAM de servidor com privilégio mínimo; Admin SDK bypassa Rules.
- Backups, retenção e recuperação testados.
- Alertas de segurança e revisão periódica de acessos.
- SAST/dependency scanning e teste de invasão antes de dados reais.
- Política de privacidade, base legal, finalidade, retenção e processo de atendimento a titulares definidos pelo município/encarregado LGPD.

## Módulos funcionais
Dashboard; estoque por local; QR de materiais; movimentações; cautelas; solicitações/aprovações; NUPDECs; mapa; equipes; voluntários; dados privados do voluntário; treinamentos; reuniões; listas de presença; avisos; documentos; prontidão; auditoria; usuários e perfis.

## Definition of Done
- build frontend e functions sem erro;
- regras não usam `allow read, write: if true`;
- nenhuma chave/segredo novo versionado;
- operações críticas têm autorização + validação + auditoria;
- nenhum log inclui PII desnecessária;
- testes/regressões atualizados quando aplicável.
