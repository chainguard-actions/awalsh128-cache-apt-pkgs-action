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
     * Applies `empty_packages_behavior` when the package list is empty, which includes a list that only had
     * separators (e.g. commas). Nothing is restored, installed or cached.
     *
     * @param behavior What to do about the empty list.
     * @returns Empty outputs, for `warn` and `ignore`.
     * @throws Error for `error`.
     */
    private handleEmptyPackages;
    /**
     * Runs a step and logs how long it took, so a slow run shows which step was slow without debug logging.
     *
     * @param label Name of the step, as it should read in the log.
     * @param work The step to run.
     * @returns What the step returns.
     */
    private timed;
    /**
     * Executes the end-to-end action flow and returns action outputs.
     *
     * @param inputs Validated action inputs.
     * @returns Action outputs consumed by the workflow runtime.
     */
    runAction(inputs: ActionInputs): Promise<ActionOutputs>;
    /**
     * Adds the requested packages apt didn't report, because they were already installed.
     *
     * apt prints no `Inst` or `Setting up` line for a package that is already installed at the requested
     * version (e.g. one the runner image ships), so the install output alone would leave it out of the
     * cache. A requested package that isn't installed under its own name is left out, since apt can satisfy
     * it with a provider (e.g. a virtual package).
     *
     * @param installManager Package manager used for the install.
     * @param packageNames Packages the workflow requested.
     * @param reported Packages apt reported installing.
     * @returns `reported`, followed by each already-installed requested package.
     */
    private addAlreadyInstalled;
    /**
     * Builds the action outputs from the installed packages.
     *
     * @param cacheHit Whether the packages came from the cache.
     * @param entries Installed packages, from the manifest.
     * @param packageNames Packages the workflow requested.
     * @param nativeArch Runner architecture as reported by dpkg (e.g. amd64).
     * @returns Action outputs consumed by the workflow runtime.
     */
    private toOutputs;
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