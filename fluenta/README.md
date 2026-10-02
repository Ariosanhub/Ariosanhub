# Fluenta — escola de idiomas com IA

Você responde um questionário, a IA entende seu nível, seu trabalho e sua rotina, e monta um plano diário com um tutor que conversa com você até a fluência.

## O que o MVP faz

| Módulo | Como funciona |
|---|---|
| **Questionário** (7 passos) | Idioma-alvo e nativo, nível autodeclarado, **mini teste de nivelamento** (5 questões A1→B2), objetivo, profissão, interesses, rotina (horário em que acorda, melhor momento para estudar, minutos/dia, "tempo morto"), estilo e prazo |
| **Plano personalizado** | A IA gera 4 semanas com tema semanal; cada dia tem aula ou conversa com cenário tirado da rotina real do aluno |
| **Hoje** | Tarefa do dia, sequência de dias (streak), minutos praticados, palavras e correções, faixa da semana |
| **Cronograma** | Grade de 4 semanas por cor (aula, conversa, revisão), marcando dia atual e dias concluídos |
| **Tutor de conversação** | Chat por texto **ou voz** (reconhecimento de fala + leitura em voz alta), correções na hora, tradução sob demanda, vocabulário novo. 6 mensagens = meta do dia |
| **Revisão semanal** | Todo domingo: quiz gerado com **os erros e palavras reais da semana** + desafio final de conversa |
| **Palavras** | Caderno de vocabulário montado automaticamente a partir das conversas |

## Rodar localmente

```bash
cd fluenta
npm install
export ANTHROPIC_API_KEY=sk-ant-...   # sem a chave, roda em MODO DEMO com respostas simuladas
npm start                             # http://localhost:3000
```

Variáveis opcionais: `PORT` (padrão 3000) e `FLUENTA_MODEL` (padrão `claude-opus-5-5`).

## Arquitetura

```
fluenta/
├── server.mjs        # Node puro: serve /public + 3 endpoints de IA
└── public/
    ├── index.html
    ├── styles.css    # design system (paleta pastel + ícones pretos + serifa)
    ├── icons.js      # pictogramas SVG
    └── app.js        # SPA: questionário, hoje, cronograma, chat, revisão, palavras
```

- **IA**: SDK oficial da Anthropic, com saída estruturada (JSON Schema) para que plano, correções e quiz cheguem sempre no formato certo. Conversa usa esforço `low` (resposta rápida); plano e revisão usam `medium`.
- **Fallback de recusa** ativado (`fallbacks: "default"`): se o filtro de segurança recusar uma mensagem, a API refaz a chamada em outro modelo automaticamente.
- **Dados**: `localStorage` no navegador do aluno (suficiente para validar). Não há login nem cobrança ainda.

## Paleta

| Token | Cor | Uso |
|---|---|---|
| `--mint` | `#d5ebcb` | conversa, mensagens do tutor |
| `--cream` | `#fce8b6` | aulas, correções |
| `--sky` | `#cfe2f8` | cenários, explicações |
| `--plum` | `#5f4c5e` | revisão semanal |
| `--navy` | `#1f2a44` | destaque escuro |
| `--salmon` | `#fab9a8` | marca, voz ativa |

## Próximos passos (em ordem de impacto)

1. **Supabase**: login (magic link) + tabelas `profiles`, `plans`, `messages`, `vocab`, `reviews`, com RLS. Os dados saem do navegador.
2. **Cobrança**: Stripe Checkout (internacional) ou Mercado Pago/Pix (Brasil); bloquear o chat após 7 dias de teste.
3. **Limite de uso e custo**: limite de mensagens por usuário/dia e cache de prompt no system do tutor.
4. **Internacionalizar a interface** (EN/ES) quando o canal no Brasil estiver validado.
5. **Retenção**: lembrete diário (e-mail/push) no horário de estudo escolhido no questionário.
