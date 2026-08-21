export type CognitiveDistortion = {
  key: string;
  label: string;
  description: string;
};

export const COGNITIVE_DISTORTIONS: CognitiveDistortion[] = [
  {
    key: "leitura_mental",
    label: "Leitura mental",
    description: "Presumir o que o outro está pensando sem evidência (\"ele vai achar que sou fraco\").",
  },
  {
    key: "catastrofizacao",
    label: "Catastrofização",
    description: "Antecipar o pior desfecho possível como se fosse o mais provável (\"se eu discordar, vou ser demitido\").",
  },
  {
    key: "tudo_ou_nada",
    label: "Pensamento tudo-ou-nada",
    description: "Ver a situação em extremos, sem meio-termo (\"ou eu aceito tudo, ou vou parecer um problema\").",
  },
  {
    key: "personalizacao",
    label: "Personalização",
    description: "Assumir responsabilidade por algo que não depende só de você.",
  },
  {
    key: "deveria",
    label: "Afirmações de \"deveria\"",
    description: "Regras rígidas sobre como você ou os outros deveriam agir, que geram culpa ou ressentimento.",
  },
  {
    key: "desqualificar_positivo",
    label: "Desqualificar o positivo",
    description: "Minimizar suas conquistas ou capacidades (\"isso não tem mérito, qualquer um faria\").",
  },
  {
    key: "raciocinio_emocional",
    label: "Raciocínio emocional",
    description: "Tratar um sentimento como prova de um fato (\"sinto medo, logo é perigoso me posicionar\").",
  },
  {
    key: "rotulacao",
    label: "Rotulação",
    description: "Resumir-se a um rótulo negativo global a partir de um episódio (\"sou permissivo demais, sempre serei assim\").",
  },
  {
    key: "generalizacao",
    label: "Generalização excessiva",
    description: "Tirar uma regra geral de um único evento (\"da última vez que me impus deu errado, então nunca vai dar certo\").",
  },
  {
    key: "filtro_mental",
    label: "Filtro mental",
    description: "Focar só nos detalhes negativos e ignorar o contexto completo.",
  },
];
