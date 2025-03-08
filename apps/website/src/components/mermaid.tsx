import Mermaid from '@theme/Mermaid';

interface MermaidProps {
  children: string;
}

export default function MermaidDiagram({ children }: MermaidProps) {
  return <Mermaid value={children} />;
}
