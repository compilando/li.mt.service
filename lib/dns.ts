import dns from "dns/promises";

/**
 * DNS verification result
 */
export interface DnsVerificationResult {
    verified: boolean;
    error?: string;
    txtRecordFound?: boolean;
    cnameRecordFound?: boolean;
}

/**
 * Verify domain ownership via DNS TXT record
 * 
 * Expected TXT record format:
 * - Name: _limt-challenge.{domain}
 * - Value: {verificationToken}
 * 
 * @param domain - Domain to verify (e.g., "go.acme.com")
 * @param expectedToken - Expected verification token
 */
export async function verifyDomainDNS(
    domain: string,
    expectedToken: string
): Promise<DnsVerificationResult> {
    try {
        // Check TXT record at _limt-challenge.{domain}
        const txtHost = `_limt-challenge.${domain}`;
        
        let txtRecords: string[][] = [];
        try {
            txtRecords = await dns.resolveTxt(txtHost);
        } catch (error: any) {
            // TXT record not found or DNS error
            if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
                return {
                    verified: false,
                    error: `TXT record not found at ${txtHost}. Please add the DNS record and try again.`,
                    txtRecordFound: false,
                };
            }
            throw error;
        }

        // Flatten TXT records (each record can have multiple strings)
        const flattenedRecords = txtRecords.map((record) => record.join(""));
        
        // Check if any record matches the expected token
        const tokenMatch = flattenedRecords.some((record) => 
            record.trim() === expectedToken.trim()
        );

        if (!tokenMatch) {
            return {
                verified: false,
                error: `TXT record found but token doesn't match. Expected: ${expectedToken}`,
                txtRecordFound: true,
            };
        }

        // Optional: Also check for CNAME record pointing to our service
        // This is useful for actual traffic routing in production
        let cnameRecordFound = false;
        try {
            const cnameRecords = await dns.resolveCname(domain);
            // Check if CNAME points to our service (e.g., cname.limt.app)
            // For now, we just verify it exists - in production you'd check the target
            cnameRecordFound = cnameRecords.length > 0;
        } catch (error: any) {
            // CNAME not required for verification, just a nice-to-have
            cnameRecordFound = false;
        }

        return {
            verified: true,
            txtRecordFound: true,
            cnameRecordFound,
        };
    } catch (error: any) {
        console.error("DNS verification error:", error);
        return {
            verified: false,
            error: `DNS verification failed: ${error.message}`,
        };
    }
}

/**
 * Generate a random verification token
 */
export function generateVerificationToken(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const token = Array.from(randomBytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    return `limt-verify-${token}`;
}

/**
 * Get DNS verification instructions for a domain
 */
export function getDnsInstructions(domain: string, token: string) {
    return {
        txtRecord: {
            name: `_limt-challenge.${domain}`,
            type: "TXT",
            value: token,
            ttl: 3600,
        },
        cnameRecord: {
            name: domain,
            type: "CNAME",
            value: "cname.limt.app",
            ttl: 3600,
        },
    };
}
