import crypto from "crypto";
import { Decimal } from "decimal.js";

jest.mock("../email.dkim");
jest.mock("../../order/order.services");
jest.mock("../../../utils/email");

import { parseEmailHandler } from "../email.handlers";
import * as emailDkim from "../email.dkim";
import * as orderServices from "../../order/order.services";

const SIGNING_KEY = "test-signing-key";
const ORDER_ID = "e5fef5f3-830a-4ead-bd13-f906fa928e1e";
const VENMO_HTML = `
  <div class="amount-container__text-high">$</div>
  <div class="amount-container__amount-text">9</div>
  <div class="amount-container__text-high">00</div>
  <p class="transaction-note">${ORDER_ID}</p>`;

function mailgunBody(overrides: Record<string, unknown> = {}) {
  const timestamp = 1700000000;
  const token = "a-token-from-mailgun";
  const signature = crypto
    .createHmac("sha256", SIGNING_KEY)
    .update(timestamp + token)
    .digest("hex");
  return {
    recipient: "pay@curaise.app",
    sender: "venmo@venmo.com",
    from: "Venmo <venmo@venmo.com>",
    subject: "Eric So paid you $9.00",
    "body-plain": "",
    "attachment-count": 0,
    timestamp,
    token,
    signature,
    ...overrides,
  };
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

async function run(body: Record<string, unknown>) {
  const res = mockRes();
  await parseEmailHandler({ body } as any, res);
  return { status: res.status.mock.calls[0][0], json: res.json.mock.calls[0][0] };
}

describe("parseEmailHandler with a raw MIME webhook", () => {
  const originalKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY;
    jest.spyOn(console, "error").mockImplementation(() => {});
    (emailDkim.extractEmailContent as jest.Mock).mockResolvedValue(VENMO_HTML);
    (orderServices.calculateOrderTotal as jest.Mock).mockResolvedValue(
      new Decimal("9.00"),
    );
    (orderServices.confirmOrderPayment as jest.Mock).mockResolvedValue({});
  });

  afterAll(() => {
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY = originalKey;
  });

  it("confirms the order when Venmo's DKIM signature verifies, with no Mailgun DKIM header", async () => {
    (emailDkim.verifyVenmoDkim as jest.Mock).mockResolvedValue(true);

    const result = await run(mailgunBody({ "body-mime": "raw mime" }));

    expect(result).toEqual({ status: 200, json: { message: "ok" } });
    expect(emailDkim.verifyVenmoDkim).toHaveBeenCalledWith("raw mime");
    expect(orderServices.confirmOrderPayment).toHaveBeenCalledWith(
      ORDER_ID,
      "VENMO",
    );
  });

  it("rejects with 406 and leaves the order alone when the signature does not verify", async () => {
    (emailDkim.verifyVenmoDkim as jest.Mock).mockResolvedValue(false);

    const result = await run(mailgunBody({ "body-mime": "raw mime" }));

    expect(result).toEqual({
      status: 406,
      json: { message: "DKIM verification failed" },
    });
    expect(emailDkim.extractEmailContent).not.toHaveBeenCalled();
    expect(orderServices.confirmOrderPayment).not.toHaveBeenCalled();
  });

  it("drops non-Venmo senders before doing any DKIM work", async () => {
    const result = await run(
      mailgunBody({ from: "Someone <a@b.com>", "body-mime": "raw mime" }),
    );

    expect(result).toEqual({ status: 406, json: { message: "ignored sender" } });
    expect(emailDkim.verifyVenmoDkim).not.toHaveBeenCalled();
  });

  it("rejects a webhook that is not signed by Mailgun before anything else", async () => {
    const result = await run(
      mailgunBody({ "body-mime": "raw mime", signature: "0".repeat(64) }),
    );

    expect(result.status).toBe(401);
    expect(emailDkim.verifyVenmoDkim).not.toHaveBeenCalled();
  });

  it("still uses the Mailgun header check when no raw MIME is sent", async () => {
    const result = await run(mailgunBody({ "body-html": VENMO_HTML }));

    expect(result).toEqual({
      status: 406,
      json: { message: "DKIM verification failed" },
    });
    expect(emailDkim.verifyVenmoDkim).not.toHaveBeenCalled();
    expect(orderServices.confirmOrderPayment).not.toHaveBeenCalled();
  });
});
