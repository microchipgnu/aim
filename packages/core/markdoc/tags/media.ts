import {
  type Config,
  type Node,
  type RenderableTreeNodes,
  type Schema,
  Tag,
} from '@markdoc/markdoc';
import { GLOBAL_SCOPE } from '../../aim';
import type { StateManager } from '../../runtime/state';

export const mediaTag: Schema = {
  render: 'media',
  selfClosing: true,
  attributes: {
    src: { type: String, required: true },
    type: { type: String, required: false },
    description: { type: String, required: false },
    id: { type: String, required: false },
  },
  transform(node, config) {
    return new Tag(
      'media',
      node.transformAttributes(config),
      node.transformChildren(config),
    );
  },
};

export async function* media(
  node: Node,
  config: Config,
  stateManager: StateManager,
): AsyncGenerator<RenderableTreeNodes> {
  const runtimeState = stateManager.getRuntimeState();
  const signal = runtimeState.options.signals.abort;

  const attrs = node.transformAttributes(config);

  const mediaTag = new Tag('media');

  // Check abort signal before processing
  if (signal.aborted) {
    throw new Error('Media loading aborted');
  }

  const src = attrs.src;
  let type = attrs.type;
  const description = attrs.description;
  const id = attrs.id || 'media';

  // Validate src
  if (
    !src.startsWith('file://') &&
    !src.startsWith('http://') &&
    !src.startsWith('https://')
  ) {
    throw new Error('Source must start with file://, http://, or https://');
  }

  // Determine type from src extension if not provided
  if (!type) {
    const fileExtension = src.split('.').pop()?.toLowerCase();
    switch (fileExtension) {
      case 'jpg':
      case 'jpeg':
        type = 'image/jpeg';
        break;
      case 'png':
        type = 'image/png';
        break;
      case 'gif':
        type = 'image/gif';
        break;
      case 'mp4':
        type = 'video/mp4';
        break;
      case 'mp3':
        type = 'audio/mpeg';
        break;
      case 'wav':
        type = 'audio/wav';
        break;
      case 'pdf':
        type = 'application/pdf';
        break;
      default:
        type = 'application/octet-stream';
    }
  }

  // Check abort signal before loading media
  if (signal.aborted) {
    throw new Error('Media loading aborted');
  }

  // TODO: Implement actual media loading logic here
  const mediaContent = {
    src,
    type,
    description,
    content: null, // This would be the actual loaded media content
  };

  stateManager.pushStack({
    id,
    scope: GLOBAL_SCOPE,
    variables: {
      src,
      type,
      description,
      content: mediaContent,
    },
  });

  mediaTag.children = [JSON.stringify(mediaContent)];

  yield mediaTag;
}
