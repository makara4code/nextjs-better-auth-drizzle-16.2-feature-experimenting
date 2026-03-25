"use client";

import type { SortDescriptor } from "@heroui/react";
import type { SortingState } from "@tanstack/react-table";

import {
  Avatar,
  Button,
  Chip,
  Input,
  ListBox,
  Modal,
  Pagination,
  Select,
  Table,
  TextArea,
  cn,
  useOverlayState,
} from "@heroui/react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertTriangleIcon,
  ChevronUpIcon,
  PencilIcon,
  ShieldIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import {
  banPlatformUserAction,
  revokePlatformUserSessionsAction,
  unbanPlatformUserAction,
  updatePlatformUserRoleAction,
} from "@/app/(app)/admin/actions";
import {
  getPlatformRoleLabel,
  normalizePlatformRole,
  platformRoleOptions,
  type PlatformRoleKey,
} from "@/lib/auth/permissions";

type Membership = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  membershipRole: string;
};

export type PlatformUserRow = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  emailVerified: boolean;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  createdAt: string | null;
  memberships: Membership[];
  isCurrentUser: boolean;
};

type PlatformUsersTableProps = {
  canBanUsers: boolean;
  canRevokeSessions: boolean;
  canSetRole: boolean;
  users: PlatformUserRow[];
};

const PAGE_SIZE = 8;

const columnHelper = createColumnHelper<PlatformUserRow>();

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function toSortDescriptor(sorting: SortingState): SortDescriptor | undefined {
  const first = sorting[0];

  if (!first) {
    return undefined;
  }

  return {
    column: first.id,
    direction: first.desc ? "descending" : "ascending",
  };
}

function toSortingState(descriptor?: SortDescriptor): SortingState {
  if (!descriptor) {
    return [];
  }

  return [
    {
      desc: descriptor.direction === "descending",
      id: descriptor.column as string,
    },
  ];
}

function SortableColumnHeader({
  children,
  sortDirection,
}: {
  children: ReactNode;
  sortDirection?: "ascending" | "descending";
}) {
  return (
    <span className="flex items-center justify-between gap-2">
      <span>{children}</span>
      {!!sortDirection && (
        <ChevronUpIcon
          className={cn(
            "size-3 transition-transform duration-100 ease-out",
            sortDirection === "descending" ? "rotate-180" : "",
          )}
        />
      )}
    </span>
  );
}

