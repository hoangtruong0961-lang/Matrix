import { WorldBook } from "../types/world-book";

// Dummies until we know the structure in types.ts for CharacterCardV3
export interface CharacterCardV3 {
  spec: "chara_card_v3";
  data: {
    character_book?: WorldBook;
    [key: string]: any;
  };
}

export function embedWorldBookToCard(
  card: CharacterCardV3,
  worldBook: WorldBook,
): CharacterCardV3 {
  return {
    ...card,
    data: {
      ...card.data,
      character_book: worldBook,
    },
  };
}

export function extractWorldBookFromCard(
  card: CharacterCardV3,
): WorldBook | null {
  return card.data.character_book ?? null;
}
