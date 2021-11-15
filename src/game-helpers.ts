import {
  Card,
  RED_SUITS,
  BLACK_SUITS,
  SUITS,
  Game,
  BoardLocation,
  PILE_LOCATIONS,
  Suit,
  FOUNDATION_LOCATIONS,
} from './types/game';
import { guidGenerator } from './utils';

const cardDisplays = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];

const unshuffledDeck = SUITS.reduce<Card[]>((cards, suit) => {
  return cards.concat(
    cardDisplays.reduce<Card[]>((cards, display, i) => {
      return [
        ...cards,
        {
          suit,
          value: i + 1,
          display,
          upturned: false,
        },
      ];
    }, []),
  );
}, []);

function shuffle(cards: Card[]) {
  const shuffledCards = [...cards];
  let currentIndex = shuffledCards.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [shuffledCards[currentIndex], shuffledCards[randomIndex]] = [
      shuffledCards[randomIndex],
      shuffledCards[currentIndex],
    ];
  }

  return shuffledCards;
}

export function newGame(): Game {
  const shuffledDeck = shuffle(unshuffledDeck);
  const piles: [Card[], Card[], Card[], Card[], Card[], Card[], Card[]] = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
  ];
  for (let i = 0; i < piles.length; i++) {
    let popIndex = i;
    while (popIndex >= 0) {
      const card = shuffledDeck.pop()!;
      if (popIndex === 0) card.upturned = true;
      piles[i].push(card);
      popIndex--;
    }
  }
  return {
    id: guidGenerator(),
    deck: {
      unturned: shuffledDeck,
      turned: [],
    },
    foundations: {
      HEART: [],
      DIAMOND: [],
      CLUB: [],
      SPADE: [],
    },
    piles,
  };
}

export function getCardStackRef(game: Game, location: BoardLocation) {
  switch (location) {
    case 'DECK_TURNED':
      return game.deck.turned;
    case 'DECK_UNTURNED':
      return game.deck.unturned;
    case 'PILE0':
      return game.piles[0];
    case 'PILE1':
      return game.piles[1];
    case 'PILE2':
      return game.piles[2];
    case 'PILE3':
      return game.piles[3];
    case 'PILE4':
      return game.piles[4];
    case 'PILE5':
      return game.piles[5];
    case 'PILE6':
      return game.piles[6];
    case 'FOUNDATION_CLUBS':
      return game.foundations.CLUB;
    case 'FOUNDATION_SPADES':
      return game.foundations.SPADE;
    case 'FOUNDATION_HEARTS':
      return game.foundations.HEART;
    case 'FOUNDATION_DIAMONDS':
      return game.foundations.DIAMOND;
  }
}

export function isPileLocation(location: BoardLocation) {
  return !!PILE_LOCATIONS.find((pileLocation) => pileLocation === location);
}

export function isFoundationLocation(location: BoardLocation) {
  return !!FOUNDATION_LOCATIONS.find(
    (foundationLocation) => foundationLocation === location,
  );
}

const isRed = (suit: Suit) => !!RED_SUITS.find((redSuit) => redSuit === suit);
const isBlack = (suit: Suit) =>
  !!BLACK_SUITS.find((blackSuit) => blackSuit === suit);

function suitIsOppositeColor(suitA: Suit, suitB: Suit) {
  return (isRed(suitA) && isBlack(suitB)) || (isBlack(suitA) && isRed(suitB));
}

export function isMoveLegal(
  from: BoardLocation,
  fromIndex: number,
  fromCards: Card[],
  to: BoardLocation,
  toIndex: number,
  toCards: Card[],
) {
  return (
    isMoveFromLegal(from, fromIndex, fromCards) &&
    isMoveToLegal(from, fromIndex, fromCards, to, toIndex, toCards)
  );
}

function isMoveFromLegal(
  from: BoardLocation,
  fromIndex: number,
  fromCards: Card[],
) {
  if (fromIndex >= fromCards.length) return false;
  const card = fromCards[fromIndex];
  if (isPileLocation(from)) return card.upturned;
  return fromIndex === fromCards.length - 1;
}

function isMoveToLegal(
  from: BoardLocation,
  fromIndex: number,
  fromCards: Card[],
  to: BoardLocation,
  toIndex: number,
  toCards: Card[],
) {
  if (toIndex >= toCards.length) return false;
  if (to === 'DECK_TURNED' || to === 'DECK_UNTURNED') return false;
  // moving more than 1 to non pile
  if (!isPileLocation(from) && fromIndex !== fromCards.length - 1) return false;

  const fromCard = fromCards[fromIndex];
  const toCard = toCards[toIndex];

  // moving to pile
  if (isPileLocation(to)) {
    if (toCards.length)
      return toCard
        ? suitIsOppositeColor(fromCard.suit, toCard.suit) &&
            fromCard.value === toCard.value - 1
        : true;
    return fromCard.value === 13;
  }

  // moving to foundation
  if (isFoundationLocation(to)) {
    const foundationSuit = to.toString().split('_')[1].slice(0, -1);
    return (
      foundationSuit === fromCard.suit &&
      (toCard ? fromCard.value === toCard.value + 1 : fromCard.value === 1)
    );
  }

  return false;
}
