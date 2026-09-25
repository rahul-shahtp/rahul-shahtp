import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runContributionAnimation } from "./generate-contribution-animation.ts";

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { recursive: true, force: true })),
	);
});

describe("runContributionAnimation", () => {
	test("generates a deterministic SVG from a local contribution snapshot", async () => {
		// Given: a temporary JSON snapshot and output path
		const directory = await mkdtemp(join(tmpdir(), "contribution-clock-"));
		temporaryDirectories.push(directory);
		const inputPath = join(directory, "input.json");
		const outputPath = join(directory, "animation.svg");
		const input = [
			{ date: "2026-01-04", level: 0, contributionCount: 0 },
			{ date: "2026-01-05", level: 3, contributionCount: 7 },
			{ date: "2026-01-06", level: 1, contributionCount: 2 },
		];
		await writeFile(inputPath, JSON.stringify(input), "utf8");

		// When: the generator runs in offline mode
		const result = await runContributionAnimation({ inputPath, outputPath });
		const svg = await Bun.file(outputPath).text();

		// Then: it writes the expected animation and reports active days
		expect(result).toEqual({ outputPath, activeDays: 2 });
		expect(svg).toContain('id="binary-clock"');
		expect(svg).toContain('class="bit-register"');
		expect(svg).toContain('class="clock-signal"');
		expect(svg).toContain('data-date="2026-01-05"');
		expect(svg).not.toContain("spaceship");
		expect(svg).not.toContain("pulse");
		expect(svg).not.toContain("snake");
	});
});
