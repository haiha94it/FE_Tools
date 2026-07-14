import React from 'react';
import { DataTable } from 'primereact/datatable';

export default function PaginatorBasicDemo({
  setPage,
  totalRecords,
  allData,
  first,
  setFirst,
  rows,
  setRows,
  listColumn,
}) {
  return (
    <div className="card h-100 layout-datatable w-100">
      <DataTable
        totalRecords={totalRecords || 0}
        value={allData}
        lazy
        paginator
        rows={rows}
        first={first}
        onPage={(e) => {
          if (e.page !== undefined) {
            setPage(e.page + 1);
          }
          setFirst(e.first);
          setRows(e.rows);
        }}
        rowsPerPageOptions={[50, 100, 200]}
      // pageLinkSize={3}
      >
        {listColumn}
      </DataTable>
    </div>
  );
}
