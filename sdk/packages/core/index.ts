export * from "./aim";
export * from "./runtime";
export * from "./types";
export * from "@markdoc/markdoc";

import { html } from "./markdoc/renderers/html";
import { react, reactStatic } from "./markdoc/renderers/react";
import { text } from "./markdoc/renderers/text";

export const renderers = {
	html: html,
	react: react,
	reactStatic: reactStatic,
	text: text,
} as const;
