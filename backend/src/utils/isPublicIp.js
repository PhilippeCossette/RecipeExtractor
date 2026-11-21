import { BlockList, isIP } from "node:net";

// Addresses a public server should never be made to call (SSRF): loopback, private networks,
// link-local (cloud metadata lives at 169.254.169.254), carrier-grade NAT, multicast, reserved.
const blocked = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
]) {
  blocked.addSubnet(net, prefix, "ipv4");
}
for (const [net, prefix] of [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["64:ff9b::", 96], // NAT64 (wraps IPv4)
  ["100::", 64], // discard
  ["2001:db8::", 32], // documentation
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
]) {
  blocked.addSubnet(net, prefix, "ipv6");
}

/** IPv4 inside an IPv6 address (::ffff:127.0.0.1 or ::ffff:7f00:1), else null. */
function embeddedIpv4(address) {
  const m = address.toLowerCase().match(/^::ffff:(?:([\d.]+)|([\da-f]{1,4}):([\da-f]{1,4}))$/);
  if (!m) return null;
  if (m[1]) return m[1];
  const hi = parseInt(m[2], 16);
  const lo = parseInt(m[3], 16);
  return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
}

/** True when `address` is an IP literal on the public internet. False for private/reserved ones and non-IPs. */
export function isPublicIp(address) {
  const ip = String(address).replace(/^\[|\]$/g, "");
  const version = isIP(ip);
  if (version === 4) return !blocked.check(ip, "ipv4");
  if (version === 6) {
    const v4 = embeddedIpv4(ip);
    return v4 ? isPublicIp(v4) : !blocked.check(ip, "ipv6");
  }
  return false;
}
