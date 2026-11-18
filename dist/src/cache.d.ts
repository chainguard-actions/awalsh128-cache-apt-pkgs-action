import * as winston from "winston";
import { ActionPackageNames } from "./packages.js";
import { Manifest } from "./manifest.js";
import { CommandRunner } from "ts-apt";
export declare const CACHE_DEFAULT_DIRNAME = "cache-apt-pkgs";
export declare const CACHE_KEY_FILENAME = "cache_key.md5";
/**
 * Resolves the absolute cache directory path for a cache directory name.
 *
 * @param cacheDir Directory name under the user's home directory.
 * @returns Absolute path to the cache directory.
 */
export declare function resolveCacheDir(cacheDir?: string): string;
export declare const MANIFEST_MAIN_FILENAME = "manifest_main.json";
export declare const MANIFEST_ALL_FILENAME = "manifest_all.json";
/**
 * Structured representation of cache key components for the GitHub Actions cache service.
 */
export declare class CacheKey {
    /** Version set by user to create a miss, re-install and cache from scratch. */
    readonly version: string;
    /** Global force update increment for cases of cache bugs introduced by action development. */
    readonly forceUpdateIncrement: string;
    /** System architecture for which the cache is valid. Prevent cross architecture cache hits. */
    readonly arch: string;
    /** Normalized package names included in the cache so future unordered list comparisons are consistent. */
    readonly packageNames: ActionPackageNames;
    /** MD5 hash of the serialized cache key. Not considered sensitive in the GitHub Cache action. */
    readonly hash: string;
    constructor(version: string, forceUpdateIncrement: string, arch: string, packageNames: ActionPackageNames);
    /**
     * Parses a serialized cache key into a strongly typed CacheKey.
     *
     * @param serialized Serialized cache key string.
     * @returns Parsed cache key object.
     * @throws Error when serialized value does not contain all expected fields.
     */
    static fromJSON(json: string): CacheKey;
    /**
     * Serializes cache key fields to a stable, human-readable format.
     *
     * NOTE: Object is always stable JSON stringification for consistent hashing.
     *
     * @param readable Whether to pretty-print the JSON output. Defaults to false.
     * @returns Serialized cache key components.
     */
    toJSON(readable?: boolean): string;
    toString(): string;
}
/**
 * Computes action cache path and cache keys for package sets.
 */
export declare class Cache {
    /** Absolute path to the local cache directory. */
    readonly path: string;
    private readonly logger;
    private readonly commandRunner;
    constructor(commandRunner: CommandRunner, logger: winston.Logger, cacheDir?: string);
    /**
     * Runs a package's maintainer scripts in the order dpkg runs them on install.
     *
     * @param packageName Package whose scripts to run.
     */
    private runInstallScripts;
    /**
     * Runs one maintainer script, if the package has it, with the action dpkg passes.
     *
     * @param packageName Package whose script to run.
     * @param scriptType Maintainer script to run.
     */
    private runInstallScript;
    loadAndRestore(key: CacheKey, executeInstallScripts: boolean): Promise<Manifest | undefined>;
    /**
     * Extracts package archives, in order, onto the root filesystem.
     *
     * Runs system tar under sudo because package files live in root-owned
     * directories. All archives share one sudo shell so the process cost is paid
     * once. Stops at the first archive with any entry error.
     *
     * @param archivePaths Absolute paths to the package archives.
     */
    private extractArchives;
    private createArchive;
    private writeManifests;
    /**
     * Writes the manifests and per-package archives, then saves the cache.
     *
     * @param manifest Installed packages, in install order, with their files.
     * @returns GitHub Actions cache ID.
     */
    archiveAndSave(manifest: Manifest): Promise<number>;
}
//# sourceMappingURL=cache.d.ts.map