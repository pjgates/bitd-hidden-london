#!/usr/bin/env tsx
/**
 * Convert Hidden London vault markdown into Foundry VTT compendium JSON.
 *
 * Pipelines:
 *   1. entities/  → hidden-london-factions (JournalEntry)
 *   2. reference/ → hidden-london-reference (JournalEntry)
 *   3. reference/hidden-london-districts.md → hidden-london-locations (JournalEntry)
 *
 * Usage:
 *   tsx scripts/convert-vault.ts [--vault <path>] [--include-unpublished] [--dry-run]
 */
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import matter from "gray-matter";
import { marked } from "marked";
import { createHash } from "node:crypto";

// ─── Configuration ──────────────────────────────────────────────────────────

const DEFAULT_VAULT = path.resolve(import.meta.dirname, "..", "vault", "codex", "hidden-london");

const PACKS = {
    factions: "hidden-london-factions",
    locations: "hidden-london-locations",
    reference: "hidden-london-reference",
} as const;

// ─── CLI args (simple) ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const vaultDir = getArg("--vault") ?? DEFAULT_VAULT;
const includeUnpublished = args.includes("--include-unpublished");
const dryRun = args.includes("--dry-run");

function getArg(flag: string): string | undefined {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : undefined;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate a deterministic Foundry-style 16-char hex ID from a string key. */
function generateId(key: string): string {
    return createHash("sha256").update(key).digest("hex").slice(0, 16);
}

/** Strip Obsidian wikilinks: [[target|label]] → label, [[target]] → target */
function stripWikilinks(text: string): string {
    return text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2").replace(/\[\[([^\]]+)\]\]/g, "$1");
}

/** Strip secret/GM-only blocks (%%Secret%% ... end of section or file). */
function stripSecrets(text: string): string {
    return text.replace(/%%Secret%%[\s\S]*?(?=\n##|\n---|\n$|$)/gi, "");
}

/** Convert markdown to HTML, stripping wikilinks and image embeds first. */
async function mdToHtml(md: string): Promise<string> {
    let cleaned = stripWikilinks(md);
    // Remove image embeds ![[filename]]
    cleaned = cleaned.replace(/!\[\[[^\]]+\]\]/g, "");
    return await marked.parse(cleaned);
}

interface Frontmatter {
    type?: string;
    title?: string;
    tags?: string[];
    published?: boolean;
    tier?: number;
    [key: string]: unknown;
}

interface ParsedFile {
    frontmatter: Frontmatter;
    body: string;
    filename: string;
}

async function parseMarkdownFile(filepath: string): Promise<ParsedFile> {
    const raw = await readFile(filepath, "utf-8");
    const { data, content } = matter(raw);
    return {
        frontmatter: data as Frontmatter,
        body: content,
        filename: path.basename(filepath, ".md"),
    };
}

function shouldInclude(fm: Frontmatter): boolean {
    if (includeUnpublished) return true;
    return fm.published !== false;
}

/** Build a Foundry JournalEntry JSON document with a single text page. */
function buildJournalEntry(
    id: string,
    name: string,
    htmlContent: string,
    folderId?: string,
): Record<string, unknown> {
    const pageId = generateId(`${id}-page-1`);
    return {
        _id: id,
        name,
        folder: folderId ?? null,
        pages: [
            {
                _id: pageId,
                name,
                type: "text",
                text: { content: htmlContent, format: 1 },
                sort: 0,
            },
        ],
        sort: 0,
        ownership: { default: 0 },
        flags: {},
        _stats: { systemId: "blades-in-the-dark", systemVersion: "6.0.5", coreVersion: "13.351" },
    };
}

/** Build a Foundry Folder JSON document. */
function buildFolder(id: string, name: string, type: string): Record<string, unknown> {
    return {
        _id: id,
        name,
        type,
        sort: 0,
        color: null,
        flags: {},
    };
}

async function writeJson(dir: string, filename: string, data: Record<string, unknown>): Promise<void> {
    if (dryRun) {
        console.log(`  [dry-run] Would write: ${filename}`);
        return;
    }
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), JSON.stringify(data, null, 2) + "\n");
}

// ─── Conversion Pipelines ───────────────────────────────────────────────────

const rootDir = path.resolve(import.meta.dirname, "..");

