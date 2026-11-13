import { expect, test } from 'bun:test';

import { buildHostFirewall } from './buildHostFirewall.js';

const BASE_ACCEPTS = [
    'ct state established,related accept',
    'oifname "lo" accept',
    'icmpv6 type { nd-router-solicit, nd-neighbor-solicit, nd-neighbor-advert } accept',
    'ip daddr 192.168.5.2 udp dport { 53, 67 } accept',
    'ip daddr 192.168.5.2 tcp dport 53 accept',
];

test('rejects every private range, after every accept', () => {
    const rules = getRules(buildHostFirewall({ hostGateway: '192.168.5.2', openings: [] }));
    const rejects = rules.filter(rule => rule.endsWith(' reject with icmpx admin-prohibited'));

    expect(rejects).toEqual([
        'ip daddr { 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 100.64.0.0/10, 169.254.0.0/16 } reject with icmpx admin-prohibited',
        'ip6 daddr { fc00::/7, fe80::/10 } reject with icmpx admin-prohibited',
    ]);
    // nftables applies the first matching verdict, so an accept after a reject would never run, and one before it is
    // the only way through.
    const lastAccept = rules.findLastIndex(rule => rule.endsWith(' accept'));
    expect(lastAccept).toBeLessThan(rules.indexOf(rejects[0]!));
});

test('accepts nothing private but the gateway DNS and DHCP when nothing is opened', () => {
    const rules = getRules(buildHostFirewall({ hostGateway: '192.168.5.2', openings: [] }));

    expect(rules.filter(rule => rule.endsWith(' accept'))).toEqual(BASE_ACCEPTS);
});

test('opens exactly the listed addresses and ports, IPv4 and IPv6', () => {
    const script = buildHostFirewall({
        hostGateway: '192.168.5.2',
        openings: [
            { address: '192.168.5.2', port: 8080 },
            { address: '192.168.1.10', port: 5432 },
            { address: 'fd00::10', port: 22 },
        ],
    });

    expect(getRules(script).filter(rule => rule.endsWith(' accept'))).toEqual([
        ...BASE_ACCEPTS,
        'ip daddr 192.168.5.2 tcp dport 8080 accept',
        'ip daddr 192.168.1.10 tcp dport 5432 accept',
        'ip6 daddr fd00::10 tcp dport 22 accept',
    ]);
});

test('replaces its own table and leaves the rest of the traffic open', () => {
    const script = buildHostFirewall({ hostGateway: '192.168.5.2', openings: [] });

    expect(script).toContain('policy accept;');
    expect(script.startsWith('table inet poweragents\ndelete table inet poweragents\n')).toBe(true);
});

/** The rules of the output chain, in order. */
function getRules(script: string) {
    return script
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.endsWith(' accept') || line.endsWith(' admin-prohibited'));
}
