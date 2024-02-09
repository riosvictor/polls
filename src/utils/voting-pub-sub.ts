type Message = { pollOptionId: string, votes: number};
type Subscriber = (message: Message) => void;

export class VotingPubSub {
  private readonly _channels: Record<string, Subscriber[]> = {};

  subscribe(pollId: string, subscriber: Subscriber) {
    if (!this._channels[pollId]) {
      this._channels[pollId] = [];
    }

    this._channels[pollId].push(subscriber);
  }

  publish(pollId: string, message: Message) {
    if (!this._channels[pollId]) {
      return;
    }

    this._channels[pollId].forEach(subscriber => {
      subscriber(message);
    });
  }
}

export const voting = new VotingPubSub();
