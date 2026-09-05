import type { PlayerController } from "./player-controller";

export interface AiController extends PlayerController {
  readonly kind: "ai";
  readonly implementationId: string;
  readonly version: string;
}

export type AiControllerFactory = (id: string, name: string) => AiController;

export interface AiProviderRegistration {
  id: string;
  name: string;
  version: string;
  create: AiControllerFactory;
}

export class AiProviderRegistry {
  private readonly providers = new Map<string, AiProviderRegistration>();

  register(provider: AiProviderRegistration): () => void {
    if (this.providers.has(provider.id))
      throw new Error(`AI provider ${provider.id} is registered.`);
    this.providers.set(provider.id, provider);
    return () => this.providers.delete(provider.id);
  }

  list(): readonly AiProviderRegistration[] {
    return [...this.providers.values()];
  }

  create(providerId: string, controllerId: string, name: string): AiController {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error("AI engine not installed.");
    return provider.create(controllerId, name);
  }
}

export const aiProviderRegistry = new AiProviderRegistry();
