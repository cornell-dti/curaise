import crypto from "crypto";
import { dkimSign } from "mailauth";
import { extractEmailContent, verifyVenmoDkim } from "../email.dkim";

// One throwaway key pair per signing domain, published through a fake DNS
// resolver so no test touches the network.
function makeKey() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  return {
    privateKey: privateKey.export({ type: "pkcs8", format: "pem" }) as string,
    dnsRecord: `v=DKIM1; k=rsa; p=${publicKey
      .export({ type: "spki", format: "der" })
      .toString("base64")}`,
  };
}

const SELECTOR = "sel";
const keys: Record<string, ReturnType<typeof makeKey>> = {
  "venmo.com": makeKey(),
  "amazonses.com": makeKey(),
  "attacker.com": makeKey(),
};

const resolver = async (name: string, rr: string) => {
  const domain = name.replace(`${SELECTOR}._domainkey.`, "");
  if (rr === "TXT" && name.startsWith(`${SELECTOR}._domainkey.`) && keys[domain]) {
    return [[keys[domain].dnsRecord]];
  }
  const err = new Error(`queryTxt ENOTFOUND ${name}`) as NodeJS.ErrnoException;
  err.code = "ENOTFOUND";
  throw err;
};

const ORDER_ID = "e5fef5f3-830a-4ead-bd13-f906fa928e1e";

function buildMessage(from = "Venmo <venmo@venmo.com>"): string {
  return [
    `From: ${from}`,
    "To: seller@cornell.edu",
    "Subject: Eric So paid you $9.00",
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    `<p class="transaction-note">${ORDER_ID}</p>`,
    "",
  ].join("\r\n");
}

async function sign(message: string, ...domains: string[]): Promise<string> {
  let signed = message;
  for (const signingDomain of domains) {
    const { signatures, errors } = await dkimSign(signed, {
      signatureData: [
        { signingDomain, selector: SELECTOR, privateKey: keys[signingDomain].privateKey },
      ],
    });
    expect(errors).toEqual([]);
    signed = signatures + signed;
  }
  return signed;
}

describe("verifyVenmoDkim", () => {
  it("accepts a message with a valid venmo.com signature", async () => {
    const raw = await sign(buildMessage(), "venmo.com");
    expect(await verifyVenmoDkim(raw, resolver)).toBe(true);
  });

  it("accepts a real Venmo message that Amazon SES also signed", async () => {
    const raw = await sign(buildMessage(), "venmo.com", "amazonses.com");
    expect(await verifyVenmoDkim(raw, resolver)).toBe(true);
  });

  it("accepts a message whose line endings were normalized to LF in transit", async () => {
    const raw = await sign(buildMessage(), "venmo.com");
    expect(await verifyVenmoDkim(raw.replace(/\r\n/g, "\n"), resolver)).toBe(true);
  });

  it("rejects an unsigned message", async () => {
    expect(await verifyVenmoDkim(buildMessage(), resolver)).toBe(false);
  });

  it("rejects when the body was changed after Venmo signed it", async () => {
    const raw = await sign(buildMessage(), "venmo.com");
    const tampered = raw.replace(ORDER_ID, "11111111-2222-3333-4444-555555555555");
    expect(await verifyVenmoDkim(tampered, resolver)).toBe(false);
  });

  it("rejects a From: venmo.com message that only another domain signed", async () => {
    const raw = await sign(buildMessage(), "attacker.com");
    expect(await verifyVenmoDkim(raw, resolver)).toBe(false);
  });

  it("rejects a forged venmo.com signature next to a valid one from another domain", async () => {
    const venmoSigned = await sign(buildMessage(), "venmo.com");
    // Keep Venmo's signature header but swap the body, then let the
    // attacker's own domain sign the result legitimately.
    const forged = venmoSigned.replace(
      ORDER_ID,
      "11111111-2222-3333-4444-555555555555",
    );
    const raw = await sign(forged, "attacker.com");
    expect(await verifyVenmoDkim(raw, resolver)).toBe(false);
  });

  it("rejects a venmo.com-signed message whose From is another address", async () => {
    const raw = await sign(buildMessage("Mallory <mallory@venmo.com>"), "venmo.com");
    expect(await verifyVenmoDkim(raw, resolver)).toBe(false);
  });

  it("rejects a message with a second From header added", async () => {
    const raw = await sign(buildMessage(), "venmo.com");
    const twoFroms = "From: Mallory <mallory@attacker.com>\r\n" + raw;
    expect(await verifyVenmoDkim(twoFroms, resolver)).toBe(false);
  });

  it("rejects when the DKIM key cannot be looked up", async () => {
    const raw = await sign(buildMessage(), "venmo.com");
    const failing = async () => {
      throw new Error("SERVFAIL");
    };
    expect(await verifyVenmoDkim(raw, failing)).toBe(false);
  });

  it("rejects empty input instead of throwing", async () => {
    expect(await verifyVenmoDkim("", resolver)).toBe(false);
  });
});

describe("extractEmailContent", () => {
  it("returns the HTML body of the raw message", async () => {
    const content = await extractEmailContent(buildMessage());
    expect(content).toContain(`<p class="transaction-note">${ORDER_ID}</p>`);
  });

  it("decodes a quoted-printable HTML part of a multipart message", async () => {
    const raw = [
      "From: Venmo <venmo@venmo.com>",
      "MIME-Version: 1.0",
      'Content-Type: multipart/alternative; boundary="b1"',
      "",
      "--b1",
      "Content-Type: text/plain; charset=utf-8",
      "",
      "plain version",
      "--b1",
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: quoted-printable",
      "",
      `<p class=3D"transaction-note">${ORDER_ID}</p>`,
      "--b1--",
      "",
    ].join("\r\n");
    const content = await extractEmailContent(raw);
    expect(content).toContain(`<p class="transaction-note">${ORDER_ID}</p>`);
  });

  it("falls back to the plain text body when there is no HTML part", async () => {
    const raw = [
      "From: Venmo <venmo@venmo.com>",
      "Content-Type: text/plain; charset=utf-8",
      "",
      "plain only",
      "",
    ].join("\r\n");
    expect(await extractEmailContent(raw)).toContain("plain only");
  });
});
