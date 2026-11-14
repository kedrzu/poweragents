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
