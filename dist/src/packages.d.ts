import { type Alternative, type PackageName, type PackageManager } from "ts-apt";
/**
 * Collects installed file and lifecycle script paths for archive creation.
 *
 * @param packageManager ts-apt package manager instance.
 * @param packageName Package descriptor.
 * @returns Sorted unique file list suitable for tar archiving.
 */
export declare function buildFileList(packageName: PackageName, packageManager: PackageManager, root?: string): Promise<string[]>;
/**
 * Picks the alternatives a package registered.
 *
 * `dpkg -L` doesn't list the links `update-alternatives` creates, but it does list the file each
 * alternative points to, so an alternative belongs to the package that owns its `path`. Paths are compared
 * after resolving directory symlinks, because a package can list `/usr/bin/nano` while its `postinst`
 * registers `/bin/nano`.
 *
 * @param files Root-relative file paths of the package, as returned by {@link buildFileList}.
 * @param alternatives Every alternative registered on the system.
 * @param root Root filesystem path used to resolve directory symlinks.
 * @returns The alternatives whose path is one of the package's files.
 * @throws Error when a directory can't be resolved for a reason other than not existing.
 */
export declare function ownedAlternatives(files: readonly string[], alternatives: readonly Alternative[], root?: string): Alternative[];
/**
 * Finds package lifecycle install scripts in dpkg metadata when present.
 *
 * @param packageName Package name to resolve scripts for.
 * @param extension Script extension to resolve.
 * @param root Root filesystem path used to resolve dpkg metadata.
 * @returns Absolute script path when found.
 */
export declare function findInstallScript(packageName: PackageName, extension: "preinst" | "postinst", root: string): Promise<string | undefined>;
/** Parsed JSON form of one requested package. */
interface PackageNameJson {
    readonly name: string;
    readonly version?: string;
    readonly arch?: string;
}
export declare class ActionPackageNames {
    private readonly items;
    private constructor();
    static fromInput(serializedPackageNames: string): ActionPackageNames;
    static fromJSON(json: PackageNameJson[] | {
        items?: PackageNameJson[];
    }): ActionPackageNames;
    get length(): number;
    toArray(): readonly PackageName[];
    /**
     * Checks whether an installed package was one of the requested packages.
     *
     * Matches on name, and on arch only when both sides specify one. Version is
     * ignored because requests usually omit it and apt resolves the installed one.
     *
     * @param installed Package name as reported by apt after install.
     * @returns True when the package was requested.
     */
    includes(installed: PackageName): boolean;
    /**
     * Lists the requested packages that none of the given packages satisfies, using the match of
     * {@link ActionPackageNames.includes}.
     *
     * @param reported Packages to look through, e.g. the ones apt reported installing.
     * @returns The requested packages with no match in `reported`.
     */
    missingFrom(reported: readonly PackageName[]): PackageName[];
}
export {};
//# sourceMappingURL=packages.d.ts.map