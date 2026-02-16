import { di } from "@elumixor/di";
import { App } from "@services/app";
import type { Ticker } from "pixi.js";

export function delay(seconds: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  const app = di.inject(App);
  let elapsed = 0;

  const onTick = (ticker: Ticker): void => {
    elapsed += ticker.elapsedMS / 1000;

    if (elapsed >= seconds) {
      app.ticker.remove(onTick);
      resolve();
    }
  };

  app.ticker.add(onTick);

  return promise;
}
