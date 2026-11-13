import { ArrowLeft, ExternalLink, Link } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Button from './Button.vue';
import CodeField from './CodeField.vue';
import InstructionSteps from './InstructionSteps.vue';
import PathStage from './PathStage.vue';
import type { PathStageStatus } from './PathStage.vue';
import styles from './SplitWizardShell.stories.module.scss';
import ProgressBar from './ProgressBar.vue';
import SplitWizardShell from './SplitWizardShell.vue';

// The first run's screens from `poweragents.pen`, composed from the components as the app will.

const meta: Meta<typeof SplitWizardShell> = {
    title: 'SplitWizardShell',
    component: SplitWizardShell,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof SplitWizardShell>;

const HEADLINE = 'Twój agent się wprowadza. Za kilka minut porozmawiacie.';
const FOOTNOTE = 'Nic nie instaluję na Twoim komputerze. Agent pracuje w osobnym, bezpiecznym miejscu.';

/** Screen 44: preparing the agent's environment. */
export const Preparing: Story = {
    render: () => (
        <SplitWizardShell
            headline={HEADLINE}
            footnote={FOOTNOTE}
            eyebrow="Krok 1 z 2"
            title="Przygotowuję miejsce pracy agenta"
            body="Nie musisz nic robić. Za pierwszym razem pobieram środowisko, to trwa od kilku sekund do kilku minut."
        >
            {{
                path: () => renderPath(['current', 'waiting', 'waiting']),
                default: () => (
                    <>
                        <ProgressBar
                            value={0.41}
                            label="Przygotowuję narzędzia…"
                            hint="zostały około 2 minuty"
                        />
                        <p class={styles['hint']}>
                            Możesz zminimalizować okno — gdy wszystko będzie gotowe, sam przejdę dalej.
                        </p>
                    </>
                ),
            }}
        </SplitWizardShell>
    ),
};

/** Screen 38: pasting the code Claude shows after signing in. */
export const PasteCode: Story = {
    render: () => (
        <SplitWizardShell
            headline={HEADLINE}
            footnote={FOOTNOTE}
            eyebrow="Krok 2 z 2"
            title="Dokończ logowanie w Claude"
            body="Strona logowania Claude otworzyła się w przeglądarce."
        >
            {{
                path: () => renderPath(['done', 'current', 'waiting']),
                default: () => (
                    <>
                        <InstructionSteps
                            steps={[
                                'Zaloguj się w otwartej karcie przeglądarki',
                                'Skopiuj kod, który pokaże Claude',
                                'Wklej go tutaj',
                            ]}
                        />
                        <CodeField
                            label="Kod z Claude"
                            placeholder="Wklej tutaj kod z Claude"
                            help="Kod to długi ciąg liter i cyfr. Wklej go w całości."
                            pasteLabel="Wklej"
                            modelValue=""
                        />
                    </>
                ),
                back: () => (
                    <Button
                        variant="ghost"
                        icon={ArrowLeft}
                    >
                        Wróć
                    </Button>
                ),
                actions: () => (
                    <>
                        <Button
                            variant="secondary"
                            icon={ExternalLink}
                        >
                            Otwórz stronę logowania ponownie
                        </Button>
                        <Button icon={Link}>Połącz</Button>
                    </>
                ),
            }}
        </SplitWizardShell>
    ),
};

function renderPath(statuses: [PathStageStatus, PathStageStatus, PathStageStatus]) {
    return (
        <>
            <PathStage
                number={1}
                title="Bezpieczne miejsce pracy"
                hint="Osobny komputer agenta w tej aplikacji"
                status={statuses[0]}
            />
            <PathStage
                number={2}
                title="Połączenie z AI"
                hint="Twoje konto Claude lub ChatGPT"
                status={statuses[1]}
            />
            <PathStage
                number={3}
                title="Pierwsza rozmowa"
                hint="Agent pozna Ciebie i Twoje sprawy"
                status={statuses[2]}
            />
        </>
    );
}
