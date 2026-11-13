/**
 * The colours a project is drawn in (its folder icon and tile), the design's `project-*` variables; `tokens.scss` has
 * each as `$color-project-<name>` and `$color-project-<name>-soft`.
 */
export const PROJECT_COLORS = ['blue', 'pink', 'amber', 'green', 'violet', 'teal', 'coral', 'slate'] as const;

/** One of {@link PROJECT_COLORS}. */
export type ProjectColor = (typeof PROJECT_COLORS)[number];
