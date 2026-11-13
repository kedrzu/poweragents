import type { OpencodeSession } from '../OpencodeTypes.js';
import type { components } from '../schema.gen.js';

/**
 * A session as OpenCode returns it, in the daemon's terms.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function mapOpencodeSession(session: components['schemas']['Session.Info']): OpencodeSession {
    return {
        id: session.id,
        directory: session.location.directory,
        title: session.title,
        createdAt: session.time.created,
        updatedAt: session.time.updated,
        outcome: session.outcome,
    };
}
