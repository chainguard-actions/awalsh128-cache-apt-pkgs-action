import fs from "node:fs";
import { CacheKey } from "./cache.js";
import { packageNameFromJSON } from "ts-apt";
/** One installed package and the files archived for it in the cache. */
export class ManifestEntry {
    /** Installed package, with the version and arch apt resolved. */
    packageName;
    /**
     * Files installed by the package, relative to `/` (no leading slash) so they
     * can be passed straight to tar. Sorted for stable output. Empty for
     * packages without files (e.g. metapackages), which get no archive.
     */
    filepaths;
    /**
     * Alternatives (`update-alternatives`) the package registered, whose links `dpkg -L` does not list.
     * Restore registers them again after extracting the archives. Empty when the package has none, or
     * for a cache saved before they were recorded.
     */
    alternatives;
    /**
     * @param packageName Installed package.
     * @param filepaths Root-relative file paths; copied and sorted.
     * @param alternatives Alternatives the package registered; copied.
     */
    constructor(packageName, filepaths, alternatives = []) {
        this.packageName = packageName;
        this.filepaths = [...filepaths].sort((a, b) => a.localeCompare(b));
        this.alternatives = [...alternatives];
    }
    /**
     * Creates an entry from its parsed JSON form.
     *
     * @param json Parsed JSON object as written by {@link Manifest.writeToFile}.
     * @returns The deserialized entry.
     */
    static fromJSON(json) {
        return new ManifestEntry(packageNameFromJSON(json.packageName), json.filepaths, json.alternatives ?? []);
    }
}
/**
 * Record of the packages stored in a cache, written alongside the archives.
 *
 * Restore reads it to find each package's archive and to report outputs.
 */
export class Manifest {
    created;
    entries;
    cacheKey;
    inputs;
    outputs;
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
    created, 
    /** Packages in the order apt installed them. */
    entries, 
    /** Key the cache was saved under. */
    cacheKey, 
    /** Inputs of the run that saved the cache. */
    inputs, 
    /** Outputs of the run that saved the cache. */
    outputs) {
        this.created = created;
        this.entries = entries;
        this.cacheKey = cacheKey;
        this.inputs = inputs;
        this.outputs = outputs;
    }
    /**
     * Creates a manifest from its parsed JSON form.
     *
     * @param json Parsed JSON object as written by {@link Manifest.writeToFile}.
     *   Its `cacheKey` is the serialized string from {@link CacheKey.toJSON}.
     * @returns The deserialized manifest.
     */
    static fromJSON(json) {
        return new Manifest(new Date(json.created), json.entries.map((entry) => ManifestEntry.fromJSON(entry)), CacheKey.fromJSON(json.cacheKey), json.inputs, json.outputs);
    }
    /**
     * Reads and parses a manifest file.
     *
     * @param filePath Path to a manifest JSON file.
     * @returns The parsed manifest.
     * @throws Error when the file can't be read or isn't a valid manifest.
     */
    static async readFromFile(filePath) {
        const content = await fs.promises.readFile(filePath, "utf-8");
        return Manifest.fromJSON(JSON.parse(content));
    }
    /**
     * Writes the manifest as pretty-printed JSON, replacing any existing file.
     *
     * @param filePath Destination path.
     */
    async writeToFile(filePath) {
        await fs.promises.writeFile(filePath, JSON.stringify(this, null, 2), "utf8");
    }
}
//# sourceMappingURL=manifest.js.map