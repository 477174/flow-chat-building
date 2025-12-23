import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Brain } from "lucide-react";
import { memo } from "react";
import type { CustomNode, SemanticCondition } from "@/types/flow";
import OccupancyBadge from "@/components/ui/OccupancyBadge";
import { useNodeOccupancy } from "@/hooks/useOccupancyContext";

function SemanticConditionsNode({ id, data, selected }: NodeProps<CustomNode>) {
	const conditions = (data.semantic_conditions as SemanticCondition[] | undefined) ?? [];
	const occupancyCount = useNodeOccupancy(id);

	return (
		<div
			className={`
        relative min-w-[220px] max-w-[300px] rounded-lg shadow-md bg-white border-2
        ${selected ? "border-cyan-500" : "border-gray-200"}
      `}
		>
			<OccupancyBadge count={occupancyCount} />
			<Handle
				type="target"
				position={Position.Top}
				className="w-3 h-3 bg-cyan-500 border-2 border-white"
			/>

			<div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 border-b border-gray-200 rounded-t-lg">
				<Brain className="w-4 h-4 text-cyan-600" />
				<span className="font-medium text-sm text-cyan-800">
					{(data.label as string) || "Condições Semânticas"}
				</span>
			</div>

			{/* Optional prompt/message content */}
			{data.content && (
				<div className="px-3 py-2 border-b border-gray-100">
					<p className="text-xs text-gray-600 line-clamp-2">
						{data.content as string}
					</p>
				</div>
			)}

			<div className="p-2 space-y-1">
				{conditions.length > 0 ? (
					conditions.map((condition: SemanticCondition) => (
						<div
							key={condition.id}
							className="relative flex items-start px-3 py-2 bg-cyan-50 border border-cyan-200 rounded text-xs"
						>
							<span
								className="block w-full pr-4 text-cyan-700 whitespace-normal break-words"
							>
								{condition.prompt}
							</span>
							<Handle
								type="source"
								position={Position.Right}
								id={condition.id}
								className="!absolute !right-0 !top-1/2 !-translate-y-1/2 !translate-x-1/2 !w-2.5 !h-2.5 !bg-cyan-500 !border-2 !border-white"
							/>
						</div>
					))
				) : (
					<p className="text-xs text-gray-400 text-center py-1">
						Nenhuma condição semântica
					</p>
				)}
			</div>

			<div className="px-3 py-1.5 border-t border-gray-100 flex items-center justify-between">
				<span className="text-xs text-gray-500">Padrão</span>
				<Handle
					type="source"
					position={Position.Bottom}
					id="default"
					className="w-3 h-3 bg-cyan-300 border-2 border-white !relative !transform-none !inset-auto"
				/>
			</div>
		</div>
	);
}

export default memo(SemanticConditionsNode);
