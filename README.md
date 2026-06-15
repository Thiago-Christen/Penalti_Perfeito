# Pênalti Perfeito

Jogo casual feito em **p5.js + JavaScript**.  
O objetivo é marcar o maior número de gols possível enquanto sobe de fase e administra suas vidas.

## Integrantes
- Thiago Soares
- Gabriel Quadros

## Descrição
Você controla a cobrança do pênalti com **clique, arraste e solte**.  
O jogo começa na tela inicial, possui **tela de sobre**, passa para a partida e termina em **game over** quando as vidas acabam.

### Progressão
- A cada 3 gols, o jogador sobe de fase.
- O goleiro fica mais rápido conforme a fase aumenta.
- O placar, as vidas e a fase ficam sempre visíveis na tela.

### Imagens usadas
- `jogador.png`
- `jogador_chutando.png`
- `goleiro.png`
- `goleiro_pulando.png`
- `bola.png`

### Áudios configurados
O jogo está preparado para procurar os seguintes arquivos em `assets/sounds/`:
- `chute.mp3`
- `gol.mp3`
- `defesa.mp3`
- `derrota.mp3`
- `fundo.mp3`

Caso você adicione esses arquivos nessa pasta, os sons serão ativados automaticamente.

## Como usar
1. Abra o arquivo `index.html` no navegador.
2. Na tela inicial, clique em **JOGAR** ou abra a tela **SOBRE**.
3. Clique na bola, arraste para cima e solte para chutar.
4. Tente marcar o máximo de gols sem perder todas as vidas.

## Requisitos atendidos
- Feito em **p5.js** e **JavaScript**
- Possui **menu de abertura**
- Possui **tela de sobre**
- Possui **pontuação, vidas e fases**
- Usa **imagens** para jogador, goleiro e bola
- Está preparado para **sons** de chute, gol, defesa, derrota e fundo
- Código organizado em funções e com uma classe auxiliar
- Projeto pronto para envio no GitHub

## Estrutura
- `index.html`
- `style.css`
- `sketch.js`
- `README.md`
- `jogador.png`
- `jogador_chutando.png`
- `goleiro.png`
- `goleiro_pulando.png`
- `bola.png`

