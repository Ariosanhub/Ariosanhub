// Baseado no Mood Meter (RULER, Yale Center for Emotional Intelligence — Marc Brackett):
// duas dimensões, energia (ativação) e agrado (valência), formando 4 quadrantes.

export type MoodQuadrant = {
  key: string;
  label: string;
  color: string;
  emotions: string[];
};

export const MOOD_QUADRANTS: MoodQuadrant[] = [
  {
    key: "alta_agradavel",
    label: "Energia alta · agradável",
    color: "#f2c14e",
    emotions: ["Animado", "Entusiasmado", "Orgulhoso", "Motivado", "Alegre"],
  },
  {
    key: "alta_desagradavel",
    label: "Energia alta · desagradável",
    color: "#f0715f",
    emotions: ["Ansioso", "Irritado", "Frustrado", "Estressado", "Com raiva"],
  },
  {
    key: "baixa_agradavel",
    label: "Energia baixa · agradável",
    color: "#6be675",
    emotions: ["Tranquilo", "Satisfeito", "Relaxado", "Grato", "Sereno"],
  },
  {
    key: "baixa_desagradavel",
    label: "Energia baixa · desagradável",
    color: "#5f8ff0",
    emotions: ["Cansado", "Triste", "Desanimado", "Entediado", "Sobrecarregado"],
  },
];

export const ALL_EMOTIONS = MOOD_QUADRANTS.flatMap((q) =>
  q.emotions.map((e) => ({ emotion: e, quadrant: q.key, color: q.color }))
);

export const MOOD_FACTORS = [
  "Trabalho",
  "Chefe / liderança",
  "Liderados",
  "Sono",
  "Exercício",
  "Relacionamento",
  "Família",
  "Dinheiro",
  "Saúde",
  "Estudo / desenvolvimento",
];

export const MOOD_SCALE: { score: number; label: string; emoji: string }[] = [
  { score: 1, label: "Muito ruim", emoji: "😞" },
  { score: 2, label: "Ruim", emoji: "🙁" },
  { score: 3, label: "Neutro", emoji: "😐" },
  { score: 4, label: "Bom", emoji: "🙂" },
  { score: 5, label: "Muito bom", emoji: "😄" },
];

export function moodColorForScore(score: number) {
  if (score <= 1) return "#f0715f";
  if (score === 2) return "#f0a15f";
  if (score === 3) return "#f2c14e";
  if (score === 4) return "#a3e66b";
  return "#6be675";
}
