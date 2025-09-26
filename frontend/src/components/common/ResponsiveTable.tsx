
import { Card, CardContent } from '@/components/ui/button';
// Generic type for table row data
type TableRowData = Record<string, unknown>;
export interface ResponsiveTableColumn<T = TableRowData> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  hideOnMobile?: boolean;
  priority?: number; // Lower numbers have higher priority on mobile
}
export interface ResponsiveTableAction<T = TableRowData> {
  label: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
}
interface ResponsiveTableProps<T = TableRowData> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  actions?: ResponsiveTableAction<T>[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  cardTitle?: (row: T) => string;
  cardSubtitle?: (row: T) => string;
  cardChips?: (
    row: T
  ) => Array<{
    label: string;
    color?:
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning';
  }>;
}
export const ResponsiveTable = <T extends TableRowData = TableRowData>({ 
  data,
  columns,
  actions = [],
  loading = false,
  emptyMessage = 'No data available',
  keyExtractor = (_, index) => index.toString(),
  onRowClick,
  cardTitle,
  cardSubtitle,
  cardChips}
}: ResponsiveTableProps<T>) => {
  const { isMobile } = useResponsive();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = React.useState<T | null>(null);
  const handleActionMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    row: T
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };
  const handleActionMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };
  const handleActionClick = (action: ResponsiveTableAction<T>) => {
    if (selectedRow) {
      action.onClick(selectedRow);
      handleActionMenuClose();
    }
  };
  // Filter and sort columns for mobile display
  const getMobileColumns = () => {
    return columns
      .filter((col) => !col.hideOnMobile)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999))
      .slice(0, 3); // Show only top 3 columns on mobile
  };
  const getCellValue = (
    row: T,
    column: ResponsiveTableColumn<T>,
    index: number
  ) => {
    const value = (row as Record<string, unknown>)[column.key];
    return column.render ? column.render(value, row, index) : value;
  };
  const getVisibleActions = (row: T) => {
    return actions.filter((action) => !action.hidden || !action.hidden(row));
  };
  if (loading) {
    return (
      <div className="">
        <div>Loading...</div>
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="">
        <div color="text.secondary">{emptyMessage}</div>
      </div>
    );
  }
  // Mobile card layout
  if (isMobile) {
    return (
      <div className="">
        {data.map((row, index) => {
          const visibleActions = getVisibleActions(row);
          const mobileColumns = getMobileColumns();
          return (
            <Card
              key={keyExtractor(row, index)}
              onClick={() => onRowClick && onRowClick(row)}
              className="">
              <CardContent className="">
                <div
                  className=""
                >
                  <div className="">
                    {/* Card title and subtitle */}
                    {cardTitle && (
                      <div
                        
                        component="div"
                        className=""
                      >
                        {cardTitle(row)}
                      </div>
                    )}
                    {cardSubtitle && (
                      <div
                        
                        color="text.secondary"
                        className=""
                      >
                        {cardSubtitle(row)}
                      </div>
                    )}
                    {/* Mobile columns */}
                    <div spacing={0.5}>
                      {mobileColumns.map((column) => {
                        const value = getCellValue(row, column, index);
                        if (
                          value === undefined ||
                          value === null ||
                          value === ''
                        )
                          return null;
                        return (
                          <div
                            key={column.key}
                            className=""
                          >
                            <div
                              
                              color="text.secondary"
                              className=""
                            >
                              {column.label}:
                            </div>
                            <div >
                              {value as React.ReactNode}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Card chips */}
                    {cardChips && (
                      <div
                        className=""
                      >
                        {cardChips(row).map((chip, chipIndex) => (
                          <Chip
                            key={chipIndex}
                            label={chip.label}
                            size="small"
                            color={chip.color}
                            
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Actions menu */}
                  {visibleActions.length > 0 && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleActionMenuOpen(e, row)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {/* Actions menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleActionMenuClose}
          >
          {selectedRow &&
            getVisibleActions(selectedRow).map((action, index) => (
              <MenuItem
                key={index}
                onClick={() => handleActionClick(action)}
                disabled={action.disabled && action.disabled(selectedRow)}
              >
                {action.icon && <div>{action.icon}</div>}
                <div>{action.label}</ListItemText>
              </MenuItem>
            ))}
        </Menu>
      </div>
    );
  }
  // Desktop table layout
  return (
    <TableContainer >
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align || 'left'}
                className="">
                {column.label}
              </TableCell>
            ))}
            {actions.length > 0 && (
              <TableCell align="right" className="">
                Actions
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => {
            const visibleActions = getVisibleActions(row);
            return (
              <TableRow
                key={keyExtractor(row, index)}
                hover={!!onRowClick}
                onClick={() => onRowClick && onRowClick(row)}
                className=""
              >
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align || 'left'}>
                    {getCellValue(row, column, index) as React.ReactNode}
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell align="right">
                    <div
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      {visibleActions.map((action, actionIndex) => (
                        <IconButton
                          key={actionIndex}
                          size="small"
                          color={action.color || 'default'}
                          
                          disabled={action.disabled && action.disabled(row)}
                        >
                          {action.icon}
                        </IconButton>
                      ))}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
export default ResponsiveTable;
