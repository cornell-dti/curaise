import { sendVenmoSetupEmail } from "../src/utils/email";

/**
 * Test file for Venmo setup email functionality
 *
 * This test sends a Venmo setup email with instructions for email forwarding.
 *
 * Run with: node --env-file='.env' -r ts-node/register ./tests/testVenmoSetupEmail.ts
 * Or: npm run dev (loads .env automatically)
 */

const testVenmoSetupEmail = async () => {
  // Verify environment variables are loaded
  console.log("Environment check:");
  console.log("- MAILGUN_DOMAIN:", process.env.MAILGUN_DOMAIN || "sandbox082eab5ac11d4c279f63018b4b3d8419.mailgun.org (default)");
  console.log("- MAILGUN_API_KEY:", process.env.MAILGUN_API_KEY ? "✓ Set" : "✗ Not set");

  if (!process.env.MAILGUN_API_KEY) {
    throw new Error("MAILGUN_API_KEY is not set. Run with: node --env-file='.env' -r ts-node/register ./tests/testVenmoSetupEmail.ts");
  }
  console.log();
  const testOptions = {
    venmoEmail: "as4274@cornell.edu", // Replace with actual test email
    fundraiserName: "Test Fundraiser Campaign",
  };

  console.log("Sending Venmo setup email...");
  console.log("Test configuration:", testOptions);

  try {
    await sendVenmoSetupEmail(testOptions);
    console.log(" Venmo setup email sent successfully!");
  } catch (error) {
    console.error(" Failed to send Venmo setup email:", error);
    throw error;
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testVenmoSetupEmail()
    .then(() => {
      console.log("\nTest completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nTest failed:", error);
      process.exit(1);
    });
}

export { testVenmoSetupEmail };
