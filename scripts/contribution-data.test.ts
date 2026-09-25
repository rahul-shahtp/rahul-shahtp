import { describe, expect, test } from "bun:test";
import {
	buildContributionWindow,
	parseContributionResponse,
	parseContributionSnapshot,
} from "./contribution-data.ts";
import type { ContributionDay } from "./contribution-model.ts";

describe("parseContributionSnapshot", () => {
	test("accepts a valid flat contribution snapshot", () => {
		// Given: JSON data produced by a local profile scrape
		const input = [
			{ date: "2026-01-04", level: 0, contributionCount: 0 },
			{ date: "2026-01-05", level: 2 },
		] satisfies readonly ContributionDay[];

		// When: the snapshot crosses the trusted boundary
		const days = parseContributionSnapshot(input);

		// Then: only the validated contribution fields survive
		expect(days).toEqual(input);
	});

	test("rejects invalid dates, levels, and negative counts", () => {
		// Given: values that violate the snapshot contract
		const input = [{ date: "2026-02-30", level: 5, contributionCount: -1 }];

		// When: the snapshot is parsed
		// Then: a domain error is raised
		expect(() => parseContributionSnapshot(input)).toThrow(
			"Contribution data is invalid",
		);
	});
});

describe("parseContributionResponse", () => {
	test("flattens GitHub GraphQL contribution weeks", () => {
		// Given: the subset of GitHub's GraphQL response requested by the generator
		const input = {
			data: {
				user: {
					contributionsCollection: {
						contributionCalendar: {
							totalContributions: 3,
							weeks: [
								{
									contributionDays: [
										{
											date: "2026-01-04",
											contributionCount: 0,
											contributionLevel: "NONE",
										},
										{
											date: "2026-01-05",
											contributionCount: 3,
											contributionLevel: "SECOND_QUARTILE",
										},
									],
								},
							],
						},
					},
				},
			},
		};

		// When: the response is parsed
		const days = parseContributionResponse(input);

		// Then: contribution levels are mapped to numeric heat levels
		expect(days).toEqual([
			{ date: "2026-01-04", level: 0, contributionCount: 0 },
			{ date: "2026-01-05", level: 2, contributionCount: 3 },
		]);
	});

	test("surfaces GraphQL errors without exposing request context", () => {
		// Given: an API error response
		const input = { data: null, errors: [{ message: "Bad credentials" }] };

		// When: the response is parsed
		// Then: the API message becomes a typed domain failure
		expect(() => parseContributionResponse(input)).toThrow(
			"GitHub GraphQL error: Bad credentials",
		);
	});
});

describe("buildContributionWindow", () => {
	test("requests a deterministic one-year contribution window", () => {
		// Given: a fixed clock
		const now = new Date("2026-09-25T05:00:00Z");

		// When: the API window is built
		const window = buildContributionWindow(now);

		// Then: the range spans 364 days through the current instant
		expect(window).toEqual({
			from: "2025-09-26T05:00:00.000Z",
			to: "2026-09-25T05:00:00.000Z",
		});
	});
});
