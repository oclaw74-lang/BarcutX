import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react'

interface TableProps extends HTMLAttributes<HTMLTableElement> {}

/**
 * Table — semantic data table primitives.
 *
 * Exports: Table, TableHead, TableBody, TableRow, TableHeader, TableCell
 */
function Table({ className = '', children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table
        className={['w-full text-sm text-left', className].join(' ')}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

function TableHead({ className = '', children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={['bg-surface border-b border-border', className].join(' ')}
      {...props}
    >
      {children}
    </thead>
  )
}

function TableBody({ className = '', children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={['divide-y divide-border', className].join(' ')} {...props}>
      {children}
    </tbody>
  )
}

function TableRow({ className = '', children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={['transition-colors hover:bg-white/5', className].join(' ')}
      {...props}
    >
      {children}
    </tr>
  )
}

function TableHeader({ className = '', children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={[
        'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </th>
  )
}

function TableCell({ className = '', children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={['px-4 py-3 text-white', className].join(' ')}
      {...props}
    >
      {children}
    </td>
  )
}

export { Table, TableHead, TableBody, TableRow, TableHeader, TableCell }
