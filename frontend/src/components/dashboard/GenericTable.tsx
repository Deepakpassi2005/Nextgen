import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface GenericTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  action?: React.ReactNode;
}

export function GenericTable<T extends { id: string | number }>({ 
  data, 
  columns, 
  title,
  action 
}: GenericTableProps<T>) {
  return (
    <div className="space-y-4">
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && <h3 className="text-xl font-display font-bold">{title}</h3>}
          {action}
        </div>
      )}
      
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((col, index) => (
                <TableHead key={index} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, rowIndex) => (
                <TableRow key={item.id || rowIndex} className="hover:bg-muted/50 transition-colors">
                  {columns.map((col, colIndex) => (
                    <TableCell key={`${item.id || rowIndex}-${colIndex}`} className={col.className}>
                      {col.cell 
                        ? col.cell(item) 
                        : col.accessorKey 
                          ? String(item[col.accessorKey]) 
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
