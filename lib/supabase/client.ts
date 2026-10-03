/* eslint-disable @typescript-eslint/no-explicit-any */
// Cliente ligero para Supabase usando la API REST nativa (Fetch API)
// Totalmente compatible con la sintaxis de @supabase/supabase-js:
// .from(table).select(...)
// .from(table).insert([...]).select()
// .from(table).update({...}).eq(col, val).select()
// .from(table).delete().eq(col, val)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bavdqhgxwwkvfdusmfzd.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdmRxaGd4d3drdmZkdXNtZnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5Nzk2NzAsImV4cCI6MjEwNjU1NTY3MH0.EC1lHjrnVAG6zUpvhtowf7ghARu0YxIZAF71i_f0nvY";

function getHeaders(additionalHeaders: Record<string, string> = {}) {
  return {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...additionalHeaders,
  };
}

class SupabaseInsertBuilder {
  private table: string;
  private rows: any[];
  private selectCols?: string;

  constructor(table: string, rows: any[]) {
    this.table = table;
    this.rows = rows;
  }

  select(columns: string = "*") {
    this.selectCols = columns;
    return this;
  }

  async then(resolve: (value: { data: any; error: any }) => void, reject?: (reason: any) => void) {
    try {
      let url = `${SUPABASE_URL}/rest/v1/${this.table}`;
      if (this.selectCols) {
        url += `?select=${encodeURIComponent(this.selectCols)}`;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: getHeaders({ "Prefer": "return=representation" }),
        body: JSON.stringify(this.rows),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return resolve({ data: null, error: new Error(errorText) });
      }

      const data = await res.json();
      return resolve({ data, error: null });
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: err });
    }
  }
}

class SupabaseUpdateBuilder {
  private table: string;
  private values: any;
  private column?: string;
  private value?: any;
  private selectCols?: string;

  constructor(table: string, values: any) {
    this.table = table;
    this.values = values;
  }

  eq(column: string, value: any) {
    this.column = column;
    this.value = value;
    return this;
  }

  select(columns: string = "*") {
    this.selectCols = columns;
    return this;
  }

  async then(resolve: (value: { data: any; error: any }) => void, reject?: (reason: any) => void) {
    try {
      let url = `${SUPABASE_URL}/rest/v1/${this.table}`;
      if (this.column) {
        url += `?${this.column}=eq.${encodeURIComponent(this.value)}`;
      }
      if (this.selectCols) {
        url += `${this.column ? "&" : "?"}select=${encodeURIComponent(this.selectCols)}`;
      }

      const res = await fetch(url, {
        method: "PATCH",
        headers: getHeaders({ "Prefer": "return=representation" }),
        body: JSON.stringify(this.values),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return resolve({ data: null, error: new Error(errorText) });
      }

      const data = await res.json();
      return resolve({ data, error: null });
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: err });
    }
  }
}

class SupabaseDeleteBuilder {
  private table: string;
  private column?: string;
  private value?: any;

  constructor(table: string) {
    this.table = table;
  }

  eq(column: string, value: any) {
    this.column = column;
    this.value = value;
    return this;
  }

  async then(resolve: (value: { data: any; error: any }) => void, reject?: (reason: any) => void) {
    try {
      let url = `${SUPABASE_URL}/rest/v1/${this.table}`;
      if (this.column) {
        url += `?${this.column}=eq.${encodeURIComponent(this.value)}`;
      }

      const res = await fetch(url, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return resolve({ data: null, error: new Error(errorText) });
      }

      return resolve({ data: true, error: null });
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: err });
    }
  }
}

class SupabaseSelectBuilder {
  private table: string;
  private selectCols: string;
  private orderCol?: string;
  private ascending: boolean = true;
  private filters: { col: string; op: string; val: any }[] = [];

  constructor(table: string, selectCols: string = "*") {
    this.table = table;
    this.selectCols = selectCols;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.orderCol = column;
    this.ascending = ascending;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ col: column, op: "eq", val: value });
    return this;
  }

  async then(resolve: (value: { data: any; error: any }) => void, reject?: (reason: any) => void) {
    try {
      let url = `${SUPABASE_URL}/rest/v1/${this.table}?select=${encodeURIComponent(this.selectCols)}`;
      if (this.orderCol) {
        url += `&order=${this.orderCol}.${this.ascending ? "asc" : "desc"}`;
      }
      for (const f of this.filters) {
        url += `&${f.col}=${f.op}.${encodeURIComponent(f.val)}`;
      }

      const res = await fetch(url, {
        headers: getHeaders(),
        cache: "no-store",
      });

      if (!res.ok) {
        const errorText = await res.text();
        return resolve({ data: null, error: new Error(errorText) });
      }

      const data = await res.json();
      return resolve({ data, error: null });
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: err });
    }
  }
}

export const supabase = {
  from: (table: string) => ({
    select: (columns: string = "*") => new SupabaseSelectBuilder(table, columns),
    insert: (rows: any[]) => new SupabaseInsertBuilder(table, rows),
    update: (values: any) => new SupabaseUpdateBuilder(table, values),
    delete: () => new SupabaseDeleteBuilder(table),
  }),
};

export function createClient() {
  return supabase;
}
