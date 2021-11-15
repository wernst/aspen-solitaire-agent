export const RED_SUITS = ['HEART', 'DIAMOND'] as const;
export const BLACK_SUITS = ['CLUB', 'SPADE'] as const;
export const SUITS = [...RED_SUITS, ...BLACK_SUITS] as const;
export type Suit = typeof SUITS[number];

export const PILE_LOCATIONS = [
  'PILE0',
  'PILE1',
  'PILE2',
  'PILE3',
  'PILE4',
  'PILE5',
  'PILE6',
] as const;
type PileLocations = typeof PILE_LOCATIONS[number];

export const FOUNDATION_LOCATIONS = [
  'FOUNDATION_HEARTS',
  'FOUNDATION_DIAMONDS',
  'FOUNDATION_CLUBS',
  'FOUNDATION_SPADES',
] as const;
type FoundationLocations = typeof FOUNDATION_LOCATIONS[number];

export const DECK_LOCATIONS = ['DECK_TURNED', 'DECK_UNTURNED'] as const;
type DeckLocations = typeof DECK_LOCATIONS[number];

export type BoardLocation = DeckLocations | FoundationLocations | PileLocations;

export interface Card {
  suit: Suit;
  value: number;
  display: string;
  upturned: boolean;
}

export interface Deck {
  turned: Card[];
  unturned: Card[];
}

export type Foundations = {
  [K in Suit]: Card[];
};

export interface Game {
  id: string;
  deck: Deck;
  foundations: Foundations;
  piles: [Card[], Card[], Card[], Card[], Card[], Card[], Card[]];
}
