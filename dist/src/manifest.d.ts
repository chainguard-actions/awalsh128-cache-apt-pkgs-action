import type { ActionInputs, ActionOutputs } from "./action.js";
import { CacheKey } from "./cache.js";
import { packageNameFromJSON, type Alternative, type PackageName } from "ts-apt";
/** Parsed JSON form of a {@link ManifestEntry}. */
interface ManifestEntryJson {
    readonly packageName: Parameters<typeof packageNameFromJSON>[0];
    readonly filepaths: string[];
    /** Missing in caches saved before alternatives were recorded. */
    readonly alternatives?: Alternative[];
}
/** Parsed JSON form of a {@link Manifest}. */
interface ManifestJson {
    readonly created: string | number;
    readonly entries: readonly ManifestEntryJson[];
    readonly cacheKey: string;
    readonly inputs: ActionInputs;
    readonly outputs: ActionOutputs;
}
/** One installed package and the files archived for it in the cache. */
export declare class ManifestEntry {
    /** Installed package, with the version and arch apt resolved. */
    readonly packageName: PackageName;
    /**
     * Files installed by the package, relative to `/` (no leading slash) so they
     * can be passed straight to tar. Sorted for stable output. Empty for
     * packages without files (e.g. metapackages), which get no archive.
     */
    readonly filepaths: string[];
    /**
     * Alternatives (`update-alternatives`) the package registered, whose links `dpkg -L` does not list.
     * Restore registers them again after extracting the archives. Empty when the package has none, or
     * for a cache saved before they were recorded.
     */
    readonly alternatives: Alternative[];
    /**
     * @param packageName Installed package.
     * @param filepaths Root-relative file paths; copied and sorted.
     * @param alternatives Alternatives the package registered; copied.
     */
    constructor(packageName: PackageName, filepaths: string[], alternatives?: readonly Alternative[]);
    /**
     * Creates an entry from its parsed JSON form.
     *
     * @param json Parsed JSON object as written by {@link Manifest.writeToFile}.
     * @returns The deserialized entry.
     */
    static fromJSON(json: ManifestEntryJson): ManifestEntry;
}
/**
 * Record of the packages stored in a cache, written alongside the archives.
 *
 * Restore reads it to find each package's archive and to report outputs.
 */
export declare class Manifest {
    /** When the manifest was created. */
    readonly created: Date;
    /** Packages in the order apt installed them. */
    readonly entries: ManifestEntry[];
    /** Key the cache was saved under. */
    readonly cacheKey: CacheKey;
    /** Inputs of the run that saved the cache. */
    readonly inputs: ActionInputs;
    /** Outputs of the run that saved the cache. */
    readonly outputs: ActionOutputs;
    /**
     * @param created When the manifest was created.
     * @param entries Packages in the order apt installed them. Restore relies on
     *   this order because install scripts can depend on earlier packages
     *   (see issue #196).
     * @param cacheKey Key the cache was saved under.
     * @param inputs Inputs of the run that saved the cache. Restore doesn't use them; they are for
     *   debugging a cache whose contents don't match what was expected.
     * @param outputs Outputs of the run that saved the cache, for the same reason.
     */
    constructor(
    /** When the manifest was created. */
    created: Date, 
    /** Packages in the order apt installed them. */
    entries: ManifestEntry[], 
    /** Key the cache was saved under. */
    cacheKey: CacheKey, 
    /** Inputs of the run that saved the cache. */
    inputs: ActionInputs, 
    /** Outputs of the run that saved the cache. */
    outputs: ActionOutputs);
    /**
     * Creates a manifest from its parsed JSON form.
     *
     * @param json Parsed JSON object as written by {@link Manifest.writeToFile}.
     *   Its `cacheKey` is the serialized string from {@link CacheKey.toJSON}.
     * @returns The deserialized manifest.
     */
    static fromJSON(json: ManifestJson): Manifest;
    /**
     * Reads and parses a manifest file.
     *
     * @param filePath Path to a manifest JSON file.
     * @returns The parsed manifest.
     * @throws Error when the file can't be read or isn't a valid manifest.
     */
    static readFromFile(filePath: string): Promise<Manifest>;
    /**
     * Writes the manifest as pretty-printed JSON, replacing any existing file.
     *
     * @param filePath Destination path.
     */
    writeToFile(filePath: string): Promise<void>;
}
export {};
//# sourceMappingURL=manifest.d.ts.map