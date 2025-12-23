import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Bot, Database } from "lucide-react";
import { memo } from "react";
import type { CustomNode } from "@/types/flow";
import OccupancyBadge from "@/components/ui/OccupancyBadge";
import { useNodeOccupancy } from "@/hooks/useOccupancyContext";

function AgentNode({ id, data, selected }: NodeProps<CustomNode>) {
	const occupancyCount = useNodeOccupancy(id);
	const hasInstructions = Boolean(data.agent_instructions);
	const knowledgeBaseIds = (data.agent_knowledge_base_ids as string[]) || [];

	return (
		<div
			className={`
        relative min-w-[220px] max-w-[400px] rounded-lg shadow-md bg-white border-2
        ${selected ? "border-purple-500" : "border-gray-200"}
      `}
		>
			<OccupancyBadge count={occupancyCount} />
			<Handle
				type="target"
				position={Position.Top}
				className="w-3 h-3 bg-purple-500 border-2 border-white"
			/>

			<div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border-b border-gray-200 rounded-t-lg">
				<Bot className="w-4 h-4 text-purple-600" />
				<span className="font-medium text-sm text-purple-800">
					{(data.label as string) || "Agente IA"}
				</span>
			</div>

			{/* Instructions preview */}
			{hasInstructions ? (
				<div className="px-3 py-2 border-b border-gray-100">
					<p className="text-xs text-gray-600 whitespace-pre-wrap break-words">
						{data.agent_instructions as string}
					</p>
				</div>
			) : (
				<div className="px-3 py-2 border-b border-gray-100">
					<p className="text-xs text-gray-400 italic">
						Configure as instruções do agente
					</p>
				</div>
			)}

			{/* Configuration summary */}
			{knowledgeBaseIds.length > 0 && (
				<div className="px-3 py-2">
					<div className="flex items-center gap-2 text-xs">
						<Database className="w-3 h-3 text-purple-500" />
						<span className="text-purple-700">
							{knowledgeBaseIds.length} base{knowledgeBaseIds.length !== 1 ? "s" : ""} conectada{knowledgeBaseIds.length !== 1 ? "s" : ""}
						</span>
					</div>
				</div>
			)}

			{/* Default output handle */}
			<div className="px-3 py-1.5 border-t border-gray-100 flex items-center justify-between">
				<span className="text-xs text-gray-500">Saída</span>
				<Handle
					type="source"
					position={Position.Bottom}
					id="default"
					className="w-3 h-3 bg-purple-300 border-2 border-white !relative !transform-none !inset-auto"
				/>
			</div>
		</div>
	);
}

export default memo(AgentNode);
