# Configurar o Firebase — Murev Acompanha (FASE 3)

Sem isto, o app roda em modo demo (dados na memória). Com isto, tudo salva de verdade.

## 1. Criar o projeto
1. Acesse https://console.firebase.google.com
2. "Adicionar projeto" → dê um nome (ex: murev-acompanha) → criar

## 2. Ativar Authentication (login)
1. No menu lateral: Build > Authentication > "Get started"
2. Aba "Sign-in method" > ative "Email/senha" > salvar

## 3. Ativar Firestore (banco)
1. Build > Firestore Database > "Criar banco de dados"
2. Escolha modo de produção > região (southamerica-east1 = São Paulo)
3. Em "Regras", cole o conteúdo do arquivo `firestore.rules` deste projeto > Publicar

## 4. Pegar as chaves
1. Engrenagem (Configurações do projeto) > "Seus apps" > ícone Web </>
2. Registre o app > copie os valores do firebaseConfig

## 5. Preencher o .env
1. Renomeie `.env.example` para `.env`
2. Cole cada valor do firebaseConfig nas variáveis VITE_FIREBASE_*
3. Confirme VITE_ADMIN_EMAIL=souzasoaresgabrie9@gmail.com

## 6. Criar SUA conta de admin
1. Rode `npm run dev`
2. Na tela de login, clique "Criar conta"
3. Use o email souzasoaresgabrie9@gmail.com e a SENHA QUE VOCÊ ESCOLHER
   (a senha é definida por você aqui; fica criptografada no Firebase, nunca no código)
4. Ao entrar com esse email, você cai direto no PAINEL ADMIN

## Como funciona o acesso
- Qualquer médico cria conta com email/senha → entra no app normal e vê só os pacientes dele
- Você (email de admin) → entra e vê o PAINEL ADMIN (todos os usuários, planos, receita)
- Ninguém com outro email acessa o painel admin, mesmo sabendo a senha de outra conta

## Sobre "chaves expostas"
As chaves VITE_FIREBASE_* aparecem no navegador — isso é normal e seguro no Firebase.
Quem protege os dados são as Security Rules (firestore.rules), não esconder a chave.
Cada médico só acessa os próprios dados; ninguém vê os pacientes de outro.
