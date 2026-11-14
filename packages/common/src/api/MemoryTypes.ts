/** A file in the person's Memory (design D9): a Markdown file in the data root's `memory/` folder. */
export interface MemoryFile {
    /** Relative to the Memory folder, with `/` between folders: `praca.md`, `zdrowie/skora.md`. */
    path: string;
    /** The file's first Markdown heading, or its name without the extension when it has none. */
    title: string;
    /** Epoch ms of the last change. */
    updatedAt: number;
}

/** A Memory file to read. */
export interface MemoryFileGetInput {
    /** As listed in {@link MemoryFile.path}. */
    path: string;
}

/** How reading a Memory file ended. */
export type MemoryFileGetResult =
    | { file: MemoryFileContent }
    /**
     * No Markdown file at that path inside the Memory folder: also a path leading out of it (`..`, an absolute path) or
     * through a link, which is never followed.
     */
    | { notFound: true }
    /** A file too large to show (over 1 MB): the Memory holds notes, not data. */
    | { tooLarge: true };

/** A Memory file with its text. */
export interface MemoryFileContent extends MemoryFile {
    /** Markdown. */
    content: string;
}
