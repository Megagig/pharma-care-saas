// Report Table Component - Real data display
interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  totalRows: number;
  currentPage: number;
  pageSize: number;
}
interface ReportTableProps {
  table: TableData;
  maxHeight?: number;
}
type Order = 'asc' | 'desc';
const ReportTable: React.FC<ReportTableProps> = ({ 
  table,
  maxHeight = 400
}) => {
  const theme = useTheme();
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<number>(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const handleRequestSort = (columnIndex: number) => {
    const isAsc = orderBy === columnIndex && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnIndex);
  };
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  // Sort data
  const sortedRows = React.useMemo(() => {
    if (!table.rows) return [];
    return [...table.rows].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      if (order === 'asc') {
        return aString < bString ? -1 : aString > bString ? 1 : 0;
      } else {
        return aString > bString ? -1 : aString < bString ? 1 : 0;
      }
    });
  }, [table.rows, order, orderBy]);
  // Paginate data
  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const formatCellValue = (value: string | number, columnIndex: number) => {
    // Format specific columns based on their content
    if (typeof value === 'number') {
      // Format percentages
      if (
        String(value).includes('%') ||
        (value <= 1 && value >= 0 && columnIndex > 0)
      ) {
        return `${(value * 100).toFixed(1)}%`;
      }
      // Format large numbers
      if (value > 1000) {
        return value.toLocaleString();
      }
    }
    // Format status values
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (
        lowerValue === 'active' ||
        lowerValue === 'completed' ||
        lowerValue === 'success'
      ) {
        return (
          <Chip label={value} color="success" size="small"  />
        );
      }
      if (
        lowerValue === 'inactive' ||
        lowerValue === 'pending' ||
        lowerValue === 'warning'
      ) {
        return (
          <Chip label={value} color="warning" size="small"  />
        );
      }
      if (
        lowerValue === 'error' ||
        lowerValue === 'failed' ||
        lowerValue === 'critical'
      ) {
        return (
          <Chip label={value} color="error" size="small"  />
        );
      }
    }
    return value;
  };
  if (!table.rows || table.rows.length === 0) {
    return (
      <div>
        <div  gutterBottom>
          {table.title}
        </div>
        <div
          className="">
          <div  color="text.secondary">
            No data available for this table
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div  gutterBottom className="">
        {table.title}
      </div>
      <div className="">
        <TableContainer className="">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {table.headers.map((header, index) => (
                  <TableCell
                    key={index}
                    sortDirection={orderBy === index ? order : false}
                    className=""
                  >
                    <TableSortLabel
                      active={orderBy === index}
                      direction={orderBy === index ? order : 'asc'}
                      onClick={() => handleRequestSort(index)}
                    >
                      {header}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  hover
                  className="">
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>
                      {formatCellValue(cell, cellIndex)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={table.totalRows || table.rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </div>
    </div>
  );
};
export default ReportTable;
