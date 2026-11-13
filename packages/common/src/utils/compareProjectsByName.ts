/** A project's name, as both the daemon and the app order projects by it. */
export interface ProjectNamed {
    name: string;
}

/**
 * Orders projects by name, ignoring case and accents, the order the daemon lists them in and the app keeps.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function compareProjectsByName(a: ProjectNamed, b: ProjectNamed): number {
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}
