import { createPackageManager } from "ts-apt";
import { CacheKey } from "./cache.js";
import { Manifest, ManifestEntry } from "./manifest.js";
import { ActionPackageNames, buildFileList } from "./packages.js";
const FORCE_UPDATE_INCREMENT = "0";
/** Orchestrates package normalization, cache restore/save, install, and outputs. */
export class ActionRunner {
    cache;
    commandRunner;
    logger;
    constructor(cache, commandRunner, logger) {
        this.cache = cache;
        this.commandRunner = commandRunner;
        this.logger = logger;
    }
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
    toCsv(packageNames, nativeArch) {
        return [...packageNames]
            .sort((a, b) => a.compareTo(b))
            .map((name) => {
            const foreignArch = name.arch !== undefined && name.arch !== nativeArch ? `:${name.arch}` : "";
            const version = name.version === undefined ? "" : `=${name.version}`;
            return `${name.name}${foreignArch}${version}`;
        })
            .join(",");
    }
    /**
     * Executes the end-to-end action flow and returns action outputs.
     *
     * @param inputs Validated action inputs.
     * @returns Action outputs consumed by the workflow runtime.
     */
    async runAction(inputs) {
        const packageNames = ActionPackageNames.fromInput(inputs.packages);
        const cacheKey = new CacheKey(inputs.version, FORCE_UPDATE_INCREMENT, process.arch, packageNames);
        let manifest = await this.cache.loadAndRestore(cacheKey, inputs.executeInstallScripts);
        const cacheHit = manifest !== undefined;
        // Needed on a cache hit too, to resolve the native arch for outputs.
        // apt-fast only speeds up installs, so skip probing for it on a hit.
        const installManager = await createPackageManager(!cacheHit, this.logger, this.logger);
        if (!cacheHit) {
            // Runner images ship an apt index that can predate the archive, so a package whose version was
            // superseded (e.g. a security update) 404s on download. Refresh it before every fresh install.
            await installManager.update();
            const packageInfos = await installManager.install(packageNames.toArray());
            // Collect each package's installed files so the archives have content.
            const entries = await Promise.all(packageInfos.map(async (info) => new ManifestEntry(info.name, await buildFileList(info.name, installManager))));
            manifest = new Manifest(new Date(), entries, cacheKey);
            await this.cache.archiveAndSave(manifest);
        }
        const nativeArch = await installManager.getNativeArchitecture();
        const installed = manifest.entries.map((entry) => entry.packageName);
        return {
            cacheHit,
            packageVersionList: this.toCsv(installed.filter((name) => packageNames.includes(name)), nativeArch),
            allPackageVersionList: this.toCsv(installed, nativeArch),
        };
    }
}
/**
 * Public entrypoint used by src/index.ts and tests.
 *
 * @param inputs Validated action inputs.
 * @param commandRunner Command runner used by package operations.
 * @param logger Logger instance used for command and restore diagnostics.
 * @returns Action outputs consumed by the workflow runtime.
 */
export async function runAction(inputs, commandRunner, cache, logger) {
    const actionRunner = new ActionRunner(cache, commandRunner, logger);
    return await actionRunner.runAction(inputs);
}
//# sourceMappingURL=action.js.map