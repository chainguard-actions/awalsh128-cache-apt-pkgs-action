import winston from "winston";
/**
 * Manages artifact creation and upload.
 */
export declare class Artifacts {
    /** Directory that all the artifacts are stored. */
    readonly dir: string;
    /** Filenames of monitored artifacts. */
    readonly artifactFilenames: string[];
    /** Whether debug is enabled which affects artifacts otherwise not. */
    readonly debug: boolean;
    /** Unique runner ID of the GitHub Action workflow run. */
    readonly runId: string;
    constructor(
    /** Directory that all the artifacts are stored. */
    dir: string, 
    /** Filenames of monitored artifacts. */
    artifactFilenames: string[], 
    /** Whether debug is enabled which affects artifacts otherwise not. */
    debug?: boolean, 
    /** Unique runner ID of the GitHub Action workflow run. */
    runId?: string);
    /** Upload artifacts to GitHub Actions via [@actions/artifact]. */
    /**
     * Artifact name, unique per action step in a workflow run.
     *
     * Artifact names must be unique within a run, and every job (or step) using
     * the action uploads one, so include the attempt, job and step IDs.
     */
    get name(): string;
    upload(): Promise<string>;
}
/** Container for all instrumentation: telemetry, logging, and artifacts generated */
export declare class Instruments {
    /** Cache directory name where all artifacts are stored, including cached packages. */
    readonly cacheDir: string;
    /** Absolute path of the cache directory (i.e. under the home directory). */
    readonly cacheDirPath: string;
    /** Whether debug is enabled which affects artifacts otherwise not. */
    readonly debug: boolean;
    /** Manages artifact creation and upload.  */
    readonly artifacts: Artifacts;
    /** Logger used for GitHub Actions integration. */
    readonly appLogger: winston.Logger;
    /** Logger used for command line execution. */
    readonly execLogger: winston.Logger;
    constructor(cacheDir: string, debug: boolean, artifacts?: Artifacts);
}
//# sourceMappingURL=instrumentation.d.ts.map