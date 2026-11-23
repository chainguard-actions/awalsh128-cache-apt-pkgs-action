import * as fs from "fs";
import path from "path";
import { createPackageName } from "ts-apt";
/**
 * Collects installed file and lifecycle script paths for archive creation.
 *
 * @param packageManager ts-apt package manager instance.
 * @param packageName Package descriptor.
 * @returns Sorted unique file list suitable for tar archiving.
 */
export async function buildFileList(packageName, packageManager, root = "/") {
    // Converts absolute paths to tar-relative paths.
    const tarRelativePath = (filePath) => (filePath.startsWith("/") ? filePath.slice(1) : filePath);
    const files = (await packageManager.listInstalledFiles(packageName))
        .filter((filePath) => {
        if (!fs.existsSync(filePath)) {
            return false;
        }
        const stat = fs.lstatSync(filePath);
        return stat.isFile() || stat.isSymbolicLink();
    })
        .map((filePath) => tarRelativePath(filePath));
    const preinst = await findInstallScript(packageName, "preinst", root);
    const postinst = await findInstallScript(packageName, "postinst", root);
    if (preinst) {
        files.push(tarRelativePath(preinst));
    }
    if (postinst) {
        files.push(tarRelativePath(postinst));
    }
    return [...new Set(files)].sort((a, b) => a.localeCompare(b));
}
/**
 * Creates a function that resolves the directory symlinks in a path, so `/bin/nano` and `/usr/bin/nano`
 * compare equal on a merged-/usr system, where `/bin` is a link to `usr/bin`.
 *
 * Only the directory is resolved. The file itself can be a symlink and the path should name it, not its
 * target. Each directory is resolved once, since a package's files share a few directories.
 *
 * @param root Root filesystem path the paths are relative to.
 * @returns A function from an absolute or root-relative path to a root-relative path with no leading slash.
 *   A directory that doesn't exist is left as given.
 * @throws Error from the filesystem other than a missing directory (e.g. permission denied), so an
 *   unreadable path isn't treated as unowned.
 */
function createPathCanonicalizer(root) {
    const resolvedDirs = new Map();
    const resolveDir = (dir) => {
        try {
            const realRoot = fs.realpathSync(root);
            const realDir = fs.realpathSync(path.join(root, dir));
            return path.relative(realRoot, realDir).split(path.sep).join("/");
        }
        catch (error) {
            const code = error.code;
            if (code === "ENOENT" || code === "ENOTDIR") {
                return dir;
            }
            throw error;
        }
    };
    return (filePath) => {
        const relative = filePath.replace(/^\//, "");
        const dir = path.dirname(relative);
        let resolvedDir = resolvedDirs.get(dir);
        if (resolvedDir === undefined) {
            resolvedDir = resolveDir(dir);
            resolvedDirs.set(dir, resolvedDir);
        }
        return path.posix.join(resolvedDir, path.basename(relative));
    };
}
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
export function ownedAlternatives(files, alternatives, root = "/") {
    // Most packages register nothing, so skip resolving thousands of file paths for them.
    if (alternatives.length === 0) {
        return [];
    }
    const canonicalize = createPathCanonicalizer(root);
    const owned = new Set(files.map(canonicalize));
    return alternatives.filter((alternative) => owned.has(canonicalize(alternative.path)));
}
/**
 * Finds package lifecycle install scripts in dpkg metadata when present.
 *
 * @param packageName Package name to resolve scripts for.
 * @param extension Script extension to resolve.
 * @param root Root filesystem path used to resolve dpkg metadata.
 * @returns Absolute script path when found.
 */
export async function findInstallScript(packageName, extension, root) {
    const scriptsDir = path.join(root, "var", "lib", "dpkg", "info");
    if (!fs.existsSync(scriptsDir)) {
        return undefined;
    }
    // Match on plain strings since package names can hold regex metacharacters
    // (e.g. g++, libstdc++6). Scripts are named <name>[:<arch>].<extension>.
    const suffix = `.${extension}`;
    const isMatch = (entry) => entry === `${packageName.name}${suffix}` ||
        (entry.startsWith(`${packageName.name}:`) && entry.endsWith(suffix));
    const matches = fs
        .readdirSync(scriptsDir)
        .filter(isMatch)
        .sort((a, b) => a.localeCompare(b));
    const candidate = matches[0];
    if (!candidate) {
        return undefined;
    }
    return path.join(scriptsDir, candidate);
}
export class ActionPackageNames {
    items;
    constructor(items) {
        this.items = items.sort((a, b) => a.compareTo(b));
    }
    static fromInput(serializedPackageNames) {
        const tokens = serializedPackageNames
            .replace(/[,\\\n]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .split(" ")
            .map((part) => part.trim())
            .filter((part) => part.length > 0);
        const names = [];
        for (let index = 0; index < tokens.length;) {
            const current = tokens[index];
            const next = tokens[index + 1];
            const splitNameArch = (namePart) => {
                const [name = "", arch] = namePart.split(":", 2);
                return { name, arch };
            };
            try {
                if (current.includes("=")) {
                    const [namePart, ...versionParts] = current.split("=");
                    const version = versionParts.join("=").trim();
                    if (namePart === undefined || namePart.trim() === "") {
                        index += 1;
                        continue;
                    }
                    const split = splitNameArch(namePart.trim());
                    let arch = split.arch;
                    if (arch === undefined && next !== undefined && !next.includes("=") && next.trim() !== "") {
                        arch = next.trim();
                        index += 1;
                    }
                    names.push(createPackageName(split.name, version === "" ? undefined : version, arch));
                    index += 1;
                    continue;
                }
                const split = splitNameArch(current);
                names.push(createPackageName(split.name, undefined, split.arch));
            }
            catch {
                // Ignore invalid package tokens.
            }
            index += 1;
        }
        return new ActionPackageNames(names);
    }
    static fromJSON(json) {
        const sourceItems = Array.isArray(json) ? json : Array.isArray(json.items) ? json.items : [];
        const items = sourceItems.map((item) => createPackageName(item.name, item.version, item.arch));
        return new ActionPackageNames(items);
    }
    get length() {
        return this.items.length;
    }
    toArray() {
        return this.items;
    }
    /**
     * Checks whether an installed package was one of the requested packages.
     *
     * Matches on name, and on arch only when both sides specify one. Version is
     * ignored because requests usually omit it and apt resolves the installed one.
     *
     * @param installed Package name as reported by apt after install.
     * @returns True when the package was requested.
     */
    includes(installed) {
        return this.items.some((requested) => isRequestedPackage(requested, installed));
    }
    /**
     * Lists the requested packages that none of the given packages satisfies, using the match of
     * {@link ActionPackageNames.includes}.
     *
     * @param reported Packages to look through, e.g. the ones apt reported installing.
     * @returns The requested packages with no match in `reported`.
     */
    missingFrom(reported) {
        return this.items.filter((requested) => !reported.some((name) => isRequestedPackage(requested, name)));
    }
}
/**
 * Checks whether an installed package satisfies a requested one.
 *
 * Matches on name, and on arch only when both sides specify one. Version is ignored because requests
 * usually omit it and apt resolves the installed one.
 */
function isRequestedPackage(requested, installed) {
    return (requested.name === installed.name &&
        (requested.arch === undefined || installed.arch === undefined || requested.arch === installed.arch));
}
//# sourceMappingURL=packages.js.map