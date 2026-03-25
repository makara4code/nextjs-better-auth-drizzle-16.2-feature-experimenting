import "dotenv/config";

import { Pool } from "pg";

import { auth } from "../lib/auth";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  emailVerified?: boolean;
  createdAt?: Date;
};

type PlatformRoleInput = "global_admin" | "global_superadmin" | "none";
type CommandName =
  | "set-role"
  | "list-users"
  | "create-user"
  | "create-admin"
  | "create-superadmin";

type CliOptions = {
  command: CommandName;
  email: string | null;
  role: PlatformRoleInput;
  listUsers: boolean;
  dryRun: boolean;
  help: boolean;
  name: string | null;
  password: string | null;
  emailVerified: boolean;
};

const usageText = `
cli

Inspect local users, create local users, and manage platform roles.

Usage:
  npm run cli -- --list-users
  npm run cli -- --email you@example.com --role global_admin
  npm run cli -- set-role --email you@example.com --role global_superadmin
  npm run cli -- create-user --email admin@example.com --name "Platform Admin" --password "replace-me" --role global_superadmin
  npm run cli -- create-admin --email admin@example.com --password "replace-me"
  npm run cli -- create-superadmin --email owner@example.com --password "replace-me"

Commands:
  create-user         Create a new local user with credentials
  create-admin        Shortcut for create-user --role global_admin
  create-superadmin   Shortcut for create-user --role global_superadmin
  set-role            Update the platform role on an existing user
  list-users          Print local users and exit

Options:
  --email, -e         Target user email
  --role, -r          Role to assign (global_admin | global_superadmin | none)
  --name, -n          User display name for create-user. Defaults to the email local part.
  --password, -p      Password for create-user
  --dry-run           Show the planned action without mutating the database
  --unverified        Create the user with emailVerified=false. Defaults to verified.
  --list-users        Print local users and exit
  --help, -h          Show this help message

Environment fallbacks:
  GLOBAL_PLATFORM_EMAIL
  GLOBAL_PLATFORM_ROLE
  GLOBAL_PLATFORM_NAME
  GLOBAL_PLATFORM_PASSWORD

Legacy environment fallback aliases:
  GLOBAL_ADMIN_EMAIL
  GLOBAL_ADMIN_ROLE
`.trim();

function fail(message: string): never {
  throw new Error(message);
}

function formatPlatformRole(role: string | null | undefined) {
  if (!role) {
    return "none";
  }

  return role;
}

function normalizeRole(value: string | null | undefined): PlatformRoleInput {
  if (!value) {
    return "global_admin";
  }

  const normalized = value.trim().toLowerCase();

  if (
    normalized === "global_admin" ||
    normalized === "global_superadmin" ||
    normalized === "none"
  ) {
    return normalized;
  }

  fail(
    `Unsupported role "${value}". Allowed roles: global_admin, global_superadmin, none.`,
  );
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? null;
}

function deriveNameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "user";

  return localPart
    .split(/[._-]+/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function parseCommandName(argv: string[]) {
  const firstArg = argv[0];

  if (
    firstArg === "create-user" ||
    firstArg === "create-admin" ||
    firstArg === "create-superadmin" ||
    firstArg === "set-role" ||
    firstArg === "list-users"
  ) {
    return {
      command: firstArg,
      remainingArgs: argv.slice(1),
    } as const;
  }

  return {
    command: "set-role",
    remainingArgs: argv,
  } as const;
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.length === 0) {
    return {
      command: "set-role",
      email: null,
      role: normalizeRole(
        process.env.GLOBAL_PLATFORM_ROLE ?? process.env.GLOBAL_ADMIN_ROLE,
      ),
      listUsers: false,
      dryRun: false,
      help: true,
      name: null,
      password: null,
      emailVerified: true,
    };
  }

  const { command, remainingArgs } = parseCommandName(argv);

  let email: string | null = null;
  let role =
    command === "create-superadmin"
      ? "global_superadmin"
      : command === "create-admin"
        ? "global_admin"
        : command === "create-user"
          ? normalizeRole(process.env.GLOBAL_PLATFORM_ROLE ?? "none")
          : normalizeRole(
              process.env.GLOBAL_PLATFORM_ROLE ?? process.env.GLOBAL_ADMIN_ROLE,
            );
  let listUsers = command === "list-users";
  let dryRun = false;
  let help = false;
  let name = process.env.GLOBAL_PLATFORM_NAME?.trim() ?? null;
  let password = process.env.GLOBAL_PLATFORM_PASSWORD?.trim() ?? null;
  let emailVerified = true;

  for (let index = 0; index < remainingArgs.length; index += 1) {
    const arg = remainingArgs[index];

    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }

    if (arg === "--list-users") {
      listUsers = true;
      continue;
    }

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--unverified") {
      emailVerified = false;
      continue;
    }

    if (arg === "--email" || arg === "-e") {
      const nextValue = remainingArgs[index + 1];

      if (!nextValue) {
        fail("Missing value for --email.");
      }

      email = normalizeEmail(nextValue);
      index += 1;
      continue;
    }

    if (arg === "--role" || arg === "-r") {
      const nextValue = remainingArgs[index + 1];

      if (!nextValue) {
        fail("Missing value for --role.");
      }

      role = normalizeRole(nextValue);
      index += 1;
      continue;
    }

    if (arg === "--name" || arg === "-n") {
      const nextValue = remainingArgs[index + 1];

      if (!nextValue) {
        fail("Missing value for --name.");
      }

      name = nextValue.trim();
      index += 1;
      continue;
    }

    if (arg === "--password" || arg === "-p") {
      const nextValue = remainingArgs[index + 1];

      if (!nextValue) {
        fail("Missing value for --password.");
      }

      password = nextValue;
      index += 1;
      continue;
    }

    if (arg.startsWith("--")) {
      fail(`Unknown option "${arg}". Use --help to see supported flags.`);
    }

    if (!email) {
      email = normalizeEmail(arg);
      continue;
    }

    fail(`Unexpected argument "${arg}". Use --help to see supported flags.`);
  }

  if (!email) {
    email =
      normalizeEmail(process.env.GLOBAL_PLATFORM_EMAIL) ??
      normalizeEmail(process.env.GLOBAL_ADMIN_EMAIL) ??
      null;
  }

  if (command === "list-users") {
    listUsers = true;
  }

  return {
    command,
    email,
    role,
    listUsers,
    dryRun,
    help,
    name,
    password,
    emailVerified,
  };
}

async function listUsers(pool: Pool) {
  const { rows } = await pool.query<UserRow>(
    `
      select
        id,
        name,
        email,
        role,
        "email_verified" as "emailVerified",
        "created_at" as "createdAt"
      from "user"
      order by "created_at" asc
    `,
  );

  if (!rows.length) {
    console.log("No users found.");
    return;
  }

  console.log("Available users:");

  for (const user of rows) {
    console.log(
      `- ${user.email} | ${user.name} | role=${formatPlatformRole(user.role)} | verified=${user.emailVerified ? "yes" : "no"} | created=${user.createdAt?.toISOString() ?? "unknown"}`,
    );
  }
}

async function resolveTargetEmail(pool: Pool, requestedEmail: string | null) {
  if (requestedEmail) {
    return requestedEmail;
  }

  const { rows } = await pool.query<UserRow>(
    `
      select id, name, email, role
      from "user"
      order by "created_at" asc
      limit 2
    `,
  );

  if (rows.length === 0) {
    fail(
      "No users found. Create an account first, then rerun `npm run cli -- create-user --email your@email.com --password your-password`.",
    );
  }

  if (rows.length > 1) {
    fail(
      "Multiple users exist. Pass --email explicitly or run `npm run cli -- --list-users` first.",
    );
  }

  return rows[0].email.toLowerCase();
}

