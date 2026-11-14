import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { ProjectSidebarConversation, ProjectSidebarItem } from './ProjectSidebar.vue';
import ProjectSidebar from './ProjectSidebar.vue';
import styles from './ProjectSidebar.stories.module.scss';

const meta: Meta<typeof ProjectSidebar> = { title: 'ProjectSidebar', component: ProjectSidebar, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof ProjectSidebar>;

const PROJECTS: ProjectSidebarItem[] = [
    { id: 'p1', name: 'Szukanie pracy', color: 'blue', to: '/projects/p1' },
    { id: 'p2', name: 'Zdrowie', color: 'pink', to: '/projects/p2' },
    { id: 'p3', name: 'Posty na Instagram', color: 'amber', to: '/projects/p3' },
];

const CONVERSATIONS: ProjectSidebarConversation[] = [
    { id: 'c1', title: 'Poranna rutyna na zimę', to: '/projects/p2/conversations/c1', running: true },
    { id: 'c2', title: 'Krem z filtrem — co wybrać', to: '/projects/p2/conversations/c2', running: false },
    { id: 'c3', title: 'Pytania do dermatologa', to: '/projects/p2/conversations/c3', running: false },
    { id: 'c4', title: 'Ile wody dziennie', to: '/projects/p2/conversations/c4', running: false },
];

/** Screen 51's sidebar: no projects yet. */
export const Empty: Story = {
    render: () => (
        <div class={styles['backdrop']}>
            <ProjectSidebar
                memoryTo="/memory"
                projects={[]}
            />
        </div>
    ),
};

/** Screen 54's sidebar: three projects, one open. */
export const Projects: Story = {
    render: () => (
        <div class={styles['backdrop']}>
            <ProjectSidebar
                memoryTo="/memory"
                projects={PROJECTS}
                selectedId="p2"
            />
        </div>
    ),
};

/** Screen 56's sidebar: the open conversation running, so its project spins too. */
export const ConversationOpen: Story = {
    render: () => (
        <div class={styles['backdrop']}>
            <ProjectSidebar
                memoryTo="/memory"
                projects={PROJECTS}
                selectedId="p2"
                conversations={CONVERSATIONS}
                selectedConversationId="c1"
            />
        </div>
    ),
};

/** Screen 58's sidebar: New conversation open, another conversation still running. */
export const NewConversation: Story = {
    render: () => (
        <div class={styles['backdrop']}>
            <ProjectSidebar
                memoryTo="/memory"
                projects={PROJECTS}
                selectedId="p2"
                conversations={CONVERSATIONS}
            />
        </div>
    ),
};

/** Screen 63's sidebar: Memory open. */
export const MemoryOpen: Story = {
    render: () => (
        <div class={styles['backdrop']}>
            <ProjectSidebar
                memoryTo="/memory"
                memorySelected
                projects={PROJECTS}
            />
        </div>
    ),
};

const APP_SETUP: ProjectSidebarItem = {
    id: 'p0',
    name: 'App setup',
    color: 'slate',
    to: '/projects/p0',
    mark: 'pinned',
};

const ONBOARDING: ProjectSidebarConversation[] = [
    { id: 'c0', title: 'Poznajmy się', to: '/projects/p0/conversations/c0', running: false },
];

/** Screen 65's sidebar: day one, App setup pinned and open on its onboarding conversation. */
export const DayOne: Story = {
    render: () => (
        <div class={styles['backdrop']}>
            <ProjectSidebar
                memoryTo="/memory"
                projects={[APP_SETUP]}
                selectedId="p0"
                conversations={ONBOARDING}
                selectedConversationId="c0"
            />
        </div>
    ),
};

/** Screen 66's sidebar: the projects the agent has just created, marked new until opened. */
export const NewProjects: Story = {
    render: () => (
        <div class={styles['backdrop']}>
            <ProjectSidebar
                memoryTo="/memory"
                projects={[
                    APP_SETUP,
                    { id: 'p1', name: 'Szukanie pracy', color: 'blue', to: '/projects/p1', mark: 'new' },
                    { id: 'p3', name: 'Posty na Instagram', color: 'amber', to: '/projects/p3', mark: 'new' },
                ]}
                selectedId="p0"
                conversations={ONBOARDING}
                selectedConversationId="c0"
            />
        </div>
    ),
};
