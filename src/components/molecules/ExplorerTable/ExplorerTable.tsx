import React from 'react';

import * as S from './styles';

export default function ExplorerTable<Row>(props: {
	label: string;
	rows: Row[];
	columns: {
		key: string;
		label: string;
		description?: string;
		headerAction?: React.ReactNode;
		align?: 'start' | 'end';
		render: (row: Row) => React.ReactNode;
	}[];
	getRowKey: (row: Row) => string;
	getRowLabel?: (row: Row) => string;
	renderRowDetails?: (row: Row) => React.ReactNode;
	onRowClick?: (row: Row) => void;
	minWidth?: number;
	columnLayout?: string;
	roundedBottom?: boolean;
}) {
	const sizing = {
		$columns: props.columns.length,
		$minWidth: props.minWidth,
		$columnLayout: props.columnLayout,
	};
	return (
		<S.Table role="table" aria-label={props.label} $roundedBottom={props.roundedBottom}>
			<S.TableHeader role="row" {...sizing}>
				{props.columns.map((column) => (
					<S.HeaderCell role="columnheader" key={column.key} $align={column.align} title={column.description}>
						<p>{column.label}</p>
						{column.headerAction && <S.HeaderAction>{column.headerAction}</S.HeaderAction>}
					</S.HeaderCell>
				))}
			</S.TableHeader>
			<S.TableBody role="rowgroup" {...sizing} $roundedBottom={props.roundedBottom}>
				{props.rows.map((row) => {
					const details = props.renderRowDetails?.(row);
					return (
						<React.Fragment key={props.getRowKey(row)}>
							<S.TableRow
								{...sizing}
								$expanded={!!details}
								$interactive={!!props.onRowClick}
								role="row"
								tabIndex={props.onRowClick ? 0 : undefined}
								aria-label={props.getRowLabel?.(row)}
								onClick={(event) => {
									if (!(event.target as Element).closest('a, button, input, select, textarea')) props.onRowClick?.(row);
								}}
								onKeyDown={(event) => {
									if (props.onRowClick && event.target === event.currentTarget && event.key === 'Enter') {
										event.preventDefault();
										props.onRowClick(row);
									}
								}}
							>
								{props.columns.map((column) => (
									<S.Cell role="cell" key={column.key} $align={column.align}>
										{column.render(row)}
									</S.Cell>
								))}
							</S.TableRow>
							{details && (
								<S.DetailsRow role="row">
									<S.DetailsCell role="cell" aria-colspan={props.columns.length}>
										{details}
									</S.DetailsCell>
								</S.DetailsRow>
							)}
						</React.Fragment>
					);
				})}
			</S.TableBody>
		</S.Table>
	);
}
