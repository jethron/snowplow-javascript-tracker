declare module 'eventsourcemock' {
  const EventSource: (typeof global)['EventSource'];

  export const sources: Partial<
    Record<
      string,
      InstanceType<typeof EventSource> & {
        emit(eventName: string, event?: Event): void;
        emitOpen(): void;
        emitMessage(message: any): void;
        emitError(error: Error): void;
      }
    >
  >;
  export default EventSource;
}
