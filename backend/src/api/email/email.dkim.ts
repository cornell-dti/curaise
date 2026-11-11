import { dkimVerify } from "mailauth";
import { simpleParser } from "mailparser";

const VENMO_DOMAIN = "venmo.com";
const VENMO_ADDRESS = "venmo@venmo.com";

type DnsResolver = (
  name: string,
  rr: string,
) => Promise<string[] | string[][]>;

// DKIM is defined over CRLF line endings. Normalize in case a hop between
// Mailgun and us delivered the raw message with bare LFs.
export type DkimVerdict = "pass" | "fail" | "temperror";

const toCrlf = (rawMime: string) => rawMime.replace(/\r?\n/g, "\r\n");

/**
 * Verifies, from the raw MIME message, that Venmo itself signed this email.
 *
 * We check the DKIM signature ourselves instead of trusting a header added by
 * Mailgun: that header only exists when Mailgun's spam filter runs, and it
 * gives one pass/fail for the whole message even though real Venmo mail
 * carries two signatures (venmo.com and amazonses.com, since Venmo sends
 * through Amazon SES).
 *
 * Passes only when:
 *  - the message has exactly one From header, and it is venmo@venmo.com
 *  - at least one DKIM signature with d=venmo.com verifies against Venmo's
 *    published key, covers the From header, and covers the whole body
 * Signatures from other domains are ignored, valid or not.
 *
 * Returns "temperror" when Venmo's key could not be fetched because of a
 * DNS failure, so the caller can ask Mailgun to retry instead of dropping a
 * real payment.
 */
export async function verifyVenmoDkim(
  rawMime: string,
  resolver?: DnsResolver,
): Promise<DkimVerdict> {
  if (!rawMime) {
    console.error("No raw MIME present to verify DKIM");
    return "fail";
  }

  try {
    const result = await dkimVerify(toCrlf(rawMime), resolver ? { resolver } : {});

    const fromAddresses = (result.headerFrom ?? []).map((a) => a.toLowerCase());
    if (fromAddresses.length !== 1 || fromAddresses[0] !== VENMO_ADDRESS) {
      console.error("DKIM: From header is not venmo@venmo.com:", result.headerFrom);
      return "fail";
    }

    const venmoSignatures = (result.results ?? []).filter(
      (sig) => sig.signingDomain?.toLowerCase() === VENMO_DOMAIN,
    );
    const venmoSignature = venmoSignatures.find(
      (sig) =>
        sig.status?.result === "pass" &&
        String(sig.status?.aligned || "").toLowerCase() === VENMO_DOMAIN &&
        // An l= tag would let content be appended after the signed part
        !sig.canonBodyLengthLimited,
    );
    if (venmoSignature) {
      return "pass";
    }

    console.error(
      "DKIM: no valid venmo.com signature:",
      (result.results ?? []).map((sig) => sig.info),
    );
    return venmoSignatures.some((sig) => sig.status?.result === "temperror")
      ? "temperror"
      : "fail";
  } catch (err) {
    console.error("DKIM verification threw:", err);
    return "fail";
  }
}

/**
 * Pulls the body out of a raw MIME message (decoding multipart and
 * transfer encodings), preferring HTML, the same preference the parsed
 * Mailgun fields get.
 */
export async function extractEmailContent(rawMime: string): Promise<string> {
  const parsed = await simpleParser(toCrlf(rawMime), {
    skipImageLinks: true,
    skipTextToHtml: true,
  });
  return parsed.html || parsed.text || "";
}
