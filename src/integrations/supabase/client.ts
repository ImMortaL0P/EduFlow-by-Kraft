// MongoDB Atlas backed client adapter for TrajectX
// Replaces Supabase with a high-performance MongoDB Atlas backend

type AuthStateListener = (event: "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED", session: any) => void;
const authListeners = new Set<AuthStateListener>();

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("trajectx_session") || localStorage.getItem("eduflow_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token || null;
  } catch {
    return null;
  }
}

function getStoredSession(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("trajectx_session") || localStorage.getItem("eduflow_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

class QueryBuilder {
  private collection: string;
  private action: "select" | "insert" | "update" | "delete" = "select";
  private filter: Record<string, any> = {};
  private sortObj?: Record<string, 1 | -1>;
  private limitNum?: number;
  private isSingle = false;
  private isMaybeSingle = false;
  private payload?: any;

  constructor(collection: string) {
    this.collection = collection;
  }

  select(_cols?: string) {
    if (this.action !== "insert" && this.action !== "update") {
      this.action = "select";
    }
    return this;
  }

  eq(field: string, value: any) {
    this.filter[field] = value;
    return this;
  }

  neq(field: string, value: any) {
    this.filter[field] = { $ne: value };
    return this;
  }

  not(field: string, op: string, value: any) {
    if (op === "in") {
      // e.g. .not("status", "in", "(converted,lost)")
      const list = typeof value === "string"
        ? value.replace(/[()]/g, "").split(",").map((s) => s.trim())
        : value;
      this.filter[field] = { $nin: list };
    } else {
      this.filter[field] = { $ne: value };
    }
    return this;
  }

  in(field: string, values: any[]) {
    this.filter[field] = { $in: values };
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    const asc = options?.ascending !== false;
    this.sortObj = { [field]: asc ? 1 : -1 };
    return this;
  }

  limit(n: number) {
    this.limitNum = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  insert(data: any | any[]) {
    this.action = "insert";
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = "update";
    this.payload = data;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  async execute(): Promise<{ data: any; error: any }> {
    try {
      const token = getStoredToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/db/query", {
        method: "POST",
        headers,
        body: JSON.stringify({
          collection: this.collection,
          action: this.action,
          filter: this.filter,
          sort: this.sortObj,
          limit: this.limitNum,
          single: this.isSingle,
          maybeSingle: this.isMaybeSingle,
          data: this.payload,
        }),
      });

      const json = await res.json();
      return {
        data: json.data !== undefined ? json.data : null,
        error: json.error || null,
      };
    } catch (err: any) {
      return {
        data: null,
        error: { message: err.message || "Network error" },
      };
    }
  }

  // Promise-like interface allows `await supabase.from(...).select(...)`
  then(onfulfilled?: (value: { data: any; error: any }) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const supabase = {
  auth: {
    async getUser() {
      const session = getStoredSession();
      if (!session?.access_token) {
        return { data: { user: null }, error: null };
      }
      try {
        const res = await fetch("/api/auth/user", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        return { data: { user: json?.data?.user || session.user || null }, error: null };
      } catch (e: any) {
        return { data: { user: session.user || null }, error: null };
      }
    },

    async getSession() {
      const session = getStoredSession();
      return { data: { session }, error: null };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const res = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        if (json.error) return { data: null, error: json.error };

        const session = json.data.session;
        if (typeof window !== "undefined") {
          localStorage.setItem("trajectx_session", JSON.stringify(session));
          localStorage.setItem("trajectx_token", session.access_token);
        }
        authListeners.forEach((cb) => cb("SIGNED_IN", session));
        return { data: json.data, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },

    async signUp({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: { data?: { full_name?: string } };
    }) {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            full_name: options?.data?.full_name,
          }),
        });
        const json = await res.json();
        if (json.error) return { data: null, error: json.error };

        const session = json.data.session;
        if (typeof window !== "undefined") {
          localStorage.setItem("trajectx_session", JSON.stringify(session));
          localStorage.setItem("trajectx_token", session.access_token);
        }
        authListeners.forEach((cb) => cb("SIGNED_IN", session));
        return { data: json.data, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },

    async signOut() {
      if (typeof window !== "undefined") {
        localStorage.removeItem("trajectx_session");
        localStorage.removeItem("trajectx_token");
        localStorage.removeItem("eduflow_session");
        localStorage.removeItem("eduflow_token");
      }
      authListeners.forEach((cb) => cb("SIGNED_OUT", null));
      return { error: null };
    },

    onAuthStateChange(callback: AuthStateListener) {
      authListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            },
          },
        },
      };
    },
  },

  from(collection: string) {
    return new QueryBuilder(collection);
  },

  async rpc(functionName: string, params: Record<string, any>) {
    try {
      const token = getStoredToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/rpc/${functionName}`, {
        method: "POST",
        headers,
        body: JSON.stringify(params),
      });
      const json = await res.json();
      return {
        data: json.data !== undefined ? json.data : null,
        error: json.error || null,
      };
    } catch (err: any) {
      return {
        data: null,
        error: { message: err.message },
      };
    }
  },
};
