import { describe, expect, test } from "bun:test";
import { renderContributionAnimation } from "./contribution-animation.ts";
import {
	CONTRIBUTION_WEEKS,
	type ContributionCalendar,
	type ContributionDay,
	type ContributionLevel,
	normalizeContributionCalendar,
	selectClockTargets,
} from "./contribution-model.ts";

const createDay = (
	date: string,
	level: ContributionLevel,
	contributionCount: number = level,
): ContributionDay => ({ date, level, contributionCount });

const createContinuousDays = (count: number): readonly ContributionDay[] => {
	const start = Date.parse("2026-01-04T00:00:00Z");
	return Array.from({ length: count }, (_, index) => {
		const date = new Date(start + index * 86_400_000)
			.toISOString()
			.slice(0, 10);
		return createDay(date, index % 11 === 0 ? 2 : 0);
	});
};

describe("normalizeContributionCalendar", () => {
	test("creates 53 Sunday-aligned columns when a partial year is supplied", () => {
		// Given: a Sunday-aligned range shorter than one year
		const days = createContinuousDays(70);

		// When: the range is normalized
		const calendar = normalizeContributionCalendar(days);

		// Then: the latest 53-week grid is returned with seven rows per column
		expect(calendar).toHaveLength(CONTRIBUTION_WEEKS);
		expect(calendar.every((week) => week.length === 7)).toBe(true);
		expect(
			calendar
				.flat()
				.filter((day) => day !== null)
				.at(-1)?.date,
		).toBe("2026-03-14");
	});
});

describe("selectClockTargets", () => {
	test("prioritizes higher levels and then newer dates", () => {
		// Given: active cells with different levels and dates
		const calendar: ContributionCalendar = [
			[createDay("2026-01-04", 1), null, null, null, null, null, null],
			[createDay("2026-01-11", 4, 9), null, null, null, null, null, null],
			[createDay("2026-01-18", 2), null, null, null, null, null, null],
		];

		// When: the target budget is smaller than the active-cell count
		const targets = selectClockTargets(calendar, 2);

		// Then: the strongest recent cells win
		expect(targets.map(({ date }) => date)).toEqual([
			"2026-01-11",
			"2026-01-18",
		]);
	});
});

describe("renderContributionAnimation", () => {
	test("renders an accessible, deterministic binary clock without a pulse, spacecraft, or snake", () => {
		// Given: a normalized contribution calendar
		const calendar = normalizeContributionCalendar(createContinuousDays(140));

		// When: the animation is rendered twice
		const first = renderContributionAnimation(calendar);
		const second = renderContributionAnimation(calendar);

		// Then: the output is stable and exposes the intended accessible scene
		expect(first).toBe(second);
		expect(first).toContain('role="img"');
		expect(first).toContain('aria-labelledby="title description"');
		expect(first).toContain('id="binary-clock"');
		expect(first).toContain('class="bit-register"');
		expect(first).toContain('class="clock-signal"');
		expect(first).toContain('class="clock-cell-motion"');
		expect(first).toContain('class="static-clock"');
		expect(first).toContain("prefers-reduced-motion: reduce");
		expect(first).toContain("@media (max-width:480px)");
		expect(first).toContain("data-date=");
		expect(first).not.toContain("spaceship");
		expect(first).not.toContain("pulse");
		expect(first).not.toContain("flight");
		expect(first).not.toContain("shot-motion");
		expect(first).not.toContain("snake");
	});
});
