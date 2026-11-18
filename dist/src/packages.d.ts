import { type PackageName, type PackageManager } from "ts-apt";
/**
 * Collects installed file and lifecycle script paths for archive creation.
 *
 * @param packageManager ts-apt package manager instance.
 * @param packageName Package descriptor.
 * @returns Sorted unique file list suitable for tar archiving.
 */
export declare function buildFileList(packageName: PackageName, packageManager: PackageManager, root?: string): Promise<string[]>;
/**
 * Finds package lifecycle install scripts in dpkg metadata when present.
 *
 * @param packageName Package name to resolve scripts for.
 * @param extension Script extension to resolve.
 * @param root Root filesystem path used to resolve dpkg metadata.
 * @returns Absolute script path when found.
 */
export declare function findInstallScript(packageName: PackageName, extension: "preinst" | "postinst", root: string): Promise<string | undefined>;
export declare class ActionPackageNames {
    private readonly items;
    private constructor();
    static fromInput(serializedPackageNames: string): ActionPackageNames;
    static fromJSON(json: any): ActionPackageNames;
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
}
//# sourceMappingURL=packages.d.ts.map