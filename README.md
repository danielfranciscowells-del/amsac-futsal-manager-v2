# AMSAC Futsal Manager — versão V2.1

Versão escura/amarela baseada no layout de referência e preparada para uso em telemóvel.

## Ficheiros
- `index.html` — estrutura
- `styles.css` — layout preto/amarelo
- `app.js` — funcionalidades
- `config.js` — Supabase público
- `supabase_schema.sql` — tabelas e políticas

## Atualização no GitHub
1. Abrir o repositório `amsac-futsal-manager`.
2. Substituir os ficheiros antigos por estes cinco ficheiros.
3. Remover `v7_overrides.js` ou outros overrides antigos.
4. Fazer Commit diretamente na branch `main`.
5. Aguardar o deployment do Vercel ficar `Ready`.

## Supabase
Executar todo o `supabase_schema.sql` no SQL Editor do Supabase. A versão V2.1 usa também a tabela `team_spaces` para sincronização por código entre treinador e adjuntos.

A `config.js` já está preparada com a URL e a Publishable key fornecidas pelo treinador. Nunca colocar uma `service_role` key no frontend.

## Partilha com adjuntos
1. Abrir Configurações.
2. Carregar `Gerar código`.
3. Enviar o código aos adjuntos.
4. No dispositivo do adjunto, abrir Configurações → `Entrar com código`.
5. Depois de entrar no mesmo espaço, os dados são sincronizados através do Supabase.

## Fotografias
Os campos de fotografia usam `input type=file` com `accept=image/*`, permitindo escolher imagens da galeria do telemóvel.

## Exportação
- `Excel`: gera ficheiro `.xls` compatível com Excel/LibreOffice.
- `PDF`: abre a janela de impressão do dispositivo; escolher `Guardar como PDF`.

## Jogo
- Cronómetro decrescente a partir do tempo escolhido.
- Terminar jogo.
- 5 inicial e 7 suplentes.
- Ao completar o 5 inicial, os primeiros 7 jogadores restantes são colocados automaticamente nos suplentes.
- Cinco cartões representam os jogadores em campo para seleção rápida de estatística.
- Remate abre a baliza 3x3 para escolher zona.
- Golos: marcador, assistência, motivo e zona.
- Sistemas 4x5, 5x4, 4x3 e 3x4 acumulam tempo automaticamente.
