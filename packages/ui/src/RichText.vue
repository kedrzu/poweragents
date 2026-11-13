<!-- Markdown the agent wrote, shown as formatted text: headings, lists, links opening outside the app, code and tables. Raw HTML shows as text; only web and mail links become links. -->

<script lang="ts">
export const RichTextProps = {
  /** Markdown (CommonMark with GitHub's tables, strikethrough and autolinks). */
  markdown: { type: String, required: true },
  /** A blinking caret after the last word, while the agent is still writing. */
  caret: Boolean,
} as const;
</script>

<script lang="ts" setup>
import { assertNever } from '@nzyme/utils/assertNever.js';
import type { Definition, Root, RootContent, TableCell, TableRow } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import { computed, h, useCssModule } from 'vue';
import type { VNodeArrayChildren, VNodeChild } from 'vue';

import { isExternalLinkUrl } from '@poweragents/common/utils/isExternalLinkUrl.js';

const props = defineProps(RichTextProps);

const style = useCssModule();
const root = computed(() =>
  fromMarkdown(props.markdown, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] }),
);

/** Link and image references resolve against the document's definitions. */
const definitions = computed(() => collectDefinitions(root.value));

// The tree is rendered to virtual nodes, never to an HTML string: nothing the model writes reaches the DOM as markup.
function Content() {
  const children = root.value.children;
  const rendered = children.map((node, index) =>
    renderNode(node, props.caret && index === children.length - 1 && carriesCaret(node)),
  );
  const last = children.at(-1);
  if (props.caret && (last === undefined || !carriesCaret(last))) {
    rendered.push(renderCaret());
  }
  return rendered;
}

function renderNode(node: RootContent, caret = false): VNodeChild {
  switch (node.type) {
    case 'paragraph':
      return h('p', withCaret(renderChildren(node.children), caret));
    case 'heading':
      // The conversation's screen has its own title, so the agent's top heading is a level below it.
      return h(
        `h${Math.min(node.depth + 1, 6)}`,
        { class: style[`richText_heading${Math.min(node.depth, 3)}`] },
        withCaret(renderChildren(node.children), caret),
      );
    case 'text':
      return node.value;
    case 'emphasis':
      return h('em', renderChildren(node.children));
    case 'strong':
      return h('strong', renderChildren(node.children));
    case 'delete':
      return h('del', renderChildren(node.children));
    case 'inlineCode':
      return h('code', { class: style['richText_inlineCode'] }, node.value);
    case 'break':
      return h('br');
    case 'thematicBreak':
      return h('hr');
    case 'blockquote':
      return h('blockquote', renderChildren(node.children));
    case 'list':
      return h(
        node.ordered ? 'ol' : 'ul',
        { start: node.ordered && node.start != null && node.start !== 1 ? node.start : undefined },
        renderChildren(node.children),
      );
    case 'listItem':
      return h('li', renderListItem(node.children, node.spread ?? false));
    case 'code':
      return h('pre', { class: style['richText_code'] }, h('code', node.value));
    case 'link':
      return renderLink(node.url, renderChildren(node.children));
    case 'linkReference':
      return renderLink(definitions.value.get(node.identifier)?.url, renderChildren(node.children));
    case 'image':
      // Never loaded: an image from the model's output could track the person. Its description links to it instead.
      return renderLink(node.url, node.alt ?? node.url);
    case 'imageReference':
      return renderLink(definitions.value.get(node.identifier)?.url, node.alt ?? '');
    case 'html':
      // Raw HTML is shown as the text it is.
      return node.value;
    case 'table':
      // A wide table scrolls sideways; focusable, so the keyboard scrolls it too.
      return h('div', { class: style['richText_tableScroll'], tabindex: 0 }, h('table', renderTable(node.children)));
    case 'tableRow':
    case 'tableCell':
      // Rendered by their table.
      return null;
    case 'definition':
    case 'footnoteDefinition':
    case 'footnoteReference':
    case 'yaml':
      return null;
    default:
      return assertNever(node);
  }
}

function renderChildren(children: readonly RootContent[]) {
  return children.map(child => renderNode(child));
}

/** A tight list's items hold their text without paragraph spacing. */
function renderListItem(children: readonly RootContent[], spread: boolean) {
  if (spread) {
    return renderChildren(children);
  }
  return children.map(child => (child.type === 'paragraph' ? renderChildren(child.children) : renderNode(child)));
}

