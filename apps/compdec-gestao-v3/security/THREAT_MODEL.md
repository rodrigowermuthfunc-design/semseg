# Modelo de ameaças — COMPDEC Gestão Integrada

## Ativos protegidos
- identidade e credenciais dos usuários;
- dados pessoais de voluntários;
- contatos, endereços e documentos privados;
- localização e composição das NUPDECs;
- estoque, cautelas e histórico de movimentações;
- atas, termos, relatórios e certificados;
- trilha de auditoria.

## Ameaças principais e controles
1. **Conta comprometida** — e-mail verificado, MFA em produção, sessão Firebase, revisão periódica de usuários e menor privilégio.
2. **Escalada de privilégio pelo frontend** — custom claims + Security Rules + Cloud Functions; interface nunca é a autoridade final.
3. **IDOR / acesso a outro NUPDEC** — `nupdecId` no token e validação tanto em Rules quanto Functions.
4. **Fraude de estoque** — saldo e estado alterados somente por Cloud Functions transacionais; cliente não escreve `stockBalances` nem `stockMovements`.
5. **Apagamento de evidência** — `auditLogs` e movimentos são append-only para clientes; exclusões destrutivas bloqueadas.
6. **Vazamento por logs** — sanitização de metadados; proibição de senha, token, CPF, RG, telefone, endereço e data de nascimento em logs.
7. **Upload malicioso** — extensão não é suficiente: regras limitam MIME e 10 MB; produção deve adicionar verificação de conteúdo/malware antes de disponibilizar anexos de origem externa.
8. **Cliente não autorizado consumindo backend** — Firebase App Check com reCAPTCHA Enterprise e enforcement.
9. **Configuração incorreta do Admin SDK** — IAM de menor privilégio e contas de serviço separadas; bibliotecas de servidor ignoram Security Rules.
10. **Exposição acidental no Git** — `.env*` ignorado; nenhum dado pessoal, exportação Firestore, chave privada ou service-account JSON no repositório.

## Risco residual
Nenhuma aplicação é invulnerável. A entrada em produção exige teste independente, revisão IAM, revisão LGPD, política de incidentes, backups e treinamento de usuários.
