import MarkdownIt from 'markdown-it';

/**
 * The bundle's markdown renderer, installed by the Provider through upstream's `MarkdownContext`:
 * Linear writes an issue's description and its comments in Markdown, and the basic body `Text`
 * renders through whatever renderer its context holds.
 *
 * It renders exactly the subset the basic `Text` promises — "simple Markdown formatting (i.e.
 * without HTML, images, or links)" (task-7.3 decision 13): raw HTML is escaped, a link renders
 * as its text, an image as its alt text. With HTML off, every tag in the output is markdown-it's
 * own and no link or image attribute survives, so nothing a vendor string carries reaches the page
 * as markup.
 */
const md = new MarkdownIt({html: false, linkify: false, typographer: false});

md.renderer.rules.link_open = () => '';
md.renderer.rules.link_close = () => '';
md.renderer.rules.image = (tokens, idx, options, env, self) =>
  md.utils.escapeHtml(self.renderInlineAsText(tokens[idx].children ?? [], options, env));

export function renderMarkdown(markdown: string): Promise<string> {
  return Promise.resolve(md.render(markdown));
}
