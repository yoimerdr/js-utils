export type Nullable<Ty> = Ty | undefined | null;
export type StringNullable = Nullable<string>
export type SpanNullableElement = Nullable<HTMLSpanElement>
export interface UriQueryParam {
  key: string,
  value: string,
}