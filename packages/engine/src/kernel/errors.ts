/** An engine invariant was broken: a bug in a component or in the engine, never a user mistake. */
export class SimInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimInvariantError";
  }
}
