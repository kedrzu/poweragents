import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { PROJECT_COLORS } from './ProjectColor.js';
import ProjectRow from './ProjectRow.vue';
import styles from './ProjectRow.stories.module.scss';

const meta: Meta<typeof ProjectRow> = { title: 'ProjectRow', component: ProjectRow, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof ProjectRow>;

export const Link: Story = {
    render: () => (
        <ProjectRow
            name="Szukanie pracy"
            color="blue"
            to="/projects/p1"
        />
    ),
};

export const Selected: Story = {
    render: () => (
        <ProjectRow
            name="Zdrowie"
            color="pink"
            to="/projects/p2"
            selected="page"
        />
    ),
};

/** App setup, pinned first in the sidebar. */
export const Pinned: Story = {
    render: () => (
        <ProjectRow
            name="App setup"
            color="slate"
            to="/projects/p0"
            mark="pinned"
        />
    ),
};

/** A project the agent has just created, not opened yet (screen 66). */
export const New: Story = {
    render: () => (
        <ProjectRow
            name="Szukanie pracy"
            color="blue"
            to="/projects/p1"
            mark="new"
        />
    ),
};

/** The agent working in App setup: the spinner takes the pin's place. */
export const PinnedRunning: Story = {
    render: () => (
        <ProjectRow
            name="App setup"
            color="slate"
            to="/projects/p0"
            mark="pinned"
            selected="true"
            running
        />
    ),
};

/** Not a link: an example of a project, as on the empty main screen. */
export const Example: Story = {
    render: () => (
        <ProjectRow
            name="Posty na Instagram"
            color="amber"
        />
    ),
};

export const LongName: Story = {
    render: () => (
        <div class={styles['narrow']}>
            <ProjectRow
                name="Przeprowadzka do Wrocławia i wszystko, co trzeba przy niej załatwić"
                color="violet"
                to="/projects/p3"
            />
        </div>
    ),
};

export const Colors: Story = {
    render: () => (
        <div>
            {PROJECT_COLORS.map(color => (
                <ProjectRow
                    key={color}
                    name={color}
                    color={color}
                    to={`/projects/${color}`}
                />
            ))}
        </div>
    ),
};
