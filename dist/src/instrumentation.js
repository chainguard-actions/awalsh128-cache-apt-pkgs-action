import * as core from "@actions/core";
import { DefaultArtifactClient } from "@actions/artifact";
import winston from "winston";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { CACHE_KEY_FILENAME, MANIFEST_ALL_FILENAME, MANIFEST_MAIN_FILENAME, resolveCacheDir, } from "./cache.js";
const APP_LOG_FILENAME = "capa_app.log";
const EXEC_LOG_FILENAME = "capa_exec.log";
function createStream(filepath) {
    return new winston.transports.Stream({
        stream: fs.createWriteStream(filepath, {
            flags: "a",
        }),
    });
}
/**
 * Manages artifact creation and upload.
 */
export class Artifacts {
    dir;
    artifactFilenames;
    debug;
    runId;
    constructor(
    /** Directory that all the artifacts are stored. */
    dir, 
    /** Filenames of monitored artifacts. */
    artifactFilenames, 
    /** Whether debug is enabled which affects artifacts otherwise not. */
    debug = false, 
    /** Unique runner ID of the GitHub Action workflow run. */
    runId = process.env.GITHUB_RUN_ID ?? `ghrunid-notfound-${crypto.randomUUID()}`) {
        this.dir = dir;
        this.artifactFilenames = artifactFilenames;
        this.debug = debug;
        this.runId = runId;
    }
    /** Upload artifacts to GitHub Actions via [@actions/artifact]. */
    /**
     * Artifact name, unique per action step in a workflow run.
     *
     * Artifact names must be unique within a run, and every job (or step) using
     * the action uploads one, so include the attempt, job and step IDs.
     */
    get name() {
        const parts = [
            this.runId,
            process.env.GITHUB_RUN_ATTEMPT,
            process.env.GITHUB_JOB,
            process.env.GITHUB_ACTION,
        ].filter((part) => part !== undefined && part !== "");
        return ["capa_artifacts", ...parts].join("-");
    }
    async upload() {
        const client = new DefaultArtifactClient();
        await client.uploadArtifact(this.name, this.artifactFilenames
            .map((filename) => path.join(this.dir, filename))
            .filter((filepath) => fs.existsSync(filepath)), this.dir, {
            retentionDays: 7,
        });
        return this.runId;
    }
}
/** Create the logger used for command line execution */
function createExecLogger(debug, filepath) {
    const logger = winston.createLogger({
        level: debug ? "debug" : "info",
        format: winston.format.combine(winston.format.colorize(), winston.format.printf(({ level, message }) => `${level}: ${message}`)),
        transports: [new winston.transports.Console(), createStream(filepath)],
    });
    return logger;
}
/** Create the logger used for GitHub Actions integration. */
function createGitHubLogger(debug, filepath) {
    const logger = winston.createLogger({
        level: debug ? "debug" : "info",
        transports: [createStream(filepath)],
    });
    logger.on("logged", (info) => {
        switch (info.level) {
            case "debug":
                if (debug)
                    core.debug(info.message);
                break;
            case "info":
                core.info(info.message);
                break;
            case "warn":
                core.warning(info.message);
                break;
            case "error":
                core.error(info.message);
                break;
            default:
                core.error(`[UNKNOWN LEVEL]: ${info.level}, message: ${info.message}`);
                break;
        }
    });
    return logger;
}
/** Container for all instrumentation: telemetry, logging, and artifacts generated */
export class Instruments {
    /** Cache directory name where all artifacts are stored, including cached packages. */
    cacheDir;
    /** Absolute path of the cache directory (i.e. under the home directory). */
    cacheDirPath;
    /** Whether debug is enabled which affects artifacts otherwise not. */
    debug;
    /** Manages artifact creation and upload.  */
    artifacts;
    /** Logger used for GitHub Actions integration. */
    appLogger;
    /** Logger used for command line execution. */
    execLogger;
    constructor(cacheDir, debug, artifacts) {
        this.cacheDir = cacheDir;
        this.cacheDirPath = resolveCacheDir(cacheDir);
        this.debug = debug;
        // The log streams open their files right away, so the directory must exist.
        fs.mkdirSync(this.cacheDirPath, { recursive: true });
        this.artifacts =
            artifacts ??
                new Artifacts(this.cacheDirPath, [
                    APP_LOG_FILENAME,
                    EXEC_LOG_FILENAME,
                    CACHE_KEY_FILENAME,
                    MANIFEST_MAIN_FILENAME,
                    MANIFEST_ALL_FILENAME,
                ]);
        this.appLogger = createGitHubLogger(debug, path.join(this.cacheDirPath, APP_LOG_FILENAME));
        this.execLogger = createExecLogger(debug, path.join(this.cacheDirPath, EXEC_LOG_FILENAME));
    }
}
//# sourceMappingURL=instrumentation.js.map