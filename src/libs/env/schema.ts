import type { StaticDecode, TObject, TProperties } from "@sinclair/typebox";

export type EnvSchema<T extends TProperties = TProperties> = TObject<T>;
export type EnvValues<S extends EnvSchema> = StaticDecode<S>;