async function convertFactions(): Promise<void> {
    const entitiesDir = path.join(vaultDir, "entities");
    const outDir = path.join(rootDir, "packs", "_source", PACKS.factions);

    if (!existsSync(entitiesDir)) {
        console.log(`  Skip factions: ${entitiesDir} not found`);
        return;
    }

    const files = (await readdir(entitiesDir)).filter((f) => f.endsWith(".md")).sort();
    console.log(`Converting ${files.length} entity files → ${PACKS.factions}`);

    // Create category folders
    const factionFolderId = generateId("folder-factions");
    const characterFolderId = generateId("folder-characters");
    await writeJson(outDir, "_folder_factions.json", buildFolder(factionFolderId, "Factions", "JournalEntry"));
    await writeJson(outDir, "_folder_characters.json", buildFolder(characterFolderId, "Characters", "JournalEntry"));

    for (const file of files) {
        const parsed = await parseMarkdownFile(path.join(entitiesDir, file));
        if (!shouldInclude(parsed.frontmatter)) {
            console.log(`    Skip (unpublished): ${file}`);
            continue;
        }

        const title = parsed.frontmatter.title ?? parsed.filename;
        const id = generateId(`faction-${parsed.filename}`);
        const body = stripSecrets(parsed.body);
        const html = await mdToHtml(body);

        const isFaction = parsed.frontmatter.type === "Faction" ||
            parsed.frontmatter.tags?.includes("Faction");
        const folderId = isFaction ? factionFolderId : characterFolderId;

        const doc = buildJournalEntry(id, title, html, folderId);
        await writeJson(outDir, `${parsed.filename}.json`, doc);
        console.log(`    ${title}`);
    }
}

async function convertReference(): Promise<void> {
    const refDir = path.join(vaultDir, "reference");
    const outDir = path.join(rootDir, "packs", "_source", PACKS.reference);

    if (!existsSync(refDir)) {
        console.log(`  Skip reference: ${refDir} not found`);
        return;
    }

    const files = (await readdir(refDir))
        .filter((f) => f.endsWith(".md"))
        // Districts goes to locations pack, not reference
        .filter((f) => f !== "hidden-london-districts.md")
        .sort();

    console.log(`Converting ${files.length} reference files → ${PACKS.reference}`);

    for (const file of files) {
        const parsed = await parseMarkdownFile(path.join(refDir, file));
        if (!shouldInclude(parsed.frontmatter)) {
            console.log(`    Skip (unpublished): ${file}`);
            continue;
        }

        const title = parsed.frontmatter.title ?? parsed.filename;
        const id = generateId(`ref-${parsed.filename}`);
        const html = await mdToHtml(stripSecrets(parsed.body));
        const doc = buildJournalEntry(id, title, html);
        await writeJson(outDir, `${parsed.filename}.json`, doc);
        console.log(`    ${title}`);
    }
}

async function convertLocations(): Promise<void> {
    const refDir = path.join(vaultDir, "reference");
    const outDir = path.join(rootDir, "packs", "_source", PACKS.locations);
    const districtsFile = path.join(refDir, "hidden-london-districts.md");

    if (!existsSync(districtsFile)) {
        console.log(`  Skip locations: ${districtsFile} not found`);
        return;
    }

    console.log(`Converting districts → ${PACKS.locations}`);

    const parsed = await parseMarkdownFile(districtsFile);
    if (!shouldInclude(parsed.frontmatter)) {
        console.log(`    Skip (unpublished): hidden-london-districts.md`);
        return;
    }

    // Split the districts file by H3 sections to create one JournalEntry per district
    const body = stripSecrets(parsed.body);
    const sections = body.split(/(?=^### )/m);

    // Preamble (before first H3) gets its own entry
    const preamble = sections.shift();
    if (preamble && preamble.trim()) {
        const id = generateId("loc-districts-overview");
        const html = await mdToHtml(preamble);
        const doc = buildJournalEntry(id, "Districts Overview", html);
        await writeJson(outDir, "districts-overview.json", doc);
        console.log(`    Districts Overview`);
    }

    // Each H3 section becomes a district entry
    for (const section of sections) {
        const titleMatch = section.match(/^### (.+)/m);
        if (!titleMatch) continue;

        const title = titleMatch[1].trim();
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const id = generateId(`loc-${slug}`);
        const html = await mdToHtml(section);
        const doc = buildJournalEntry(id, title, html);
        await writeJson(outDir, `${slug}.json`, doc);
        console.log(`    ${title}`);
    }
}

// ─── Main ───────────────────────────────────────────────────────────────────

console.log(`\nConverting Hidden London vault: ${vaultDir}`);
console.log(`Options: includeUnpublished=${includeUnpublished}, dryRun=${dryRun}\n`);

await convertFactions();
await convertReference();
await convertLocations();

console.log("\nDone.");
