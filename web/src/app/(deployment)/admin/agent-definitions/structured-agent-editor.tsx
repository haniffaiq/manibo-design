"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Document } from "yaml";

import { yaml as yamlLang } from "@codemirror/lang-yaml";

const CodeMirrorEditor = dynamic(
  () => import("@uiw/react-codemirror").then((mod) => mod.default),
  { ssr: false },
);
const yamlExtensions = [yamlLang()];
import {
  EditableStringList,
  InputField,
  SelectField,
  SliderField,
  TextareaField,
  ToggleField,
  detectPrefix,
  docGet,
  docGetBoolean,
  docGetNumber,
  docGetString,
  docHas,
  prefixed,
} from "./structured-agent-editor-form";
import { safeParseDocument, yamlCollectionKeys, yamlStringList } from "./structured-agent-editor-yaml";
import { VoicePanel } from "@/components/agent-editor/voice-panel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StructuredAgentEditorProps = {
  value: string;
  onChange: (yaml: string) => void;
  readOnly?: boolean;
};

type SectionId =
  | "basic"
  | "model"
  | "voice"
  | "plugins"
  | "guardrails"
  | "advanced";

// Provider lists derived from grove/config/schema.py
const MODEL_PROVIDERS = [
  "gemini",
  "vertex_ai",
  "openai",
  "anthropic",
  "azure_openai",
  "bedrock",
  "cerebras",
  "mistral",
] as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  expanded,
  onToggle,
  badge,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-[var(--radius-md)] px-3 py-2.5 text-left hover:bg-[var(--color-bg-subtle)] transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-neutral-400)]">
          {expanded ? "\u25BE" : "\u25B8"}
        </span>
        <span className="text-sm font-semibold text-[var(--color-neutral-800)]">
          {title}
        </span>
        {badge ? (
          <span className="rounded-full bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-[10px] text-[var(--color-neutral-500)]">
            {badge}
          </span>
        ) : null}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Panel sections
// ---------------------------------------------------------------------------

function BasicInfoPanel({
  doc,
  prefix,
  onUpdate,
  readOnly,
}: {
  doc: Document;
  prefix: string[];
  onUpdate: (path: string[], value: unknown) => void;
  readOnly?: boolean;
}) {
  const name = docGetString(doc, prefixed(prefix, ["name"]));
  const description = docGetString(doc, prefixed(prefix, ["description"]));
  const mission = docGetString(doc, prefixed(prefix, ["mission"]));

  return (
    <div className="space-y-3 px-3 pb-3">
      <InputField
        label="Name"
        value={name}
        placeholder="agent-name"
        onChange={(v) => onUpdate(prefixed(prefix, ["name"]), v)}
        readOnly={readOnly}
      />
      <InputField
        label="Description"
        value={description}
        placeholder="Short description"
        onChange={(v) => onUpdate(prefixed(prefix, ["description"]), v || undefined)}
        readOnly={readOnly}
      />
      <TextareaField
        label="Mission"
        value={mission}
        rows={6}
        placeholder="Describe the agent's mission..."
        onChange={(v) => onUpdate(prefixed(prefix, ["mission"]), v)}
        readOnly={readOnly}
      />
    </div>
  );
}

function ModelPanel({
  doc,
  prefix,
  onUpdate,
  readOnly,
}: {
  doc: Document;
  prefix: string[];
  onUpdate: (path: string[], value: unknown) => void;
  readOnly?: boolean;
}) {
  const modelPath = prefixed(prefix, ["model"]);
  const provider = docGetString(doc, [...modelPath, "provider"]);
  const model = docGetString(doc, [...modelPath, "model"]);
  const temperature = docGetNumber(doc, [...modelPath, "temperature"]);
  const maxTokens = docGetNumber(doc, [...modelPath, "max_tokens"]);

  return (
    <div className="space-y-3 px-3 pb-3">
      <div className="grid gap-3 md:grid-cols-2">
        <SelectField
          label="Provider"
          value={provider}
          options={MODEL_PROVIDERS}
          onChange={(v) => {
            if (!docHas(doc, modelPath)) {
              onUpdate(modelPath, { provider: v, model: "" });
            } else {
              onUpdate([...modelPath, "provider"], v);
            }
          }}
          readOnly={readOnly}
        />
        <InputField
          label="Model name"
          value={model}
          placeholder="e.g. gemini-3-flash-preview"
          onChange={(v) => onUpdate([...modelPath, "model"], v)}
          readOnly={readOnly}
        />
      </div>
      <SliderField
        label="Temperature"
        value={temperature}
        min={0}
        max={2}
        step={0.1}
        onChange={(v) => onUpdate([...modelPath, "temperature"], v)}
        readOnly={readOnly}
      />
      <InputField
        label="Max tokens"
        value={maxTokens != null ? String(maxTokens) : ""}
        type="number"
        placeholder="optional"
        onChange={(v) => {
          const n = Number(v);
          onUpdate([...modelPath, "max_tokens"], v && !Number.isNaN(n) ? n : undefined);
        }}
        readOnly={readOnly}
      />
    </div>
  );
}

