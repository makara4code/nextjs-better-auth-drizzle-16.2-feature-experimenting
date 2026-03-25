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
  ChevronUpIcon,
  CirclePlusIcon,
  CopyIcon,
  PencilIcon,
  Trash2Icon,
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
  createProjectAction,
  deleteProjectAction,
  updateProjectAction,
} from "@/app/(app)/projects/actions";
import { projectStatusOptions } from "@/lib/project-constants";

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: "planning" | "active" | "archived";
  createdByName: string;
  createdByEmail: string;
  updatedAt: string;
};

type ProjectsTableProps = {
  canCreateProjects: boolean;
  canDeleteProjects: boolean;
  canUpdateProjects: boolean;
  projects: ProjectRow[];
};

const PAGE_SIZE = 6;

const statusColorMap: Record<
  ProjectRow["status"],
  "success" | "warning" | "default"
> = {
  active: "success",
  planning: "warning",
  archived: "default",
};

const columnHelper = createColumnHelper<ProjectRow>();

function formatProjectId(value: string) {
  return `#${value.replace(/-/g, "").slice(0, 7)}`;
}

function formatTimestamp(value: string) {
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

function ProjectStatusSelect({
  name,
  selectedKey,
  onSelectionChange,
}: {
  name: string;
  selectedKey: ProjectRow["status"];
  onSelectionChange: (key: ProjectRow["status"]) => void;
}) {
  return (
    <Select
      fullWidth
      name={name}
      selectedKey={selectedKey}
      variant="secondary"
      onSelectionChange={(key) => {
        if (typeof key === "string") {
          onSelectionChange(key as ProjectRow["status"]);
        }
      }}
    >
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {projectStatusOptions.map((status) => (
            <ListBox.Item id={status} key={status} textValue={status}>
              <div className="flex items-center justify-between gap-3">
                <span className="capitalize">{status}</span>
                <ListBox.ItemIndicator />
              </div>
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function ProjectsTable({
  canCreateProjects,
  canDeleteProjects,
  canUpdateProjects,
  projects,
}: ProjectsTableProps) {
  const router = useRouter();
  const createDialog = useOverlayState();
  const editDialog = useOverlayState();
  const deleteDialog = useOverlayState();

  const [sorting, setSorting] = useState<SortingState>([
    { desc: true, id: "updatedAt" },
  ]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [createStatus, setCreateStatus] =
    useState<ProjectRow["status"]>("planning");
  const [editStatus, setEditStatus] =
    useState<ProjectRow["status"]>("planning");
  const [projectRows, setProjectRows] = useState<ProjectRow[]>(projects);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null,
  );
  const [isCreating, startCreateTransition] = useTransition();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const totals = useMemo(
    () => ({
      all: projectRows.length,
      active: projectRows.filter((project) => project.status === "active").length,
      planning: projectRows.filter((project) => project.status === "planning")
        .length,
      archived: projectRows.filter((project) => project.status === "archived")
        .length,
    }),
    [projectRows],
  );

  const editingProject = useMemo(
    () => projectRows.find((project) => project.id === editingProjectId) ?? null,
    [editingProjectId, projectRows],
  );
  const deletingProject = useMemo(
    () => projectRows.find((project) => project.id === deletingProjectId) ?? null,
    [deletingProjectId, projectRows],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "Project ID",
        cell: (info) => {
          const project = info.row.original;

          return (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {formatProjectId(project.id)}
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={`Copy project id for ${project.name}`}
                onPress={() => {
                  void navigator.clipboard.writeText(project.id);
                }}
              >
                <CopyIcon className="size-4 text-muted-foreground" />
              </Button>
            </div>
          );
        },
      }),
      columnHelper.accessor("name", {
        header: "Project",
        cell: (info) => {
          const project = info.row.original;

          return (
            <div className="flex items-center gap-3">
              <Avatar size="sm" className="ring-1 ring-border/70">
                <Avatar.Fallback className="bg-linear-to-br from-primary/70 via-accent to-primary text-primary-foreground">
                  {getInitials(project.name)}
                </Avatar.Fallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">
                  {project.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {project.description || project.slug}
                </span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("createdByName", {
        header: "Owner",
        cell: (info) => {
          const project = info.row.original;

          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {project.createdByName}
              </span>
              <span className="text-xs text-muted-foreground">
                {project.createdByEmail}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => (
          <Chip
            color={statusColorMap[info.getValue()]}
            size="sm"
            variant="soft"
          >
            <span className="capitalize">{info.getValue()}</span>
          </Chip>
        ),
      }),
      columnHelper.accessor("updatedAt", {
        header: "Updated",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatTimestamp(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: (info) => {
          const project = info.row.original;

          return (
            <div className="flex items-center justify-end gap-2">
              {canUpdateProjects ? (
                <Button
                  isIconOnly
                  size="sm"
                  variant="tertiary"
                  aria-label={`Edit ${project.name}`}
                  onPress={() => {
                    setEditingProjectId(project.id);
                    setEditStatus(project.status);
                    editDialog.open();
                  }}
                >
                  <PencilIcon className="size-4" />
                </Button>
              ) : null}
              {canDeleteProjects ? (
                <Button
                  isIconOnly
                  size="sm"
                  variant="danger-soft"
                  aria-label={`Delete ${project.name}`}
                  onPress={() => {
                    setDeletingProjectId(project.id);
                    deleteDialog.open();
                  }}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              ) : null}
            </div>
          );
        },
      }),
    ],
    [canDeleteProjects, canUpdateProjects, deleteDialog, editDialog],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: projectRows,
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
  const start = projectRows.length ? pageIndex * PAGE_SIZE + 1 : 0;
  const end = Math.min((pageIndex + 1) * PAGE_SIZE, projectRows.length);

  useEffect(() => {
    setProjectRows(projects);
  }, [projects]);

  useEffect(() => {
    if (!createDialog.isOpen) {
      setCreateError(null);
      setCreateStatus("planning");
    }
  }, [createDialog.isOpen]);

  useEffect(() => {
    if (!editDialog.isOpen) {
      setEditError(null);
      setEditingProjectId(null);
      setEditStatus("planning");
    }
  }, [editDialog.isOpen]);

  useEffect(() => {
    if (!deleteDialog.isOpen) {
      setDeleteError(null);
      setDeletingProjectId(null);
    }
  }, [deleteDialog.isOpen]);

  useEffect(() => {
    if (editingProject) {
      setEditStatus(editingProject.status);
    }
  }, [editingProject]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "All", value: totals.all, color: "default" as const },
              {
                label: "Active",
                value: totals.active,
                color: "success" as const,
              },
              {
                label: "Planning",
                value: totals.planning,
                color: "warning" as const,
              },
              {
                label: "Archived",
                value: totals.archived,
                color: "default" as const,
              },
            ].map((item) => (
              <Chip
                key={item.label}
                color={item.color}
                size="sm"
                variant="soft"
              >
                {item.label}: {item.value}
              </Chip>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            TanStack powers the sorting and paging, while HeroUI handles the
            rendering layer.
          </p>
        </div>

        {canCreateProjects ? (
          <Button variant="primary" onPress={createDialog.open}>
            <CirclePlusIcon className="size-4" />
            New project
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your role can browse projects but cannot create new ones.
          </p>
        )}
      </div>

      <Modal state={createDialog}>
        <Modal.Backdrop variant="blur" className="backdrop-blur-md">
          <Modal.Container placement="center" size="lg">
            <Modal.Dialog className="w-[min(56rem,calc(100vw-2rem))] overflow-hidden border border-border/80 bg-card text-foreground shadow-2xl">
              <Modal.Header className="items-start justify-between border-b border-border/70 px-6 pb-4 pt-6">
                <div className="space-y-1">
                  <Modal.Heading className="text-xl font-semibold tracking-tight">
                    Create project
                  </Modal.Heading>
                  <p className="max-w-md text-sm leading-6 text-foreground/75">
                    Add a new tenant-scoped project for this organization.
                  </p>
                </div>
                <Modal.CloseTrigger className="mt-0.5 rounded-full border border-border/70 bg-background/60 text-foreground/70 transition hover:bg-background hover:text-foreground" />
              </Modal.Header>
              <Modal.Body className="px-6 py-5 text-foreground">
                <form
                  action={(formData) => {
                    setCreateError(null);

                    startCreateTransition(async () => {
                      try {
                        const createdProject = await createProjectAction(formData);

                        setProjectRows((currentRows) => [
                          createdProject,
                          ...currentRows,
                        ]);
                        createDialog.close();
                        router.refresh();
                      } catch (error) {
                        setCreateError(
                          error instanceof Error
                            ? error.message
                            : "Could not create the project.",
                        );
                      }
                    });
                  }}
                  className="grid gap-5 md:grid-cols-2"
                >
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      Project name
                    </span>
                    <Input
                      fullWidth
                      name="name"
                      required
                      placeholder="Quarterly reporting platform"
                      variant="secondary"
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-foreground">Status</span>
                    <ProjectStatusSelect
                      name="status"
                      selectedKey={createStatus}
                      onSelectionChange={setCreateStatus}
                    />
                  </label>
                  <label className="grid gap-2 text-sm md:col-span-2">
                    <span className="font-medium text-foreground">
                      Description
                    </span>
                    <TextArea
                      fullWidth
                      name="description"
                      rows={4}
                      placeholder="A short summary of what this project is responsible for."
                      variant="secondary"
                    />
                  </label>
                  {createError ? (
                    <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
                      {createError}
                    </p>
                  ) : null}
                  <Modal.Footer className="mt-1 border-t border-border/70 px-0 pb-0 pt-4 md:col-span-2">
                    <Button
                      variant="ghost"
                      onPress={createDialog.close}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button
                      isDisabled={isCreating}
                      type="submit"
                      variant="primary"
                      className="min-w-36"
                    >
                      {isCreating ? "Creating..." : "Create project"}
                    </Button>
                  </Modal.Footer>
                </form>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={editDialog}>
        <Modal.Backdrop variant="blur" className="backdrop-blur-md">
          <Modal.Container placement="center" size="lg">
            <Modal.Dialog className="w-[min(56rem,calc(100vw-2rem))] overflow-hidden border border-border/80 bg-card text-foreground shadow-2xl">
              <Modal.Header className="items-start justify-between border-b border-border/70 px-6 pb-4 pt-6">
                <div className="space-y-1">
                  <Modal.Heading className="text-xl font-semibold tracking-tight">
                    Edit project
                  </Modal.Heading>
                  <p className="max-w-md text-sm leading-6 text-foreground/75">
                    Update the selected project without leaving the table view.
                  </p>
                </div>
                <Modal.CloseTrigger className="mt-0.5 rounded-full border border-border/70 bg-background/60 text-foreground/70 transition hover:bg-background hover:text-foreground" />
              </Modal.Header>
              <Modal.Body className="px-6 py-5 text-foreground">
                {editingProject ? (
                  <form
                    action={(formData) => {
                      setEditError(null);

                      startUpdateTransition(async () => {
                        try {
                          const updatedProject = await updateProjectAction(formData);

                          setProjectRows((currentRows) =>
                            currentRows.map((project) =>
                              project.id === updatedProject.id
                                ? {
                                    ...project,
                                    description: updatedProject.description,
                                    name: updatedProject.name,
                                    slug: updatedProject.slug,
                                    status: updatedProject.status,
                                    updatedAt: updatedProject.updatedAt,
                                  }
                                : project,
                            ),
                          );
                          editDialog.close();
                          router.refresh();
                      } catch (error) {
                          setEditError(
                            error instanceof Error
                              ? error.message
                              : "Could not update the project.",
                          );
                        }
                      });
                    }}
                    className="grid gap-5 md:grid-cols-2"
                  >
                    <input
                      type="hidden"
                      name="projectId"
                      value={editingProject.id}
                    />
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        Project name
                      </span>
                      <Input
                        fullWidth
                        name="name"
                        defaultValue={editingProject.name}
                        required
                        variant="secondary"
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        Status
                      </span>
                      <ProjectStatusSelect
                        name="status"
                        selectedKey={editStatus}
                        onSelectionChange={setEditStatus}
                      />
                    </label>
                    <label className="grid gap-2 text-sm md:col-span-2">
                      <span className="font-medium text-foreground">
                        Description
                      </span>
                      <TextArea
                        fullWidth
                        name="description"
                        defaultValue={editingProject.description ?? ""}
                        rows={4}
                        variant="secondary"
                      />
                    </label>
                    {editError ? (
                      <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
                        {editError}
                      </p>
                    ) : null}
                    <Modal.Footer className="mt-1 border-t border-border/70 px-0 pb-0 pt-4 md:col-span-2">
                      <Button
                        variant="ghost"
                        onPress={editDialog.close}
                        type="button"
                      >
                        Cancel
                      </Button>
                      <Button
                        isDisabled={isUpdating}
                        type="submit"
                        variant="primary"
                        className="min-w-36"
                      >
                        {isUpdating ? "Saving..." : "Save changes"}
                      </Button>
                    </Modal.Footer>
                  </form>
                ) : null}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={deleteDialog}>
        <Modal.Backdrop variant="blur" className="backdrop-blur-md">
          <Modal.Container placement="center" size="lg">
            <Modal.Dialog className="w-[min(56rem,calc(100vw-2rem))] overflow-hidden border border-border/80 bg-card text-foreground shadow-2xl">
              <Modal.Header className="items-start justify-between border-b border-border/70 px-6 pb-4 pt-6">
                <div className="space-y-1">
                  <Modal.Heading className="text-xl font-semibold tracking-tight">
                    Delete project
                  </Modal.Heading>
                  <p className="max-w-md text-sm leading-6 text-foreground/75">
                    Are you sure you want to delete this record?
                  </p>
                </div>
                <Modal.CloseTrigger className="mt-0.5 rounded-full border border-border/70 bg-background/60 text-foreground/70 transition hover:bg-background hover:text-foreground" />
              </Modal.Header>
              <Modal.Body className="space-y-4 px-6 py-5 text-foreground">
                {deletingProject ? (
                  <>
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/8 p-4">
                      <p className="text-sm font-semibold text-foreground">
                        {deletingProject.name}
                      </p>
                      <p className="mt-1 text-sm text-foreground/75">
                        {deletingProject.slug}
                      </p>
                    </div>
                  </>
                ) : null}
                {deleteError ? (
                  <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {deleteError}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer className="border-t border-border/70 px-6 py-4">
                <Button
                  variant="ghost"
                  type="button"
                  onPress={deleteDialog.close}
                >
                  Cancel
                </Button>
                <Button
                  isDisabled={!deletingProject || isDeleting}
                  type="button"
                  variant="danger"
                  className="min-w-32"
                  onPress={() => {
                    if (!deletingProject) {
                      return;
                    }

                    setDeleteError(null);

                    startDeleteTransition(async () => {
                      try {
                        const formData = new FormData();

                        formData.set("projectId", deletingProject.id);
                        const deletedProject = await deleteProjectAction(formData);

                        setProjectRows((currentRows) =>
                          currentRows.filter(
                            (project) => project.id !== deletedProject.id,
                          ),
                        );
                        deleteDialog.close();
                        router.refresh();
                      } catch (error) {
                        setDeleteError(
                          error instanceof Error
                            ? error.message
                            : "Could not delete the project.",
                        );
                      }
                    });
                  }}
                >
                  {isDeleting ? "Deleting..." : "Delete project"}
                </Button>
              </Modal.Footer>
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
            aria-label="Organization projects"
            className="min-w-[960px]"
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
                      <p className="font-medium">No projects yet</p>
                      <p className="text-sm text-muted-foreground">
                        Open the create dialog to add the first tenant-scoped
                        project.
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
              {start} to {end} of {projectRows.length} results
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
