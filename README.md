# Murev Acompanha — Vite + React + Firebase (FASE 3)

## Rodar
```
npm install
npm run dev
```

## IMPORTANTE: configurar o Firebase
Leia o arquivo SETUP_FIREBASE.md (passo a passo completo).
Sem configurar, o app roda em modo demo (dados somem ao recarregar).
Com o Firebase configurado: login real + dados salvos + painel admin.

## O que a Fase 3 adiciona
- [x] Login e cadastro real (Firebase Auth, email/senha)
- [x] Banco de dados (Firestore) — pacientes salvos de verdade
- [x] Cada médico só vê os PRÓPRIOS pacientes (isolamento por conta)
- [x] Security Rules (firestore.rules) protegendo os dados
- [x] Painel admin restrito ao seu email:
      - lista todos os usuários
      - define plano de cada um (mensal/trimestral/anual/vitalício)
      - mostra receita gerada por usuário e total
- [x] Config da clínica salva no perfil do usuário

## Fases
- [x] FASE 1 — Fundação
- [x] FASE 2 — Telas + bugs corrigidos
- [x] FASE 3 — Firebase (banco + login + admin)  ← VOCÊ ESTÁ AQUI
- [ ] FASE 4 — Refinos finais / LP (a combinar)
