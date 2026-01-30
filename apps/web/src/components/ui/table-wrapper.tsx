"use client";

import type React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  width?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface TableWrapperProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (row: T) => string;
  actions?: (row: T) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  hoverable?: boolean;
}

export function TableWrapper<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  actions,
  isLoading = false,
  emptyMessage = "Nessun dato trovato",
  hoverable = true,
}: TableWrapperProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full border border-gray-200 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500 text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            {columns.map((col) => (
              <TableHead key={String(col.key)} className="font-semibold">
                {col.label}
              </TableHead>
            ))}
            {actions && <TableHead className="text-right">Azioni</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={keyExtractor(row)} className={hoverable ? "hover:bg-gray-50" : ""}>
              {columns.map((col) => (
                <TableCell key={String(col.key)}>
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] || "-")}
                </TableCell>
              ))}
              {actions && <TableCell className="text-right">{actions(row)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