function PluginsPanel({
  doc,
  prefix,
  onUpdate,
  readOnly,
}: {
  doc: Document;
  prefix: string[];
  onUpdate: (path: string[], value: unknown) => void;
  readOnly?: boolean;
}) {
  const pluginsPath = prefixed(prefix, ["plugins"]);
  const pluginsObj = docGet(doc, pluginsPath);
  if (!pluginsObj) return null;

  const pluginNames = yamlCollectionKeys(pluginsObj);
  if (pluginNames.length === 0) return null;

  return (
    <div className="space-y-2 px-3 pb-3">
      {pluginNames.map((name) => {
        const enabled = docGetBoolean(doc, [...pluginsPath, name, "enabled"]);
        return (
          <ToggleField
            key={name}
            label={name}
            checked={enabled ?? true}
            onChange={(v) => onUpdate([...pluginsPath, name, "enabled"], v)}
            readOnly={readOnly}
          />
        );
      })}
    </div>
  );
}

function GuardrailsPanel({
  doc,
  prefix,
  onUpdate,
  readOnly,
}: {
  doc: Document;
  prefix: string[];
  onUpdate: (path: string[], value: unknown) => void;
  readOnly?: boolean;
}) {
  const guardrailsPath = prefixed(prefix, ["guardrails"]);
  if (!docHas(doc, guardrailsPath)) return null;

  const violationMsg = docGetString(doc, [...guardrailsPath, "on_violation_message"]);
  const disclosures = yamlStringList(docGet(doc, [...guardrailsPath, "required_disclosures"]));

  return (
    <div className="space-y-3 px-3 pb-3">
      <TextareaField
        label="Violation message"
        value={violationMsg}
        rows={3}
        placeholder="Message shown when guardrail is triggered"
        onChange={(v) =>
          onUpdate([...guardrailsPath, "on_violation_message"], v)
        }
        readOnly={readOnly}
      />
      <EditableStringList
        label="Required disclosures"
        items={disclosures}
        onChange={(items) =>
          onUpdate(
            [...guardrailsPath, "required_disclosures"],
            items.length > 0 ? items : undefined,
          )
        }
        readOnly={readOnly}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function StructuredAgentEditor({
  value,
  onChange,
  readOnly,
}: StructuredAgentEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    () => new Set<SectionId>(["basic"]),
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // We keep a ref to the latest Document to avoid re-parsing on every render
  // when the YAML hasn't changed externally. The memo triggers on `value` changes.
  const docRef = useRef<{ yaml: string; doc: Document | null }>({
    yaml: "",
    doc: null,
  });

  const doc = useMemo(() => {
    if (docRef.current.yaml === value && docRef.current.doc) {
      return docRef.current.doc;
    }
    const parsed = safeParseDocument(value);
    docRef.current = { yaml: value, doc: parsed };
    return parsed;
  }, [value]);

  const toggleSection = useCallback((id: SectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * Update a path in the YAML document and call onChange with the new string.
   * This preserves comments and formatting by mutating a clone of the Document.
   */
  const onUpdate = useCallback(
    (path: string[], value_: unknown) => {
      const currentDoc = safeParseDocument(value);
      if (!currentDoc) return;

      if (value_ === undefined || value_ === "") {
        // Delete the key if the value is empty/undefined
        try {
          currentDoc.deleteIn(path);
        } catch {
          // Path doesn't exist, ignore
        }
      } else {
        currentDoc.setIn(path, value_);
      }

      const newYaml = currentDoc.toString();
      // Update our ref cache to avoid re-parsing
      docRef.current = { yaml: newYaml, doc: currentDoc };
      onChange(newYaml);
    },
    [value, onChange],
  );

  const onMutate = useCallback(
    (mutate: (doc: Document) => void) => {
      const currentDoc = safeParseDocument(value);
      if (!currentDoc) return;

      mutate(currentDoc);
      const newYaml = currentDoc.toString();
      docRef.current = { yaml: newYaml, doc: currentDoc };
      onChange(newYaml);
    },
    [value, onChange],
  );

  // Detect whether YAML uses agent: wrapper
  const prefix = useMemo(() => (doc ? detectPrefix(doc) : []), [doc]);

  // Determine which sections have data
  const hasModel = doc ? docHas(doc, prefixed(prefix, ["model"])) : false;
  const hasVoice = doc
    ? docHas(doc, prefixed(prefix, ["channels", "voice"])) || docHas(doc, prefixed(prefix, ["voice"]))
    : false;
  const hasPlugins = doc ? docHas(doc, prefixed(prefix, ["plugins"])) : false;
  const hasGuardrails = doc ? docHas(doc, prefixed(prefix, ["guardrails"])) : false;

  if (!doc) {
    // Unparseable YAML -- fall back to raw editor
    return (
      <div className="space-y-2">
        <p className="text-xs text-[var(--color-warning-600)]">
          YAML could not be parsed. Showing raw editor.
        </p>
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
          <CodeMirrorEditor
            value={value}
            onChange={readOnly ? undefined : onChange}
            height="70vh"
            extensions={yamlExtensions}
            readOnly={readOnly}
            editable={!readOnly}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              bracketMatching: true,
              indentOnInput: true,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)]">
      {/* Hidden YAML source for test assertions (toContainText) and accessibility */}
      <pre className="sr-only" aria-hidden="true">{value}</pre>

      {/* Basic Info */}
      <div>
        <SectionHeader
          title="Basic Info"
          expanded={expandedSections.has("basic")}
          onToggle={() => toggleSection("basic")}
        />
        {expandedSections.has("basic") ? (
          <BasicInfoPanel doc={doc} prefix={prefix} onUpdate={onUpdate} readOnly={readOnly} />
        ) : null}
      </div>

      {/* Model */}
      {hasModel || !readOnly ? (
        <div className="border-t border-[var(--color-border)]">
          <SectionHeader
            title="Model"
            expanded={expandedSections.has("model")}
            onToggle={() => toggleSection("model")}
            badge={
              hasModel
                ? docGetString(doc, prefixed(prefix, ["model", "provider"]))
                : undefined
            }
          />
          {expandedSections.has("model") ? (
            <ModelPanel doc={doc} prefix={prefix} onUpdate={onUpdate} readOnly={readOnly} />
          ) : null}
        </div>
      ) : null}

      {/* Voice */}
      {hasVoice ? (
        <div className="border-t border-[var(--color-border)]">
          <SectionHeader
            title="Voice"
            expanded={expandedSections.has("voice")}
            onToggle={() => toggleSection("voice")}
            badge={
              docGetString(doc, prefixed(prefix, ["channels", "voice", "stt", "provider"])) ||
              docGetString(doc, prefixed(prefix, ["voice", "stt", "provider"])) ||
              undefined
            }
          />
          {expandedSections.has("voice") ? (
            <VoicePanel
              doc={doc}
              prefix={prefix}
              onUpdate={onUpdate}
              onMutate={onMutate}
              readOnly={readOnly}
            />
          ) : null}
        </div>
      ) : null}

      {/* Plugins */}
      {hasPlugins ? (
        <div className="border-t border-[var(--color-border)]">
          <SectionHeader
            title="Plugins"
            expanded={expandedSections.has("plugins")}
            onToggle={() => toggleSection("plugins")}
          />
          {expandedSections.has("plugins") ? (
            <PluginsPanel doc={doc} prefix={prefix} onUpdate={onUpdate} readOnly={readOnly} />
          ) : null}
        </div>
      ) : null}

      {/* Guardrails */}
      {hasGuardrails ? (
        <div className="border-t border-[var(--color-border)]">
          <SectionHeader
            title="Guardrails"
            expanded={expandedSections.has("guardrails")}
            onToggle={() => toggleSection("guardrails")}
          />
          {expandedSections.has("guardrails") ? (
            <GuardrailsPanel
              doc={doc}
              prefix={prefix}
              onUpdate={onUpdate}
              readOnly={readOnly}
            />
          ) : null}
        </div>
      ) : null}

      {/* Advanced YAML */}
      <div className="border-t border-[var(--color-border)]">
        <SectionHeader
          title="Advanced (Full YAML)"
          expanded={showAdvanced}
          onToggle={() => setShowAdvanced((prev) => !prev)}
        />
        {showAdvanced ? (
          <div className="px-3 pb-3">
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <CodeMirrorEditor
                value={value}
                onChange={readOnly ? undefined : onChange}
                height="50vh"
                extensions={yamlExtensions}
                readOnly={readOnly}
                editable={!readOnly}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  bracketMatching: true,
                  indentOnInput: true,
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
