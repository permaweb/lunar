import React from 'react';

import * as S from './styles';

interface CalendarProps {
	selectedDate?: { year: number; month: number; day: number };
	onDateSelect: (date: { year: number; month: number; day: number }) => void;
	minDate?: Date;
	viewDate?: { year: number; month: number };
}

export default function Calendar({ selectedDate, onDateSelect, minDate, viewDate: propViewDate }: CalendarProps) {
	const currentDate = new Date();
	const [viewDate, setViewDate] = React.useState({
		year: propViewDate?.year || selectedDate?.year || currentDate.getFullYear(),
		month: propViewDate?.month || selectedDate?.month || currentDate.getMonth() + 1,
	});

	React.useEffect(() => {
		if (propViewDate) {
			setViewDate(propViewDate);
		}
	}, [propViewDate]);

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];

	const getDaysInMonth = (month: number, year: number): number => {
		return new Date(year, month, 0).getDate();
	};

	const getFirstDayOfMonth = (month: number, year: number): number => {
		return new Date(year, month - 1, 1).getDay();
	};

	const isDateDisabled = (day: number): boolean => {
		if (!minDate) return false;
		const dateToCheck = new Date(viewDate.year, viewDate.month - 1, day);
		// Compare only the date part, not the time
		const minDateOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
		const dateToCheckOnly = new Date(dateToCheck.getFullYear(), dateToCheck.getMonth(), dateToCheck.getDate());
		return dateToCheckOnly < minDateOnly;
	};

	const isSelectedDate = (day: number): boolean => {
		return selectedDate?.year === viewDate.year && selectedDate?.month === viewDate.month && selectedDate?.day === day;
	};

	const isTodayDate = (day: number): boolean => {
		const today = new Date();
		return viewDate.year === today.getFullYear() && viewDate.month === today.getMonth() + 1 && day === today.getDate();
	};

	const handleDateClick = (day: number) => {
		if (isDateDisabled(day)) return;
		onDateSelect({ year: viewDate.year, month: viewDate.month, day });
	};

	const handlePrevMonth = () => {
		if (viewDate.month === 1) {
			setViewDate({ year: viewDate.year - 1, month: 12 });
		} else {
			setViewDate({ ...viewDate, month: viewDate.month - 1 });
		}
	};

	const handleNextMonth = () => {
		if (viewDate.month === 12) {
			setViewDate({ year: viewDate.year + 1, month: 1 });
		} else {
			setViewDate({ ...viewDate, month: viewDate.month + 1 });
		}
	};

	const renderCalendarDays = () => {
		const daysInMonth = getDaysInMonth(viewDate.month, viewDate.year);
		const firstDay = getFirstDayOfMonth(viewDate.month, viewDate.year);
		const days = [];

		for (let i = 0; i < firstDay; i++) {
			days.push(<S.EmptyDay key={`empty-${i}`} />);
		}

		for (let day = 1; day <= daysInMonth; day++) {
			days.push(
				<S.Day
					key={day}
					disabled={isDateDisabled(day)}
					selected={isSelectedDate(day)}
					isToday={isTodayDate(day)}
					onClick={() => handleDateClick(day)}
				>
					{day}
				</S.Day>
			);
		}

		return days;
	};

	return (
		<S.CalendarWrapper>
			<S.Header>
				<S.NavButton onClick={handlePrevMonth}>‹</S.NavButton>
				<S.MonthYear>
					{monthNames[viewDate.month - 1]} {viewDate.year}
				</S.MonthYear>
				<S.NavButton onClick={handleNextMonth}>›</S.NavButton>
			</S.Header>
			<S.DaysHeader>
				<S.DayName>Su</S.DayName>
				<S.DayName>Mo</S.DayName>
				<S.DayName>Tu</S.DayName>
				<S.DayName>We</S.DayName>
				<S.DayName>Th</S.DayName>
				<S.DayName>Fr</S.DayName>
				<S.DayName>Sa</S.DayName>
			</S.DaysHeader>
			<S.DaysGrid>{renderCalendarDays()}</S.DaysGrid>
		</S.CalendarWrapper>
	);
}
