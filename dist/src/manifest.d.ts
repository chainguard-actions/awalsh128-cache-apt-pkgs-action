import { CacheKey } from "./cache.js";
import { PackageName } from "ts-apt";
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
     * @param packageName Installed package.
     * @param filepaths Root-relative file paths; copied and sorted.
     */
    constructor(packageName: PackageName, filepaths?: string[]);
    /**
     * Creates an entry from its parsed JSON form.
     *
     * @param json Parsed JSON object as written by {@link Manifest.writeToFile}.
     * @returns The deserialized entry.
     */
    static fromJSON(json: any): ManifestEntry;
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
    /**
     * @param created When the manifest was created.
     * @param entries Packages in the order apt installed them. Restore relies on
     *   this order because install scripts can depend on earlier packages
     *   (see issue #196).
     * @param cacheKey Key the cache was saved under.
     */
    constructor(
    /** When the manifest was created. */
    created: Date, 
    /** Packages in the order apt installed them. */
    entries: ManifestEntry[], 
    /** Key the cache was saved under. */
    cacheKey: CacheKey);
    /**
     * Creates a manifest from its parsed JSON form.
     *
     * @param json Parsed JSON object as written by {@link Manifest.writeToFile}.
     *   Its `cacheKey` is the serialized string from {@link CacheKey.toJSON}.
     * @returns The deserialized manifest.
     */
    static fromJSON(json: any): Manifest;
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
//# sourceMappingURL=manifest.d.ts.map