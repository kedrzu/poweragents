import { PROJECT_COLORS } from '@poweragents/ui/ProjectColor.js';
import type { ProjectColor } from '@poweragents/ui/ProjectColor.js';

/**
 * The colour a project is drawn in. Projects do not store one yet, so it follows from the project's stable id: the same
 * project keeps its colour across restarts, renames and new projects.
 *
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function projectColor(projectId: string): ProjectColor {
    let hash = 0;
    for (const char of projectId) {
        hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
    }
    return PROJECT_COLORS[hash % PROJECT_COLORS.length] ?? 'blue';
}
