import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Bot } from "lucide-react";
import { memo } from "react";
import type { CustomNode } from "@/types/flow";
import OccupancyBadge from "@/components/ui/OccupancyBadge";
import { useNodeOccupancy } from "@/hooks/useOccupancyContext";

function AgentNode({ id, data, selected }: NodeProps<CustomNode>) {
	const occupancyCount = useNodeOccupancy(id);
	const model = (data.agent_model as string) || "gpt-4o";
	const hasInstructions = Boolean(data.agent_instructions);
	const maxTurns = data.agent_max_turns as number | undefined;
	const exitKeywords = (data.agent_exit_keywords as string[]) || [];

	return (
		<div
			className={`
        relative min-w-[220px] max-w-[300px] rounded-lg shadow-md bg-white border-2
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

			{/* Model indicator */}
			<div className="px-3 py-2 border-b border-gray-100">
				<div className="flex items-center gap-2">
					<span className="text-xs text-gray-500">Modelo:</span>
					<span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
						{model}
					</span>
				</div>
			</div>

			{/* Instructions preview */}
			{hasInstructions ? (
				<div className="px-3 py-2 border-b border-gray-100">
					<p className="text-xs text-gray-600 line-clamp-3">
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
			<div className="px-3 py-2 space-y-1">
				{maxTurns && (
					<div className="flex items-center gap-2 text-xs">
						<span className="text-gray-500">Máx. turnos:</span>
						<span className="text-purple-700">{maxTurns}</span>
					</div>
				)}
				{exitKeywords.length > 0 && (
					<div className="flex items-center gap-2 text-xs">
						<span className="text-gray-500">Palavras de saída:</span>
						<span className="text-purple-700 truncate">
							{exitKeywords.slice(0, 3).join(", ")}
							{exitKeywords.length > 3 && "..."}
						</span>
					</div>
				)}
			</div>

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