function renderTable(rows: readonly TableRow[]) {
  const [head, ...body] = rows;
  return [
    head &&
      h(
        'thead',
        h(
          'tr',
          head.children.map(cell => renderCell('th', cell)),
        ),
      ),
    h(
      'tbody',
      body.map(row =>
        h(
          'tr',
          row.children.map(cell => renderCell('td', cell)),
        ),
      ),
    ),
  ];
}

function renderCell(tag: 'th' | 'td', cell: TableCell) {
  return h(tag, renderChildren(cell.children));
}

/** A link opening outside the app, for web and mail addresses only; anything else (`javascript:`, `data:`, a relative path) stays text. */
function renderLink(url: string | undefined, children: string | VNodeArrayChildren) {
  if (url === undefined || !isExternalLinkUrl(url)) {
    return h('span', children);
  }
  return h('a', { href: url, target: '_blank', rel: 'noopener noreferrer', class: style['richText_link'] }, children);
}

function withCaret(children: VNodeChild[], caret: boolean) {
  return caret ? [...children, renderCaret()] : children;
}

function renderCaret() {
  return h('span', { class: style['richText_caret'], 'aria-hidden': 'true' });
}

function carriesCaret(node: RootContent) {
  return node.type === 'paragraph' || node.type === 'heading';
}

function collectDefinitions(tree: Root) {
  const found = new Map<string, Definition>();
  for (const node of tree.children) {
    if (node.type === 'definition') {
      found.set(node.identifier, node);
    }
  }
  return found;
}
</script>

<template>
  <div :class="$style.richText">
    <Content />
  </div>
</template>

<style lang="scss" module>
.richText {
  color: $color-ink;
  font-size: $font-size-body-l;
  line-height: $line-height-relaxed;
  overflow-wrap: anywhere;

  > :first-child {
    margin-top: 0;
  }

  > :last-child {
    margin-bottom: 0;
  }

  p,
  ul,
  ol,
  blockquote,
  pre,
  hr {
    margin: 0 0 $spacing-12;
  }

  ul,
  ol {
    padding-left: $spacing-24;
  }

  li + li {
    margin-top: $spacing-06;
  }

  li::marker {
    color: $color-ink-muted;
  }

  strong {
    font-weight: $font-weight-semibold;
  }

  blockquote {
    padding-left: $spacing-14;
    border-left: 3px solid $color-border-strong;
    color: $color-ink-body;
  }

  hr {
    border: 0;
    border-top: 1px solid $color-border;
  }

  table {
    border-collapse: collapse;
    font-size: $font-size-body;
  }

  th,
  td {
    padding: $spacing-06 $spacing-10;
    border: 1px solid $color-border;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: $color-surface-soft;
    font-weight: $font-weight-semibold;
  }
}

.richText_heading1,
.richText_heading2,
.richText_heading3 {
  margin: $spacing-18 0 $spacing-10;
  color: $color-ink;
  @include font-heading;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
}

.richText_heading1 {
  font-size: $font-size-heading;
}

.richText_heading2 {
  font-size: $font-size-lead;
}

.richText_heading3 {
  font-size: $font-size-body-l;
}

.richText_link {
  color: $color-link-ink;
  text-decoration: underline;
  text-underline-offset: 2px;

  @include focus-ring;
}

.richText_inlineCode,
.richText_code {
  font-family: $font-family-mono;
  font-size: $font-size-body-s;
}

.richText_inlineCode {
  padding: 0 $spacing-04;
  border-radius: $spacing-04;
  background: $color-surface-soft;
}

.richText_code {
  padding: $spacing-14 $spacing-16;
  border-radius: $radius-m;
  background: $color-surface-soft;
  line-height: $line-height-code;
  // Long lines wrap rather than scroll: nobody has to find a sideways scrollbar to read them.
  white-space: pre-wrap;
}

.richText_tableScroll {
  margin: 0 0 $spacing-12;
  overflow-x: auto;

  @include focus-ring;
}

.richText_caret {
  display: inline-block;
  width: 0.5em;
  height: 1.1em;
  margin-left: $spacing-02;
  border-radius: $spacing-02;
  background: $color-brand-1;
  vertical-align: text-bottom;
  animation: rich-text-caret 1s steps(1) infinite;

  @include reduced-motion {
    animation: none;
  }
}

@keyframes rich-text-caret {
  50% {
    opacity: 0;
  }
}
</style>
