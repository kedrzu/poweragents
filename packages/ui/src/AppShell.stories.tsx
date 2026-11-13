import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { LogIn } from '@lucide/vue';

import { WINTER_ROUTINE_FINISHED, WINTER_ROUTINE_RUNNING } from './AgentMessage.fixtures.js';
import AgentMessage from './AgentMessage.vue';
import AppShell from './AppShell.vue';
import Composer from './Composer.vue';
import ConversationLayout from './ConversationLayout.vue';
import MessageError from './MessageError.vue';
import StatusBanner from './StatusBanner.vue';
import UserMessage from './UserMessage.vue';
import ProjectEmptyState from './ProjectEmptyState.vue';
import type { ProjectSidebarConversation, ProjectSidebarItem } from './ProjectSidebar.vue';
import ProjectSidebar from './ProjectSidebar.vue';
import NoProjectsState from './NoProjectsState.vue';
import ConversationTab from './ConversationTab.vue';

// The main screens from `poweragents.pen`, composed from the components as the app does.

const meta: Meta<typeof AppShell> = {
    title: 'AppShell',
    component: AppShell,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof AppShell>;

const PROJECTS: ProjectSidebarItem[] = [
    { id: 'p1', name: 'Szukanie pracy', color: 'blue', to: '/projects/p1' },
    { id: 'p2', name: 'Zdrowie', color: 'pink', to: '/projects/p2' },
    { id: 'p3', name: 'Posty na Instagram', color: 'amber', to: '/projects/p3' },
];

const CONVERSATIONS: ProjectSidebarConversation[] = [
    { id: 'c1', title: 'Poranna rutyna na zimę', to: '/projects/p2/conversations/c1', running: false },
    { id: 'c2', title: 'Krem z filtrem — co wybrać', to: '/projects/p2/conversations/c2', running: false },
    { id: 'c3', title: 'Pytania do dermatologa', to: '/projects/p2/conversations/c3', running: false },
];

const FIRST_MESSAGE = 'Ułóż mi poranną rutynę pielęgnacyjną na zimę. Moje notatki o skórze są w pliku notatki.md.';

/** Screen 51: no projects yet. */
export const NoProjects: Story = {
    render: () => (
        <AppShell>
            {{
                sidebar: () => <ProjectSidebar projects={[]} />,
                default: () => <NoProjectsState />,
            }}
        </AppShell>
    ),
};

/** Screen 54: a project open. */
export const ProjectOpen: Story = {
    render: () => (
        <AppShell>
            {{
                sidebar: () => (
                    <ProjectSidebar
                        projects={PROJECTS}
                        selectedId="p2"
                    />
                ),
                header: () => (
                    <ConversationTab
                        title="Nowa rozmowa"
                        color="pink"
                    />
                ),
                default: () => (
                    <ProjectEmptyState
                        name="Zdrowie"
                        color="pink"
                    />
                ),
            }}
        </AppShell>
    ),
};

/** Screen 56: the agent working, Stop in the composer. */
export const ConversationRunning: Story = {
    render: () => (
        <AppShell>
            {{
                sidebar: () => (
                    <ProjectSidebar
                        projects={PROJECTS}
                        selectedId="p2"
                        conversations={CONVERSATIONS.map(item => ({ ...item, running: item.id === 'c1' }))}
                        selectedConversationId="c1"
                    />
                ),
                header: () => (
                    <ConversationTab
                        title="Poranna rutyna na zimę"
                        color="pink"
                        running
                    />
                ),
                default: () => (
                    <ConversationLayout>
                        {{
                            default: () => [
                                <UserMessage text={FIRST_MESSAGE} />,
                                <AgentMessage
                                    parts={WINTER_ROUTINE_RUNNING}
                                    running
                                />,
                            ],
                            footer: () => (
                                <Composer
                                    placeholder="Dopisz coś, gdy agent pracuje…"
                                    running
                                />
                            ),
                        }}
                    </ConversationLayout>
                ),
            }}
        </AppShell>
    ),
};

/** Screen 57: the reply finished, its steps collapsed. */
export const ConversationFinished: Story = {
    render: () => (
        <AppShell>
            {{
                sidebar: () => (
                    <ProjectSidebar
                        projects={PROJECTS}
                        selectedId="p2"
                        conversations={CONVERSATIONS}
                        selectedConversationId="c1"
                    />
                ),
                header: () => (
                    <ConversationTab
                        title="Poranna rutyna na zimę"
                        color="pink"
                    />
                ),
                default: () => (
                    <ConversationLayout>
                        {{
                            default: () => [
                                <UserMessage text={FIRST_MESSAGE} />,
                                <AgentMessage parts={WINTER_ROUTINE_FINISHED} />,
                            ],
                            footer: () => <Composer placeholder="Napisz do agenta…" />,
                        }}
                    </ConversationLayout>
                ),
            }}
        </AppShell>
    ),
};

/** Screen 60: signed out of Claude, the banner holding the fix. */
export const ConversationSignedOut: Story = {
    render: () => (
        <AppShell>
            {{
                sidebar: () => (
                    <ProjectSidebar
                        projects={PROJECTS}
                        selectedId="p2"
                        conversations={CONVERSATIONS}
                        selectedConversationId="c1"
                    />
                ),
                header: () => (
                    <ConversationTab
                        title="Poranna rutyna na zimę"
                        color="pink"
                    />
                ),
                default: () => (
                    <ConversationLayout>
                        {{
                            default: () => [
                                <UserMessage text={FIRST_MESSAGE} />,
                                <AgentMessage
                                    parts={[
                                        ...WINTER_ROUTINE_FINISHED.filter(part => part.type === 'step'),
                                        {
                                            type: 'text',
                                            text: 'Gotowe. Poranna rutyna ma cztery kroki: łagodne mycie, serum z witaminą C, krem z ceramidami i filtr SPF 30. Cały plan jest w pliku plan.md.',
                                        },
                                    ]}
                                />,
                                <UserMessage text="Dodaj jeszcze wieczorną rutynę, coś na noc po prysznicu." />,
                                <MessageError text="Bez odpowiedzi: wylogowano Cię z Claude." />,
                            ],
                            footer: () => [
                                <StatusBanner
                                    title="Wylogowano Cię z Claude"
                                    body="Agent nie odpowie, dopóki nie zalogujesz się ponownie. Twoja wiadomość zostaje w rozmowie."
                                    actionLabel="Zaloguj się ponownie"
                                    actionIcon={LogIn}
                                />,
                                <Composer placeholder="Napisz do agenta…" />,
                            ],
                        }}
                    </ConversationLayout>
                ),
            }}
        </AppShell>
    ),
};
