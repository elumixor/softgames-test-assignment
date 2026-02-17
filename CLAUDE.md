## Code style

- ALWAYS use `??` operator instead of `||` when providing default values, unless you specifically want to treat falsy values (like `0` or `""`) as needing a default.
- Single-statement blocks: Remove braces, keep on one line (e.g., `if (condition) throw error;`)
- Write self-explanatory code, avoid obvious comments - code should clearly express what it does through good naming and structure
- Compact object returns when simple (e.g., `return { inlineData: { mimeType, data } };`)
- Never use `setXXX()`/`getXXX()` methods - use TypeScript getters/setters property accessors instead
- Never add unnecessary `?` optional chaining - if a value is always defined, don't mark it optional
- Don't use `!` - throw a descriptive error instead
- Don't use abbreviations in names - be explicit for clarity (e.g., `message` instead of `msg`, `index` instead of `idx`, `row` instead of `r`, etc.). Exceptions: `i` for loop index, `e` for error in catch block, `x`/`y` for coordinates.
- Use `Promise.withResolvers()` instead of `new Promise()` when you need to expose resolve/reject outside the executor
- Don't define excessive helper interfaces and types - rely more on typescript inference - write minimal, readable code
- Never simply silence errors. Always at least log them to console: `catch (e) { throw new Error("Descriptive message: " + e.message); }`

```typescript
class Example {
  // assign fields directly in declaration when possible
  private readonly field = new Field();

  // assign fields in constructor when initialization requires parameters or logic
  constructor(private readonly dependency: Dependency) {}
}
```

## Other Development Notes

- Never run `dev` script
- Do not run full `build` to check
- Use `ide - getDiagnostics` MCP tool to check issues in the current file
- Run `bun run lint` to check typescript and biome errors and warnings
- Run `bun run format` to format everything after your changes

## @elumixor packages

### `@elumixor/di`

Singleton DI container. Classes as tokens, no decorators.

```typescript
import { di } from "@elumixor/di";
// Decorate class to auto-register on construction:
@di.injectable
class MyService {
  /* ... */
}
new MyService(); // registers singleton
// Retrieve:
const svc = di.inject(MyService);
const maybeSvc = di.inject(MyService, { optional: true }); // returns undefined if not registered
```

### `@elumixor/event-emitter`

Type-safe event emitter. Use instead of passing callbacks for event communication.

```typescript
import { EventEmitter } from "@elumixor/event-emitter";

// Void event (no data):
readonly clicked = new EventEmitter();
this.clicked.emit();

// Typed event:
readonly changed = new EventEmitter<number>();
this.changed.emit(42);

// Subscribe (returns { unsubscribe() }):
const sub = emitter.subscribe((data) => { ... });
sub.unsubscribe();

// One-shot:
emitter.subscribeOnce((data) => { ... });

// Await next emission:
const value = await emitter.nextEvent;
```

### `@elumixor/extensions`

Import side-effect style: `import "@elumixor/extensions";`
Adds Array extensions (`.first`, `.last`, `.isEmpty`, `.shuffle()`, `.pick()`, `Array.range()`), Set extensions, String extensions (`.capitalize()`).

### `@elumixor/frontils`

Utilities: `all()` (typed Promise.all), `assert()`, `delay(seconds)`, `random`, `nonNull()`, `zip()`, `DefaultMap`.
