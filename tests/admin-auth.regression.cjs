const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("../frontend/node_modules/typescript");

function loadTypescript(file, mocks) {
  const filename = path.resolve(__dirname, "..", file);
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded.require = (name) =>
    Object.hasOwn(mocks, name) ? mocks[name] : module.require(name);
  loaded._compile(compiled, filename);
  return loaded.exports;
}

test("mutation uses the refreshed browser session when the page token is stale", async () => {
  const originalFetch = global.fetch;
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.test";
  const headers = [];
  global.fetch = async (_url, options) => {
    headers.push(options.headers.Authorization);
    return {
      ok: options.headers.Authorization === "Bearer fresh-token",
      status: options.headers.Authorization === "Bearer fresh-token" ? 200 : 401,
      json: async () => ({ message: "Invalid authorization token", data: {} }),
    };
  };
  try {
    const { mutationFetch } = loadTypescript("frontend/src/lib/fetcher.ts", {
      "@/utils/supabase/client": {
        createClient: () => ({
          auth: { getSession: async () => ({ data: { session: { access_token: "fresh-token" } }, error: null }) },
        }),
      },
    });
    await mutationFetch("/fundraiser/create", { token: "expired-token", body: {} });
    await mutationFetch("/organization/org-id/update", { token: "expired-token", body: {} });
    assert.deepEqual(headers, ["Bearer fresh-token", "Bearer fresh-token"]);
  } finally {
    global.fetch = originalFetch;
    if (originalApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  }
});

test("mutation retries a rejected access token once after session refresh", async () => {
  const originalFetch = global.fetch;
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.test";
  const headers = [];
  let refreshes = 0;
  global.fetch = async (_url, options) => {
    headers.push(options.headers.Authorization);
    const authorized = options.headers.Authorization === "Bearer refreshed-token";
    return {
      ok: authorized,
      status: authorized ? 200 : 401,
      json: async () => ({ message: authorized ? "Created" : "Invalid authorization token", data: {} }),
    };
  };
  try {
    const { mutationFetch } = loadTypescript("frontend/src/lib/fetcher.ts", {
      "@/utils/supabase/client": {
        createClient: () => ({ auth: {
          getSession: async () => ({ data: { session: { access_token: "rejected-token" } }, error: null }),
          refreshSession: async () => {
            refreshes++;
            return { data: { session: { access_token: "refreshed-token" } }, error: null };
          },
        } }),
      },
    });
    await mutationFetch("/fundraiser/create", { body: {} });
    assert.deepEqual(headers, ["Bearer rejected-token", "Bearer refreshed-token"]);
    assert.equal(refreshes, 1);
  } finally {
    global.fetch = originalFetch;
    if (originalApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  }
});

test("organization read includes invited admins so a saved invitation remains visible", async () => {
  let query;
  const { getOrganization } = loadTypescript("backend/src/api/organization/organization.services.ts", {
    "../../utils/prisma": {
      prisma: { organization: { findUnique: async (options) => {
        query = options;
        return { admins: [], pendingAdmins: [{ id: "pending-id", email: "new@cornell.edu" }] };
      } } },
    },
    "../user/user.services": { findUserByEmail: async () => null },
  });
  await getOrganization("org-id");
  assert.equal(query.include.pendingAdmins, true);
});

test("public organization response does not expose pending invitee emails", async () => {
  const organization = {
    id: "org-id",
    admins: [{ id: "admin-id" }],
    pendingAdmins: [{ id: "invite-id", email: "invitee@cornell.edu" }],
  };
  const { getOrganizationHandler } = loadTypescript("backend/src/api/organization/organization.handlers.ts", {
    "./organization.services": { getOrganization: async () => organization },
    common: { CompleteOrganizationSchema: {
      safeParse: (value) => ({ success: true, data: value }),
    } },
    "../user/user.services": {},
    "../../utils/email": {},
  });
  let response;
  const res = {
    locals: {},
    status() { return this; },
    json(value) { response = value; return this; },
  };
  await getOrganizationHandler({ params: { id: "org-id" } }, res);
  assert.deepEqual(response.data.pendingAdmins, []);

  res.locals.user = { id: "admin-id" };
  await getOrganizationHandler({ params: { id: "org-id" } }, res);
  assert.deepEqual(response.data.pendingAdmins, organization.pendingAdmins);
});

test("a registered invitee becomes an active admin when loading their organizations", async () => {
  const updates = [];
  const deleted = [];
  const prisma = {
    user: { findUnique: async () => ({ id: "user-id" }) },
    pendingUser: {
      findMany: async () => [{
        id: "invite-id",
        email: "new@cornell.edu",
        organizations: [{ id: "org-id" }],
      }],
    },
    organization: {
      findMany: async () => [{ id: "org-id", admins: [{ id: "user-id" }] }],
    },
    $transaction: async (fn) => fn({
      organization: { update: async (options) => updates.push(options) },
      pendingUser: { deleteMany: async (options) => deleted.push(options) },
    }),
  };
  const { getUserOrganizations } = loadTypescript("backend/src/api/user/user.services.ts", {
    "../../utils/prisma": { prisma },
    common: {},
  });
  await getUserOrganizations("user-id", "new@cornell.edu");
  assert.deepEqual(updates, [{
    where: { id: "org-id" },
    data: {
      admins: { connect: { id: "user-id" } },
      pendingAdmins: { disconnect: { id: "invite-id" } },
    },
  }]);
  assert.deepEqual(deleted, [{ where: { id: "invite-id" } }]);
});
