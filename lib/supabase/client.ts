/* eslint-disable @typescript-eslint/no-explicit-any */
// Cliente ligero para Supabase usando la API REST nativa (Fetch API).
// Compatible con la sintaxis de @supabase/supabase-js:
//   .from(t).select(cols).eq(c, v).order(c, {ascending}).single() / .maybeSingle()
//   .from(t).insert(rows).select(cols).single()
//   .from(t).update(vals).eq(c, v).select()
//   .from(t).delete().eq(c, v)
//   .rpc(fn, args)

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bavdqhgxwwkvfdusmfzd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdmRxaGd4d3drdmZkdXNtZnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5Nzk2NzAsImV4cCI6MjEwNjU1NTY3MH0.EC1lHjrnVAG6zUpvhtowf7ghARu0YxIZAF71i_f0nvY";

type Result = { data: any; error: any };
type Method = "GET" | "POST" | "PATCH" | "DELETE";

class QueryBuilder implements PromiseLike<Result> {
  private path: string;
  private method: Method = "GET";
  private params = new URLSearchParams();
  private body: any = undefined;
  private returning = false; // pedir la fila de vuelta (insert/update)
  private mode: "many" | "single" | "maybe" = "many";
  private isRpc = false;

  constructor(path: string, method: Method = "GET", body?: any, isRpc = false) {
    this.path = path;
    this.method = method;
    this.body = body;
    this.isRpc = isRpc;
  }

  select(columns: string = "*") {
    this.params.set("select", columns);
    if (this.method !== "GET") this.returning = true;
    return this;
  }

   eq(column: string, value: any) {
    this.params.append(column, `eq.${value}`);
    return this;
  }

  gte(column: string, value: any) {
    this.params.append(column, `gte.${value}`);
    return this;
  }

  gt(column: string, value: any) {
    this.params.append(column, `gt.${value}`);
    return this;
  }

  lte(column: string, value: any) {
    this.params.append(column, `lte.${value}`);
    return this;
  }

  lt(column: string, value: any) {
    this.params.append(column, `lt.${value}`);
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.params.append("order", `${column}.${ascending ? "asc" : "desc"}`);
    return this;
  }

  single() {
    this.mode = "single";
    return this;
  }

  maybeSingle() {
    this.mode = "maybe";
    return this;
  }

  private async execute(): Promise<Result> {
    try {
      const headers: Record<string, string> = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      };

      if (!this.isRpc && this.method !== "GET") {
        headers["Prefer"] = this.returning ? "return=representation" : "return=minimal";
      }
      if (this.mode === "single") headers["Accept"] = "application/vnd.pgrst.object+json";

      const qs = this.params.toString();
      const url = `${SUPABASE_URL}/rest/v1/${this.path}${qs ? `?${qs}` : ""}`;

      const res = await fetch(url, {
        method: this.method,
        headers,
        body: this.body !== undefined ? JSON.stringify(this.body) : undefined,
        cache: "no-store",
      });

      const text = await res.text();

      if (!res.ok) {
        let err: any;
        try {
          err = JSON.parse(text); // { code, message, details, hint }
        } catch {
          err = { message: text || res.statusText };
        }
        if (!err.message) err.message = res.statusText;
        return { data: null, error: err };
      }

      let data: any = text ? JSON.parse(text) : null;
      if (this.mode === "maybe" && Array.isArray(data)) data = data[0] ?? null;
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e?.message || String(e) } };
    }
  }

  then<T1 = Result, T2 = never>(
    onfulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null
  ): PromiseLike<T1 | T2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const supabase = {
  from: (table: string) => ({
    select: (columns: string = "*") => new QueryBuilder(table).select(columns),
    insert: (rows: any) => new QueryBuilder(table, "POST", rows),
    update: (values: any) => new QueryBuilder(table, "PATCH", values),
    delete: () => new QueryBuilder(table, "DELETE"),
  }),
  rpc: (fn: string, args: Record<string, any> = {}) =>
    new QueryBuilder(`rpc/${fn}`, "POST", args, true),
};

export function createClient() {
  return supabase;
}
