import type { Extraction, NewExtraction } from "@/domain/entities/extraction";
import type { ExtractionRepository } from "@/domain/ports/extraction-repository";

/** In-memory `ExtractionRepository` for HTTP/use-case tests (no DB). */
export interface FakeRepository extends ExtractionRepository {
	saved: Extraction[];
}

export function fakeRepository(): FakeRepository {
	const saved: Extraction[] = [];
	return {
		saved,
		async save(input: NewExtraction): Promise<Extraction> {
			const now = new Date();
			const seq = String(saved.length + 1).padStart(12, "0");
			const row: Extraction = {
				id: `00000000-0000-7000-8000-${seq}`,
				createdAt: now,
				updatedAt: now,
				deletedAt: null,
				sourceType: input.sourceType,
				inputText: input.inputText,
				template: input.template,
				result: input.result ?? null,
				missingFields: input.missingFields ?? [],
				complete: input.complete ?? false,
				provider: input.provider ?? null,
				model: input.model ?? null,
				meta: input.meta ?? {},
			};
			saved.push(row);
			return row;
		},
		async findById(id: string): Promise<Extraction | null> {
			return saved.find((row) => row.id === id) ?? null;
		},
		async softDelete(): Promise<void> {},
	};
}
