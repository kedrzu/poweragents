/** The longest project name, in characters, after trimming. */
export const PROJECT_NAME_MAX_LENGTH = 80;

/** A project: a folder in the profile's data root, under `projects/`, holding the project's marker. */
export interface Project {
    /** Random and stable: it lives in the project's folder, so it survives a rename or a move of the folder. */
    id: string;
    name: string;
}

/** A project to create. */
export interface ProjectCreateInput {
    /** Trimmed by the daemon; the project's folder is named after it. */
    name: string;
}

/** How a project creation ended. */
export type ProjectCreateResult =
    | { created: Project }
    /** Another project already has this name, compared case-insensitively. */
    | { nameTaken: true }
    /**
     * The name is empty, longer than {@link PROJECT_NAME_MAX_LENGTH}, or holds nothing a folder name can keep (only
     * dots, slashes, colons or control characters).
     */
    | { invalidName: true };
