import { concursosIniciais } from "../data/concursos.js";

export async function buscarConcursos() {
  // Futuramente, conecte aqui uma API ou fonte oficial confiável.
  // A interface recebe sempre uma lista, independentemente da origem dos dados.
  return concursosIniciais;
}
