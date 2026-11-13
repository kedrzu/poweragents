/** A private address and TCP port the sandbox may reach, like a port mapping in reverse. */
export interface FirewallOpening {
    /** An IPv4 or IPv6 address: the host gateway for a port on the computer, or a device's address on the LAN. */
    address: string;
    port: number;
}

/** Params of `buildHostFirewall()`. */
export interface BuildHostFirewallParams {
    /** The host as the VM sees it: Lima's gateway, which forwards to the host's loopback and answers DNS. */
    hostGateway: string;
    /** The only private addresses the sandbox may reach, besides the gateway's DNS and DHCP. */
    openings: FirewallOpening[];
}

/** DNS (Lima's host resolver answers on the gateway) and the DHCP lease renewal, which the VM needs to stay online. */
const GATEWAY_SERVICES = ['udp dport { 53, 67 }', 'tcp dport 53'];

/**
 * Private IPv4 ranges: RFC 1918 (home and office networks, the host gateway among them), CGNAT, which Tailscale uses,
 * and link-local, where cloud metadata services answer.
 */
const PRIVATE_IPV4 = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '100.64.0.0/10', '169.254.0.0/16'];

/** Private IPv6 ranges: unique local and link-local addresses. */
const PRIVATE_IPV6 = ['fc00::/7', 'fe80::/10'];

/**
 * Neighbor discovery, which the VM's own link needs (its replies go to link-local addresses). Router advertisements and
 * redirects come in, so only what the VM sends is listed.
 */
const NEIGHBOR_DISCOVERY = 'icmpv6 type { nd-router-solicit, nd-neighbor-solicit, nd-neighbor-advert }';

/**
 * Builds the nftables script that closes the computer and its private networks to the sandbox: the VM, and every
 * container in it, reaches private addresses only through the gateway's DNS and DHCP and the listed `openings`; the
 * internet stays open. Rootless containers' traffic leaves through rootlesskit's process in the VM, so the VM's output
 * hook covers it. Applying the script replaces the table atomically, so it is safe to apply on every start.
 * @__NO_SIDE_EFFECTS__
 */
export function buildHostFirewall(params: BuildHostFirewallParams): string {
    const allowed = GATEWAY_SERVICES.map(match => `ip daddr ${params.hostGateway} ${match}`);
    for (const opening of params.openings) {
        const family = opening.address.includes(':') ? 'ip6' : 'ip';
        allowed.push(`${family} daddr ${opening.address} tcp dport ${opening.port}`);
    }

    return [
        // Declaring the table before deleting it makes the delete succeed when the table does not exist yet.
        'table inet poweragents',
        'delete table inet poweragents',
        'table inet poweragents {',
        '    chain output {',
        '        type filter hook output priority filter; policy accept;',
        // Replies to connections the host opens into the VM (Lima's SSH and port forwards).
        '        ct state established,related accept',
        // The VM's traffic to itself, its own private address included.
        '        oifname "lo" accept',
        `        ${NEIGHBOR_DISCOVERY} accept`,
        ...allowed.map(match => `        ${match} accept`),
        `        ip daddr { ${PRIVATE_IPV4.join(', ')} } reject with icmpx admin-prohibited`,
        `        ip6 daddr { ${PRIVATE_IPV6.join(', ')} } reject with icmpx admin-prohibited`,
        '    }',
        '}',
        '',
    ].join('\n');
}
