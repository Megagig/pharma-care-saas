import { Button, Input, Spinner } from '@/components/ui/button';

import * as React from "react"
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
} from "./dropdown-menu"
import { Input } from "./input"
} from "./table"
import { cn } from "../../lib/utils"
import { Spinner } from "./spinner"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  onRowClick?: (row: TData) => void
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  enableSorting?: boolean
  enableFiltering?: boolean
  enablePagination?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  loading?: boolean
  className?: string
  onRowSelectionChange?: (selectedRows: TData[]) => void
}

export function DataTable<TData, TValue>({ 
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  onRowClick,
  enableRowSelection = false,
  enableColumnVisibility = false,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  pageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
  loading = false,
  className,
  onRowSelectionChange}
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  // Add selection column if row selection is enabled
  const tableColumns = React.useMemo(() => {
    if (!enableRowSelection) return columns

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")}
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }

    return [selectionColumn, ...columns]
  }, [columns, enableRowSelection])

  const table = useReactTable({ 
    data,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter}
    },
    initialState: {
      pagination: {
        pageSize,
      },
    }}

  // Handle row selection change callback
    if (onRowSelectionChange && enableRowSelection) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onRowSelectionChange(selectedRows)
    }
  }, [rowSelection, onRowSelectionChange, enableRowSelection, table])

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center py-4">
        {enableFiltering && searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="max-w-sm"
          />
        )}
        {enableColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button  className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)}
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Spinner />
                    <span className="ml-2">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {enablePagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {enableRowSelection && (
              <>
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </>
            )}
          </div>
          <div className="space-x-2">
            <Button
              
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to create sortable column header
export function createSortableHeader(title: string) {
  return ({ column }: { column: any }) => {
    return (
      <Button
        
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        {title}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    )
  }
}

// Helper function to create action column
export function createActionColumn<TData>(
  actions: Array<{
    label: string
    icon: React.ComponentType<{ className?: string }>
    onClick: (row: TData) => void
    show?: (row: TData) => boolean
  }>
): ColumnDef<TData> {
  return {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const visibleActions = actions.filter(action => 
        !action.show || action.show(row.original)
      )

      if (visibleActions.length === 0) return null

      if (visibleActions.length === 1) {
        const action = visibleActions[0]
        const Icon = action.icon
        return (
          <Button
            
            className="h-8 w-8 p-0"
            >
            <span className="sr-only">{action.label}</span>
            <Icon className="h-4 w-4" />
          </Button>
        )
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button  className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {visibleActions.map((action, index) => {
              const Icon = action.icon
              return (
                <DropdownMenuItem
                  key={index}
                  >
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
};