import type {
	ContributionCalendar,
	ContributionCell,
} from "./contribution-model.ts";

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 270;
export const GRID_X = 129;
export const GRID_Y = 122;
export const CELL_SIZE = 10;
export const CELL_GAP = 4;
export const CELL_STEP = CELL_SIZE + CELL_GAP;
export const CLOCK_DURATION_SECONDS = 12;
export const CLOCK_ROW_STAGGER_SECONDS = 0.85;
export const CLOCK_TRACK_START_X = 42;
export const CLOCK_TRACK_END_X = 958;
export const CLOCK_REGISTER_X = 260;
export const CLOCK_REGISTER_Y = 80;
export const CLOCK_BIT_COUNT = 16;

export type Point = {
	readonly x: number;
	readonly y: number;
};

export type MonthLabel = Point & {
	readonly label: string;
};

const MONTH_NAMES = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

export const cellCoordinates = (column: number, row: number): Point => ({
	x: GRID_X + column * CELL_STEP,
	y: GRID_Y + row * CELL_STEP,
});

export const clockTrackY = (row: number): number =>
	GRID_Y + row * CELL_STEP + CELL_SIZE / 2;

export const clockSignalBegin = (row: number): number =>
	-row * CLOCK_ROW_STAGGER_SECONDS;

export const clockImpactRatio = (x: number, row: number): number => {
	const trackProgress =
		(x - CLOCK_TRACK_START_X) / (CLOCK_TRACK_END_X - CLOCK_TRACK_START_X);
	const rowOffset = (row * CLOCK_ROW_STAGGER_SECONDS) / CLOCK_DURATION_SECONDS;
	return Math.min(1, Math.max(0, trackProgress + rowOffset));
};

export const renderMonthLabels = (
	calendar: ContributionCalendar,
): readonly MonthLabel[] => {
	const labels: MonthLabel[] = [];
	let previousMonth = -1;

	calendar.forEach((week, column) => {
		for (const day of week) {
			if (day === null) {
				continue;
			}
			const date = new Date(`${day.date}T00:00:00Z`);
			const month = date.getUTCMonth();
			if (month !== previousMonth && date.getUTCDate() <= 7) {
				const name = MONTH_NAMES[month];
				if (name !== undefined) {
					labels.push({ x: cellCoordinates(column, 0).x, y: 111, label: name });
					previousMonth = month;
				}
			}
		}
	});

	return labels;
};

export const countActiveDays = (calendar: ContributionCalendar): number =>
	calendar
		.flat()
		.filter((day: ContributionCell) => day !== null && day.level > 0).length;
