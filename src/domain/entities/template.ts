/**
 * The public, intentionally-simple template shape a caller sends to describe the
 * fields they want extracted. It is a flat list (no nested objects) and is converted
 * to a canonical JSON Schema internally by `domain/services/template-to-schema`.
 */

/** Leaf types usable as a field or as the element type of an `array` field. */
export type TemplateLeafType =
	| "string"
	| "number"
	| "boolean"
	| "date"
	| "enum";

/** Field types, i.e. leaf types plus `array` (of a leaf type). */
export type TemplateFieldType = TemplateLeafType | "array";

/** Describes the element type of an `array` field (a leaf, never nested). */
export interface TemplateItems {
	type: TemplateLeafType;
	/** Allowed values when the item type is `enum`. */
	values?: string[];
}

export interface TemplateField {
	name: string;
	type: TemplateFieldType;
	required: boolean;
	description?: string;
	/** Allowed values when `type` is `enum`. */
	values?: string[];
	/** Element descriptor when `type` is `array`. */
	items?: TemplateItems;
}

export type Template = TemplateField[];
