import { Agent, Log } from '@aspen.cloud/agent-typings';
import {
  newGame,
  getCardStackRef,
  isMoveLegal,
  isPileLocation,
} from './game-helpers';
import { Game } from './types/game';
import {
  GameStartedMessage,
  TurnCardMessage,
  TurnCardActionParams,
  MoveCardMessage,
  MoveCardActionParams,
} from './types/messages';

const agent: Agent = {
  aggregations: {
    games: {
      initialize: (games?: Game[]) => {
        return games ?? [];
      },
      reducer: (
        games: Game[],
        event: Log<GameStartedMessage | TurnCardMessage | MoveCardMessage>,
      ) => {
        if (event.data.type === 'GAME_STARTED') {
          games.push(event.data.game);
        }

        if (event.data.type === 'TURN_CARD') {
          const { gameId } = event.data;
          const game = games.find((g) => g.id === gameId);
          if (game)
            if (game.deck.unturned.length) {
              const card = game.deck.unturned.pop()!;
              card.upturned = true;
              game.deck.turned = [...game.deck.turned, card];
            } else {
              game.deck.unturned = game.deck.turned
                .reverse()
                .map((card) => ({ ...card, upturned: false }));
              game.deck.turned = [];
            }
        }

        if (event.data.type === 'MOVE_CARD') {
          const { gameId } = event.data;
          const game = games.find((g) => g.id === gameId);
          if (game) {
            const { from, to } = event.data;
            const fromCardsRef = getCardStackRef(game, from);
            const fromIndex = event.data.fromIndex ?? fromCardsRef.length - 1;
            const toCardsRef = getCardStackRef(game, to);
            const toIndex = event.data.toIndex ?? toCardsRef.length - 1;

            if (
              isMoveLegal(
                from,
                fromIndex,
                fromCardsRef,
                to,
                toIndex,
                toCardsRef,
              )
            ) {
              const cards = fromCardsRef.splice(
                fromIndex,
                fromCardsRef.length - fromIndex,
              );
              cards.forEach((card) => toCardsRef.push(card));

              if (isPileLocation(from) && fromCardsRef.length) {
                fromCardsRef[fromCardsRef.length - 1].upturned = true;
              }
            }
          }
        }

        return games;
      },
      serialize: (games: Game[]) => {
        return games;
      },
    },
  },
  views: {
    games: async (params, aspen) => {
      return await aspen.getAggregation('games', { range: 'continuous' });
    },
    game: async (params, aspen) => {
      const { id } = params;
      const games = await aspen.getAggregation('games', {
        range: 'continuous',
      });
      return games.find((g: Game) => g.id === id);
    },
  },
  actions: {
    startGame: async (args, aspen) => {
      const game = newGame();
      await aspen.appendToLog<GameStartedMessage>({
        type: 'GAME_STARTED',
        game,
      });
      return game.id;
    },
    turnCard: async (args: TurnCardActionParams, aspen) => {
      await aspen.appendToLog<TurnCardMessage>({
        type: 'TURN_CARD',
        ...args,
      });
      return 'card turned';
    },
    moveCard: async (args: MoveCardActionParams, aspen) => {
      await aspen.appendToLog<MoveCardMessage>({
        type: 'MOVE_CARD',
        ...args,
      });
      return 'card moved';
    },
  },
};

export default agent;
