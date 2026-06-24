declare module '@anthropic-ai/sandbox-runtime' {
  export type SandboxRuntimeConfig = {
    ripgrep?: {
      command?: string
    }
    network: {
      allowedDomains?: string[]
      deniedDomains?: string[]
    }
    filesystem: {
      denyRead?: string[]
      allowRead?: string[]
      denyWrite?: string[]
      allowWrite?: string[]
    }
  }

  export class SandboxManager {
    static initialize(config: SandboxRuntimeConfig): Promise<void>
    static wrapWithSandbox(command: string): Promise<string>
    static reset(): Promise<void>
    static cleanup(): Promise<void>
  }
}
