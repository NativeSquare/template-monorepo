import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { getFunctionName, type FunctionReference } from "convex/server";
import type { ReactElement, ReactNode } from "react";

type FunctionImpl = (args: Record<string, unknown>) => unknown;

/**
 * A fake stand-in for `ConvexReactClient` (Method 2 from the Convex testing
 * guide). It implements the small surface that `<ConvexProvider>` consumers
 * (`useQuery`, `useMutation`, `useAction`) rely on, so components that use
 * Convex hooks can be rendered in tests without hitting the network.
 *
 * Register fake implementations per function reference:
 *
 * ```ts
 * const client = new ConvexReactClientFake();
 * client.registerQueryFake(api.table.admin.currentAdmin, () => ({ name: "Ada" }));
 * ```
 */
export class ConvexReactClientFake {
  private queries = new Map<string, FunctionImpl>();
  private mutations = new Map<string, FunctionImpl>();
  private actions = new Map<string, FunctionImpl>();
  private listeners = new Set<() => void>();

  registerQueryFake(
    query: FunctionReference<"query">,
    impl: FunctionImpl,
  ): this {
    this.queries.set(getFunctionName(query), impl);
    return this;
  }

  registerMutationFake(
    mutation: FunctionReference<"mutation">,
    impl: FunctionImpl,
  ): this {
    this.mutations.set(getFunctionName(mutation), impl);
    return this;
  }

  registerActionFake(
    action: FunctionReference<"action">,
    impl: FunctionImpl,
  ): this {
    this.actions.set(getFunctionName(action), impl);
    return this;
  }

  /** Used by `useQuery` (via `ConvexProvider`). */
  watchQuery(
    query: FunctionReference<"query">,
    args?: Record<string, unknown>,
  ) {
    const name = getFunctionName(query);
    return {
      localQueryResult: () => {
        const impl = this.queries.get(name);
        if (!impl) {
          throw new Error(
            `Unexpected query: ${name}. Try registering it with registerQueryFake().`,
          );
        }
        return impl(args ?? {});
      },
      onUpdate: (callback: () => void) => {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
      },
      journal: () => undefined,
    };
  }

  /** Used by `useMutation` (via `ConvexProvider`). */
  async mutation(
    mutation: FunctionReference<"mutation">,
    args?: Record<string, unknown>,
  ): Promise<unknown> {
    const name = getFunctionName(mutation);
    const impl = this.mutations.get(name);
    if (!impl) {
      throw new Error(
        `Unexpected mutation: ${name}. Try registering it with registerMutationFake().`,
      );
    }
    return impl(args ?? {});
  }

  /** Used by `useAction` (via `ConvexProvider`). */
  async action(
    action: FunctionReference<"action">,
    args?: Record<string, unknown>,
  ): Promise<unknown> {
    const name = getFunctionName(action);
    const impl = this.actions.get(name);
    if (!impl) {
      throw new Error(
        `Unexpected action: ${name}. Try registering it with registerActionFake().`,
      );
    }
    return impl(args ?? {});
  }

  /** Notify all subscribed `useQuery` hooks that query results changed. */
  notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  async close(): Promise<void> {
    this.listeners.clear();
  }
}

export interface RenderWithConvexOptions extends RenderOptions {
  /** The fake Convex client to back the `<ConvexProvider>` with. */
  client?: ConvexReactClientFake;
}

export interface RenderWithConvexResult extends RenderResult {
  /** The fake client backing the rendered tree. */
  client: ConvexReactClientFake;
}

/**
 * Renders `ui` wrapped in a `<ConvexProvider>` backed by a
 * `ConvexReactClientFake`, so components using Convex hooks work in tests.
 *
 * An optional `wrapper` is composed inside the provider, and the fake
 * `client` is returned for further interaction or assertions.
 */
export function renderWithConvex(
  ui: ReactElement,
  {
    client = new ConvexReactClientFake(),
    wrapper: InnerWrapper,
    ...renderOptions
  }: RenderWithConvexOptions = {},
): RenderWithConvexResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ConvexProvider client={client as unknown as ConvexReactClient}>
        {InnerWrapper ? <InnerWrapper>{children}</InnerWrapper> : children}
      </ConvexProvider>
    );
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });
  return { ...result, client };
}
