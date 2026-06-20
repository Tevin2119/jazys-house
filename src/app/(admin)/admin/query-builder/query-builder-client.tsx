"use client";

import { useState } from "react";
import { runQuery, saveQuery, deleteSavedQuery } from "./actions";
import type { QueryModel, QueryFilter, QueryConfig } from "./actions";

const MODELS: QueryModel[] = ["Product", "Order", "CateringInquiry", "User", "NewsletterSignup"];

const MODEL_FIELDS: Record<QueryModel, string[]> = {
  Product: ["id", "name", "slug", "price", "stock", "badge", "createdAt"],
  Order: ["id", "status", "total", "currency", "email", "name", "createdAt"],
  CateringInquiry: ["id", "name", "email", "date", "guests", "package", "status", "createdAt"],
  User: ["id", "name", "email", "role", "createdAt"],
  NewsletterSignup: ["id", "email", "createdAt"],
};

const OPERATORS = [
  { value: "equals", label: "=" },
  { value: "contains", label: "contains" },
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "gte", label: ">=" },
  { value: "lte", label: "<=" },
];

interface SavedQueryRow {
  id: string;
  name: string;
  config: unknown;
  createdBy: string;
  createdAt: Date;
}

interface QueryBuilderClientProps {
  savedQueries: SavedQueryRow[];
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (val instanceof Date) return val.toLocaleDateString();
  if (typeof val === "number") return val.toString();
  return String(val);
}

function exportCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const header = cols.join(",");
  const body = rows
    .map((r) => cols.map((c) => JSON.stringify(formatCell(r[c]))).join(","))
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function QueryBuilderClient({ savedQueries: initial }: QueryBuilderClientProps) {
  const [model, setModel] = useState<QueryModel>("Product");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" } | null>(null);
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [savedQueries, setSavedQueries] = useState(initial);
  const [saving, setSaving] = useState(false);

  const fields = MODEL_FIELDS[model];

  function toggleField(f: string) {
    setSelectedFields((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  function addFilter() {
    setFilters((prev) => [
      ...prev,
      { field: fields[0], operator: "equals" as const, value: "" },
    ]);
  }

  function updateFilter(i: number, patch: Partial<QueryFilter>) {
    setFilters((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  function removeFilter(i: number) {
    setFilters((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleRun() {
    setLoading(true);
    try {
      const config: QueryConfig = { model, fields: selectedFields, filters, sort };
      const rows = await runQuery(config);
      setResults(rows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      const config: QueryConfig = { model, fields: selectedFields, filters, sort };
      await saveQuery(saveName.trim(), config);
      setSaveName("");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteSavedQuery(id);
    setSavedQueries((prev) => prev.filter((q) => q.id !== id));
  }

  function loadSaved(q: SavedQueryRow) {
    const cfg = q.config as QueryConfig;
    setModel(cfg.model);
    setSelectedFields(cfg.fields);
    setFilters(cfg.filters);
    setSort(cfg.sort);
    setResults(null);
  }

  const resultCols = results && results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Saved queries */}
      {savedQueries.length > 0 ? (
        <div
          style={{
            background: "#fffdf9",
            border: "1px solid #ece2d2",
            borderRadius: 13,
            padding: "18px 22px",
          }}
        >
          <div
            style={{
              fontFamily: "'Marcellus', serif",
              fontSize: 17,
              marginBottom: 12,
              color: "#2a1f16",
            }}
          >
            Saved Queries
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {savedQueries.map((q) => (
              <div
                key={q.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#f3ede2",
                  border: "1px solid #e6dccb",
                  borderRadius: 8,
                  padding: "6px 12px",
                }}
              >
                <button
                  onClick={() => loadSaved(q)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#2a1f16",
                  }}
                >
                  {q.name}
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#a39685",
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Builder */}
      <div
        style={{
          background: "#fffdf9",
          border: "1px solid #ece2d2",
          borderRadius: 13,
          padding: "22px 22px",
        }}
      >
        {/* Model selector */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#a39685",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Model
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MODELS.map((m) => {
              const active = m === model;
              return (
                <button
                  key={m}
                  onClick={() => {
                    setModel(m);
                    setSelectedFields([]);
                    setFilters([]);
                    setResults(null);
                  }}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: `1px solid ${active ? "#c0563d" : "#e6dccb"}`,
                    background: active ? "#c0563d" : "#f6efe4",
                    color: active ? "#fff" : "#2a1f16",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fields */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#a39685",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Fields (leave all unchecked for all fields)
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {fields.map((f) => {
              const checked = selectedFields.includes(f);
              return (
                <label
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: `1px solid ${checked ? "#c0563d" : "#e6dccb"}`,
                    background: checked ? "#fdf0ec" : "#f6efe4",
                    cursor: "pointer",
                    fontSize: 13,
                    color: checked ? "#c0563d" : "#5c4a3a",
                    fontWeight: checked ? 700 : 400,
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleField(f)}
                    style={{ cursor: "pointer" }}
                  />
                  {f}
                </label>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#a39685",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Filters
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filters.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  value={f.field}
                  onChange={(e) => updateFilter(i, { field: e.target.value })}
                  style={{
                    background: "#f6efe4",
                    border: "1px solid #e6dccb",
                    borderRadius: 7,
                    padding: "7px 10px",
                    fontSize: 13,
                    fontFamily: "inherit",
                    color: "#2a1f16",
                    outline: "none",
                  }}
                >
                  {fields.map((fl) => (
                    <option key={fl} value={fl}>
                      {fl}
                    </option>
                  ))}
                </select>
                <select
                  value={f.operator}
                  onChange={(e) =>
                    updateFilter(i, {
                      operator: e.target.value as QueryFilter["operator"],
                    })
                  }
                  style={{
                    background: "#f6efe4",
                    border: "1px solid #e6dccb",
                    borderRadius: 7,
                    padding: "7px 10px",
                    fontSize: 13,
                    fontFamily: "inherit",
                    color: "#2a1f16",
                    outline: "none",
                  }}
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
                <input
                  value={f.value}
                  onChange={(e) => updateFilter(i, { value: e.target.value })}
                  placeholder="value"
                  style={{
                    background: "#f6efe4",
                    border: "1px solid #e6dccb",
                    borderRadius: 7,
                    padding: "7px 10px",
                    fontSize: 13,
                    fontFamily: "inherit",
                    color: "#2a1f16",
                    outline: "none",
                    minWidth: 120,
                  }}
                />
                <button
                  onClick={() => removeFilter(i)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#a39685",
                    fontSize: 16,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addFilter}
              style={{
                alignSelf: "flex-start",
                background: "#f3ede2",
                border: "1px solid #e6dccb",
                borderRadius: 7,
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                color: "#5c4a3a",
              }}
            >
              + Add Filter
            </button>
          </div>
        </div>

        {/* Sort */}
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#a39685",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Sort
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={sort?.field ?? ""}
              onChange={(e) =>
                setSort(e.target.value ? { field: e.target.value, direction: sort?.direction ?? "desc" } : null)
              }
              style={{
                background: "#f6efe4",
                border: "1px solid #e6dccb",
                borderRadius: 7,
                padding: "7px 10px",
                fontSize: 13,
                fontFamily: "inherit",
                color: "#2a1f16",
                outline: "none",
              }}
            >
              <option value="">Default (createdAt desc)</option>
              {fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {sort ? (
              <select
                value={sort.direction}
                onChange={(e) =>
                  setSort({ ...sort, direction: e.target.value as "asc" | "desc" })
                }
                style={{
                  background: "#f6efe4",
                  border: "1px solid #e6dccb",
                  borderRadius: 7,
                  padding: "7px 10px",
                  fontSize: 13,
                  fontFamily: "inherit",
                  color: "#2a1f16",
                  outline: "none",
                }}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            ) : null}
          </div>
        </div>

        {/* Run button */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleRun}
            disabled={loading}
            style={{
              background: loading ? "#9a7060" : "#c0563d",
              color: "#fff",
              border: "none",
              borderRadius: 9,
              padding: "11px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Running…" : "Run Query"}
          </button>
          {results !== null ? (
            <>
              <button
                onClick={() => exportCsv(results, `${model.toLowerCase()}-export.csv`)}
                style={{
                  background: "#f3ede2",
                  color: "#2a1f16",
                  border: "1px solid #e6dccb",
                  borderRadius: 9,
                  padding: "11px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Export CSV
              </button>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, minWidth: 200 }}>
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Name this query…"
                  style={{
                    flex: 1,
                    background: "#f6efe4",
                    border: "1px solid #e6dccb",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 13,
                    fontFamily: "inherit",
                    outline: "none",
                    color: "#2a1f16",
                  }}
                />
                <button
                  onClick={handleSave}
                  disabled={saving || !saveName.trim()}
                  style={{
                    background: "#2a1f16",
                    color: "#f6efe4",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: saving || !saveName.trim() ? "default" : "pointer",
                    fontFamily: "inherit",
                    opacity: !saveName.trim() ? 0.5 : 1,
                  }}
                >
                  Save
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Results table */}
      {results !== null ? (
        <div
          style={{
            background: "#fffdf9",
            border: "1px solid #ece2d2",
            borderRadius: 13,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 22px",
              borderBottom: "1px solid #ece2d2",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontFamily: "'Marcellus', serif", fontSize: 17, color: "#2a1f16" }}
            >
              Results
            </span>
            <span style={{ fontSize: 13, color: "#8a7c6a" }}>
              {results.length} row{results.length !== 1 ? "s" : ""}
            </span>
          </div>
          {results.length === 0 ? (
            <div style={{ padding: "32px 22px", textAlign: "center", color: "#8a7c6a", fontSize: 14 }}>
              No results found.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      fontSize: 11,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "#a39685",
                      fontWeight: 700,
                      borderBottom: "1px solid #f0e8da",
                    }}
                  >
                    {resultCols.map((col) => (
                      <th
                        key={col}
                        style={{ padding: "10px 16px", textAlign: "left", whiteSpace: "nowrap" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f4ecde" }}>
                      {resultCols.map((col) => (
                        <td
                          key={col}
                          style={{
                            padding: "11px 16px",
                            fontSize: 13,
                            color: "#2a1f16",
                            whiteSpace: "nowrap",
                            maxWidth: 240,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {formatCell(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