export function PlatformUsersTable({
  canBanUsers,
  canRevokeSessions,
  canSetRole,
  users,
}: PlatformUsersTableProps) {
  const router = useRouter();
  const manageDialog = useOverlayState();
  const [sorting, setSorting] = useState<SortingState>([
    { desc: true, id: "createdAt" },
  ]);
  const [managingUserId, setManagingUserId] = useState<string | null>(null);
  const [roleValue, setRoleValue] = useState<PlatformRoleKey | "">("");
  const [banReason, setBanReason] = useState("Platform moderation action");
  const [banExpiresIn, setBanExpiresIn] = useState("86400");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const managingUser = useMemo(
    () => users.find((user) => user.id === managingUserId) ?? null,
    [managingUserId, users],
  );

  const totals = useMemo(
    () => ({
      all: users.length,
      operators: users.filter((user) =>
        Boolean(normalizePlatformRole(user.role)),
      ).length,
      banned: users.filter((user) => user.banned).length,
    }),
    [users],
  );

  useEffect(() => {
    if (!manageDialog.isOpen) {
      setManagingUserId(null);
      setActionError(null);
      setRoleValue("");
      setBanReason("Platform moderation action");
      setBanExpiresIn("86400");
    }
  }, [manageDialog.isOpen]);

  useEffect(() => {
    if (managingUser) {
      setRoleValue(normalizePlatformRole(managingUser.role) ?? "");
      setBanReason(managingUser.banReason || "Platform moderation action");
      setBanExpiresIn("86400");
    }
  }, [managingUser]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "User",
        cell: (info) => {
          const user = info.row.original;

          return (
            <div className="flex items-center gap-3">
              <Avatar size="sm" className="ring-1 ring-border/70">
                <Avatar.Fallback className="bg-linear-to-br from-primary/70 via-accent to-primary text-primary-foreground">
                  {getInitials(user.name)}
                </Avatar.Fallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">
                  {user.name}
                  {user.isCurrentUser ? " (You)" : ""}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("role", {
        header: "Platform role",
        cell: (info) => (
          <Chip
            color={
              normalizePlatformRole(info.getValue()) ? "warning" : "default"
            }
            size="sm"
            variant="soft"
          >
            {getPlatformRoleLabel(normalizePlatformRole(info.getValue()))}
          </Chip>
        ),
      }),
      columnHelper.accessor("memberships", {
        id: "memberships",
        header: "Organizations",
        enableSorting: false,
        cell: (info) => {
          const memberships = info.getValue();

          if (!memberships.length) {
            return (
              <span className="text-sm text-muted-foreground">
                No org membership
              </span>
            );
          }

          const primary = memberships[0];

          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {primary.organizationName}
              </span>
              <span className="text-xs text-muted-foreground">
                {memberships.length > 1
                  ? `${memberships.length} organizations`
                  : `${primary.organizationSlug} • ${primary.membershipRole}`}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("banned", {
        header: "Status",
        cell: (info) => {
          const user = info.row.original;

          if (user.banned) {
            return (
              <Chip color="danger" size="sm" variant="soft">
                Banned
              </Chip>
            );
          }

          return (
            <Chip
              color={user.emailVerified ? "success" : "warning"}
              size="sm"
              variant="soft"
            >
              {user.emailVerified ? "Verified" : "Unverified"}
            </Chip>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "Joined",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: (info) => {
          const user = info.row.original;
          const canManage = canSetRole || canBanUsers || canRevokeSessions;

          return canManage ? (
            <div className="flex items-center justify-end gap-2">
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                aria-label={`Manage ${user.name}`}
                onPress={() => {
                  setManagingUserId(user.id);
                  manageDialog.open();
                }}
              >
                <PencilIcon className="size-4" />
              </Button>
            </div>
          ) : null;
        },
      }),
    ],
    [canBanUsers, canRevokeSessions, canSetRole, manageDialog],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: users,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageSize: PAGE_SIZE },
    },
    onSortingChange: setSorting,
    state: { sorting },
  });

  const sortDescriptor = useMemo(() => toSortDescriptor(sorting), [sorting]);
  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  const start = users.length ? pageIndex * PAGE_SIZE + 1 : 0;
  const end = Math.min((pageIndex + 1) * PAGE_SIZE, users.length);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Chip color="default" size="sm" variant="soft">
          All: {totals.all}
        </Chip>
        <Chip color="warning" size="sm" variant="soft">
          Operators: {totals.operators}
        </Chip>
        <Chip color="danger" size="sm" variant="soft">
          Banned: {totals.banned}
        </Chip>
      </div>

      <Modal state={manageDialog}>
        <Modal.Backdrop variant="blur" className="backdrop-blur-md">
          <Modal.Container placement="center" size="cover">
            <Modal.Dialog className="w-[min(56rem,calc(100vw-2rem))] overflow-hidden border border-border/80 bg-card text-foreground shadow-2xl">
              <Modal.Header className="items-start justify-between border-b border-border/70 px-6 pb-4 pt-6">
                <div className="space-y-1">
                  <Modal.Heading className="text-xl font-semibold tracking-tight">
                    Manage platform user
                  </Modal.Heading>
                  <p className="max-w-md text-sm leading-6 text-foreground/75">
                    Review memberships, platform role, and moderation state for
                    the selected user.
                  </p>
                </div>
                <Modal.CloseTrigger className="mt-0.5 rounded-full border border-border/70 bg-background/60 text-foreground/70 transition hover:bg-background hover:text-foreground" />
              </Modal.Header>
              <Modal.Body className="grid gap-5 px-6 py-5 text-foreground md:grid-cols-2">
                {managingUser ? (
                  <>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 md:col-span-2">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm" className="ring-1 ring-border/70">
                          <Avatar.Fallback className="bg-linear-to-br from-primary/70 via-accent to-primary text-primary-foreground">
                            {getInitials(managingUser.name)}
                          </Avatar.Fallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">
                            {managingUser.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {managingUser.email}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Chip
                          color={
                            normalizePlatformRole(managingUser.role)
                              ? "warning"
                              : "default"
                          }
                          size="sm"
                          variant="soft"
                        >
                          {getPlatformRoleLabel(
                            normalizePlatformRole(managingUser.role),
                          )}
                        </Chip>
                        <Chip
                          color={
                            managingUser.banned
                              ? "danger"
                              : managingUser.emailVerified
                                ? "success"
                                : "warning"
                          }
                          size="sm"
                          variant="soft"
                        >
                          {managingUser.banned
                            ? "Banned"
                            : managingUser.emailVerified
                              ? "Verified"
                              : "Unverified"}
                        </Chip>
                        <Chip color="default" size="sm" variant="soft">
                          Joined {formatDate(managingUser.createdAt)}
                        </Chip>
                      </div>
                    </div>

                    <div className="grid gap-3 md:col-span-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <ShieldIcon className="size-4 text-muted-foreground" />
                        Organization memberships
                      </div>
                      {managingUser.memberships.length ? (
                        <div className="flex flex-wrap gap-2">
                          {managingUser.memberships.map((membership) => (
                            <Chip
                              key={`${membership.organizationId}-${membership.membershipRole}`}
                              color="default"
                              size="sm"
                              variant="soft"
                            >
                              {membership.organizationName} (
                              {membership.organizationSlug}) •{" "}
                              {membership.membershipRole}
                            </Chip>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                          No organization memberships yet.
                        </div>
                      )}
                    </div>

                    {canSetRole ? (
                      <form
                        action={() => {
                          if (!managingUser) {
                            return;
                          }

                          setActionError(null);
                          startTransition(async () => {
                            try {
                              const formData = new FormData();
                              formData.set("userId", managingUser.id);
                              formData.set("role", roleValue);
                              await updatePlatformUserRoleAction(formData);
                              manageDialog.close();
                              router.refresh();
                            } catch (error) {
                              setActionError(
                                error instanceof Error
                                  ? error.message
                                  : "Could not update the platform role.",
                              );
                            }
                          });
                        }}
                        className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4"
                      >
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium">Platform role</span>
                          <Select
                            fullWidth
                            selectedKey={roleValue}
                            variant="secondary"
                            isDisabled={managingUser.isCurrentUser}
                            onSelectionChange={(key) => {
                              if (typeof key === "string") {
                                setRoleValue((key as PlatformRoleKey) || "");
                              }
                            }}
                          >
                            <Select.Trigger>
                              <Select.Value />
                              <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                              <ListBox>
                                <ListBox.Item
                                  id=""
                                  textValue="No platform role"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span>No platform role</span>
                                    <ListBox.ItemIndicator />
                                  </div>
                                </ListBox.Item>
                                {platformRoleOptions.map((role) => (
                                  <ListBox.Item
                                    id={role.role}
                                    key={role.role}
                                    textValue={role.label}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <span>{role.label}</span>
                                      <ListBox.ItemIndicator />
                                    </div>
                                  </ListBox.Item>
                                ))}
                              </ListBox>
                            </Select.Popover>
                          </Select>
                        </label>
                        <Button
                          type="submit"
                          variant="primary"
                          isDisabled={
                            managingUser.isCurrentUser || isSubmitting
                          }
                        >
                          Save platform role
                        </Button>
                      </form>
                    ) : null}

                    {canBanUsers ? (
                      managingUser.banned ? (
                        <form
                          action={() => {
                            setActionError(null);
                            startTransition(async () => {
                              try {
                                const formData = new FormData();
                                formData.set("userId", managingUser.id);
                                await unbanPlatformUserAction(formData);
                                manageDialog.close();
                                router.refresh();
                              } catch (error) {
                                setActionError(
                                  error instanceof Error
                                    ? error.message
                                    : "Could not unban the user.",
                                );
                              }
                            });
                          }}
                          className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4"
                        >
                          <div className="flex items-start gap-2 text-sm text-destructive">
                            <AlertTriangleIcon className="mt-0.5 size-4" />
                            <div>
                              <p className="font-medium">
                                User is currently banned.
                              </p>
                              <p className="text-xs text-destructive/80">
                                {managingUser.banReason ||
                                  "No ban reason provided."}
                                {managingUser.banExpires
                                  ? ` Expires ${formatDate(managingUser.banExpires)}.`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="submit"
                            variant="primary"
                            isDisabled={
                              managingUser.isCurrentUser || isSubmitting
                            }
                          >
                            Unban user
                          </Button>
                        </form>
                      ) : (
                        <form
                          action={() => {
                            setActionError(null);
                            startTransition(async () => {
                              try {
                                const formData = new FormData();
                                formData.set("userId", managingUser.id);
                                formData.set("banReason", banReason);
                                formData.set("banExpiresIn", banExpiresIn);
                                await banPlatformUserAction(formData);
                                manageDialog.close();
                                router.refresh();
                              } catch (error) {
                                setActionError(
                                  error instanceof Error
                                    ? error.message
                                    : "Could not ban the user.",
                                );
                              }
                            });
                          }}
                          className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 md:grid-cols-2"
                        >
                          <label className="grid gap-2 text-sm md:col-span-2">
                            <span className="font-medium">Ban reason</span>
                            <TextArea
                              fullWidth
                              value={banReason}
                              variant="secondary"
                              rows={3}
                              disabled={managingUser.isCurrentUser}
                              onChange={(event) =>
                                setBanReason(event.target.value)
                              }
                            />
                          </label>
                          <label className="grid gap-2 text-sm">
                            <span className="font-medium">
                              Ban duration (seconds)
                            </span>
                            <Input
                              fullWidth
                              type="number"
                              min={0}
                              value={banExpiresIn}
                              variant="secondary"
                              disabled={managingUser.isCurrentUser}
                              onChange={(event) =>
                                setBanExpiresIn(event.target.value)
                              }
                            />
                          </label>
                          <Button
                            type="submit"
                            variant="danger-soft"
                            className="md:self-end"
                            isDisabled={
                              managingUser.isCurrentUser || isSubmitting
                            }
                          >
                            Ban user
                          </Button>
                        </form>
                      )
                    ) : null}

                    {canRevokeSessions ? (
                      <form
                        action={() => {
                          setActionError(null);
                          startTransition(async () => {
                            try {
                              const formData = new FormData();
                              formData.set("userId", managingUser.id);
                              await revokePlatformUserSessionsAction(formData);
                              manageDialog.close();
                              router.refresh();
                            } catch (error) {
                              setActionError(
                                error instanceof Error
                                  ? error.message
                                  : "Could not revoke sessions.",
                              );
                            }
                          });
                        }}
                        className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4"
                      >
                        <p className="text-sm text-muted-foreground">
                          Immediately revoke all active sessions for this user.
                        </p>
                        <Button
                          type="submit"
                          variant="secondary"
                          isDisabled={
                            managingUser.isCurrentUser || isSubmitting
                          }
                        >
                          Revoke all sessions
                        </Button>
                      </form>
                    ) : null}

                    {actionError ? (
                      <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
                        {actionError}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Table
        variant="secondary"
        className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
      >
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Platform users"
            className="min-w-[980px]"
            sortDescriptor={sortDescriptor}
            onSortChange={(descriptor) => {
              setSorting(toSortingState(descriptor));
            }}
          >
            <Table.Header>
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <Table.Column
                  key={header.id}
                  allowsSorting={header.column.getCanSort()}
                  id={header.id}
                  isRowHeader={header.id === "name"}
                  className={header.id === "actions" ? "text-end" : undefined}
                >
                  {({ sortDirection }) => (
                    <SortableColumnHeader sortDirection={sortDirection}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </SortableColumnHeader>
                  )}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <Table.Row key={row.id} id={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Cell
                        key={cell.id}
                        className={
                          cell.column.id === "actions" ? "text-end" : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))
              ) : (
                <Table.Row id="empty-state">
                  <Table.Cell>
                    <div className="py-6 pr-4">
                      <p className="font-medium">No platform users found</p>
                      <p className="text-sm text-muted-foreground">
                        Users will appear here after they create an account.
                      </p>
                    </div>
                  </Table.Cell>
                  <Table.Cell />
                  <Table.Cell />
                  <Table.Cell />
                  <Table.Cell />
                  <Table.Cell />
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
        <Table.Footer>
          <Pagination size="sm">
            <Pagination.Summary className="text-foreground/85">
              {start} to {end} of {users.length} results
            </Pagination.Summary>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={!table.getCanPreviousPage()}
                  onPress={() => table.previousPage()}
                >
                  <Pagination.PreviousIcon />
                  Prev
                </Pagination.Previous>
              </Pagination.Item>
              {pages.map((page) => (
                <Pagination.Item key={page}>
                  <Pagination.Link
                    isActive={page === pageIndex + 1}
                    onPress={() => table.setPageIndex(page - 1)}
                  >
                    {page}
                  </Pagination.Link>
                </Pagination.Item>
              ))}
              <Pagination.Item>
                <Pagination.Next
                  isDisabled={!table.getCanNextPage()}
                  onPress={() => table.nextPage()}
                >
                  Next
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </Table.Footer>
      </Table>
    </div>
  );
}
