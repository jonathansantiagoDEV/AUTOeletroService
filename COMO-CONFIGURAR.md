# Como configurar login e banco de dados (Supabase)

O app agora usa o **Supabase** para autenticação (e-mail/senha e Google) e para guardar
os registros em um banco de dados Postgres na nuvem, em vez do localStorage do navegador.
Cada usuário só vê os próprios registros.

## 1. Crie um projeto no Supabase

1. Acesse https://supabase.com e crie uma conta (é grátis).
2. Clique em "New Project", dê um nome e uma senha para o banco (guarde-a).
3. Aguarde alguns minutos até o projeto ficar pronto.

## 2. Pegue as chaves da API

1. No painel do projeto, vá em **Project Settings > API**.
2. Copie a **Project URL** e a chave **anon public**.
3. Na pasta do projeto, copie o arquivo `.env.local.example` para um novo arquivo `.env.local`.
4. Preencha:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```

## 3. Crie a tabela no banco de dados

1. No painel do Supabase, abra **SQL Editor > New query**.
2. Copie todo o conteúdo do arquivo `supabase/schema.sql` deste projeto e cole lá.
3. Clique em **Run**. Isso cria a tabela `service_records` já com as regras de
   segurança (cada pessoa só acessa os próprios dados).

## 4. Ative o login por e-mail e senha

Isso já vem ativado por padrão no Supabase (**Authentication > Providers > Email**).
Se quiser, você pode desativar a confirmação por e-mail em
**Authentication > Providers > Email > "Confirm email"** para testar mais rápido
(não recomendado em produção).

## 5. Ative o login com Google

1. No painel do Supabase: **Authentication > Providers > Google** e ative.
2. Você vai precisar de um **Client ID** e **Client Secret** do Google:
   - Acesse https://console.cloud.google.com/apis/credentials
   - Crie um "OAuth Client ID" do tipo "Web application".
   - Em "Authorized redirect URIs", adicione a URL que o Supabase mostra na
     própria tela do provedor Google (algo como
     `https://SEU-PROJETO.supabase.co/auth/v1/callback`).
3. Copie o Client ID e o Client Secret gerados pelo Google e cole nos campos
   correspondentes na tela do Supabase, depois salve.

## 6. Rode o projeto

```bash
pnpm install
pnpm dev
```

Acesse `http://localhost:3000`. Você será redirecionado para `/login`. Crie uma
conta com e-mail/senha ou entre com Google. Depois disso, os registros criados
ficam salvos no Supabase, atrelados ao seu usuário.

## 7. Publicando (Vercel, por exemplo)

Ao publicar em produção, adicione as mesmas duas variáveis de ambiente
(`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`) nas configurações
do seu provedor de hospedagem. Se usar login com Google, adicione também a URL
de produção (ex: `https://seuapp.vercel.app/auth/callback`) na lista de
redirecionamentos autorizados, tanto no Google Cloud Console quanto em
**Authentication > URL Configuration** no Supabase.

## Observação sobre as fotos

As fotos continuam sendo guardadas como imagens em base64 dentro do banco
(coluna `photos`, tipo jsonb), igual funcionava no localStorage. Isso funciona
bem para poucas fotos por registro, mas se você notar que os registros ficam
pesados ou lentos, o próximo passo natural é migrar as fotos para o
**Supabase Storage** (armazenamento de arquivos) e guardar só o link da imagem
no banco. Posso te ajudar a fazer essa migração depois, se quiser.
