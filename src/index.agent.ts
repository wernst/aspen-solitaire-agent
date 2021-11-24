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
    game: {
      initialize: (game?: Game) => {
        return game ?? undefined;
      },
      reducer: (
        game: Game,
        event: Log<GameStartedMessage | TurnCardMessage | MoveCardMessage>,
      ) => {
        if (event.data.type === 'GAME_STARTED') {
          game = event.data.game;
        }

        if (event.data.type === 'TURN_CARD') {
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

        return game;
      },
      serialize: (game: Game) => {
        return game;
      },
    },
    games: {
      initialize: (games?: string[]) => {
        return games ?? [];
      },
      reducer: (games: string[], event: Log<GameStartedMessage>) => {
        if (event.data.type === 'GAME_STARTED') {
          games.push(event.data.game.id);
        }

        return games;
      },
      serialize: (games: string[]) => {
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
      const game = await aspen.getAggregation('game', {
        range: 'continuous',
        tags: {
          gameId: id,
        },
      });
      return game;
    },
  },
  actions: {
    startGame: async (args, aspen) => {
      const game = newGame();
      await aspen.pushEvent<GameStartedMessage>(
        'GAME_STARTED',
        {
          game,
        },
        {
          gameId: game.id,
        },
      );
      return game.id;
    },
    turnCard: async (args: TurnCardActionParams, aspen) => {
      await aspen.pushEvent<TurnCardMessage>(
        'TURN_CARD',
        {
          ...args,
        },
        {
          gameId: args.gameId,
        },
      );
      return 'card turned';
    },
    moveCard: async (args: MoveCardActionParams, aspen) => {
      await aspen.pushEvent<MoveCardMessage>(
        'MOVE_CARD',
        {
          ...args,
        },
        {
          gameId: args.gameId,
        },
      );
      return 'card moved';
    },
  },
};

export default agent;
