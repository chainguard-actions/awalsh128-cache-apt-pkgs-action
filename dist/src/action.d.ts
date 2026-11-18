import { type CommandRunner } from "ts-apt";
import { Cache } from "./cache.js";
import winston from "winston";
type EmptyPackageBehavior = "error" | "warn" | "ignore";
/** Inputs accepted by the GitHub Action runtime. */
export interface ActionInputs {
    readonly packages: string;
    readonly version: string;
    readonly executeInstallScripts: boolean;
    readonly emptyPackagesBehavior: EmptyPackageBehavior;
    readonly debug: boolean;
}
/** Outputs emitted by the GitHub Action runtime. */
export interface ActionOutputs {
    readonly cacheHit: boolean;
    readonly packageVersionList: string;
    readonly allPackageVersionList: string;
}
/** Orchestrates package normalization, cache restore/save, install, and outputs. */
export declare class ActionRunner {
    private readonly cache;
    private readonly commandRunner;
    private readonly logger;
    constructor(cache: Cache, commandRunner: CommandRunner, logger: winston.Logger);
    /**
     * Converts package names into the action output CSV format.
     *
     * Arch is shown only for foreign-arch packages (e.g. `libc6:i386=2.39`), so
     * native output matches the v1 format while multi-arch installs stay
     * unambiguous. Entries are sorted with `PackageName.compareTo` so the output
     * is stable across install order.
     *
     * @param packageNames Installed package names.
     * @param nativeArch Runner architecture as reported by dpkg (e.g. amd64).
     * @returns Comma-delimited name[:arch]=version list.
     */
    private toCsv;
    /**
     * Executes the end-to-end action flow and returns action outputs.
     *
     * @param inputs Validated action inputs.
     * @returns Action outputs consumed by the workflow runtime.
     */
    runAction(inputs: ActionInputs): Promise<ActionOutputs>;
}
/**
 * Public entrypoint used by src/index.ts and tests.
 *
 * @param inputs Validated action inputs.
 * @param commandRunner Command runner used by package operations.
 * @param logger Logger instance used for command and restore diagnostics.
 * @returns Action outputs consumed by the workflow runtime.
 */
export declare function runAction(inputs: ActionInputs, commandRunner: CommandRunner, cache: Cache, logger: winston.Logger): Promise<ActionOutputs>;
export {};
//# sourceMappingURL=action.d.ts.map