async function findUserByEmail(pool: Pool, email: string) {
  const { rows } = await pool.query<UserRow>(
    `
      select id, name, email, role, "email_verified" as "emailVerified"
      from "user"
      where lower("email") = $1
      limit 1
    `,
    [email],
  );

  return rows[0] ?? null;
}

async function updateUserRole(
  pool: Pool,
  email: string,
  role: PlatformRoleInput,
  dryRun: boolean,
) {
  const existingUser = await findUserByEmail(pool, email);

  if (!existingUser) {
    fail(
      `No user found for ${email}. Create the account first, then rerun the command.`,
    );
  }

  if (dryRun) {
    console.log(
      [
        "Dry run only. No database changes were made.",
        `Target: ${existingUser.name} <${existingUser.email}>`,
        `Current role: ${formatPlatformRole(existingUser.role)}`,
        `Next role: ${role}`,
      ].join("\n"),
    );
    return;
  }

  const nextRole = role === "none" ? null : role;

  const { rows } = await pool.query<UserRow>(
    `
      update "user"
      set "role" = $2,
          "updated_at" = now()
      where lower("email") = $1
      returning id, name, email, role
    `,
    [email, nextRole],
  );

  const user = rows[0];

  if (!user) {
    fail(`Failed to update role for ${email}.`);
  }

  console.log(
    [
      "Platform role updated successfully.",
      `User: ${user.name} <${user.email}>`,
      `Role: ${formatPlatformRole(user.role)}`,
      "Next step: sign out and sign back in to refresh the session role.",
    ].join("\n"),
  );
}

async function createUserAccount(
  pool: Pool,
  options: Pick<
    CliOptions,
    "email" | "name" | "password" | "role" | "dryRun" | "emailVerified"
  >,
) {
  const email = options.email;

  if (!email) {
    fail("Missing email. Pass --email to create a user.");
  }

  if (!options.password) {
    fail(
      "Missing password. Pass --password to create a credential-based user.",
    );
  }

  const existingUser = await findUserByEmail(pool, email);

  if (existingUser) {
    fail(
      `A user with ${email} already exists. Use \`npm run cli -- --email ${email} --role ...\` to update the platform role instead.`,
    );
  }

  const resolvedName =
    options.name?.trim() || deriveNameFromEmail(email) || "Platform User";

  const nextRole =
    options.role === "none"
      ? undefined
      : (options.role as Exclude<PlatformRoleInput, "none">);

  if (options.dryRun) {
    console.log(
      [
        "Dry run only. No database changes were made.",
        `Command: create-user`,
        `Email: ${email}`,
        `Name: ${resolvedName}`,
        `Platform role: ${nextRole ?? "none"}`,
        `Email verified: ${options.emailVerified ? "yes" : "no"}`,
      ].join("\n"),
    );
    return;
  }

  const result = await auth.api.createUser({
    body: {
      email,
      name: resolvedName,
      password: options.password,
      ...(nextRole ? { role: nextRole } : {}),
      data: {
        emailVerified: options.emailVerified,
      },
    },
  });

  console.log(
    [
      "User created successfully.",
      `User: ${result.user.name} <${result.user.email}>`,
      `Platform role: ${formatPlatformRole(result.user.role)}`,
      `Email verified: ${result.user.emailVerified ? "yes" : "no"}`,
      "Next step: sign in with the new credentials.",
    ].join("\n"),
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(usageText);
    return;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    fail("DATABASE_URL is not set.");
  }

  const pool = new Pool({
    connectionString,
  });

  try {
    if (options.listUsers) {
      await listUsers(pool);
      return;
    }

    if (
      options.command === "create-user" ||
      options.command === "create-admin" ||
      options.command === "create-superadmin"
    ) {
      await createUserAccount(pool, options);
      return;
    }

    const email = await resolveTargetEmail(pool, options.email);
    await updateUserRole(pool, email, options.role, options.dryRun);
  } finally {
    await pool.end();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Failed to run cli.");
  process.exitCode = 1;
});
