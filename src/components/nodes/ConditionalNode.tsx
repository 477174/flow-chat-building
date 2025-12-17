import { Handle, type NodeProps, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { memo } from "react";
import type { CustomNode, FlowCondition } from "@/types/flow";
import { useFlowStore } from "@/stores/flowStore";

function getOperatorLabel(operator: string): string {
	switch (operator) {
		case "equals":
			return "igual a";
		case "not_equals":
			return "diferente de";
		case "contains":
			return "contém";
		case "not_contains":
			return "não contém";
		case "starts_with":
			return "começa com";
		case "ends_with":
			return "termina com";
		case "exists":
			return "existe";
		case "not_exists":
			return "não existe";
		case "regex":
			return "regex";
		default:
			return operator;
	}
}

function ConditionalNode({ data, selected }: NodeProps<CustomNode>) {
	const conditions = (data.conditions as FlowCondition[] | undefined) ?? [];
	const nodes = useFlowStore((state) => state.nodes);

	// Look up variable label from nodes if not stored in condition
	const getVariableLabel = (condition: FlowCondition): string => {
		if (condition.variableLabel) return condition.variableLabel;
		// Variable name is the source node ID, look up its label
		const sourceNode = nodes.find((n) => n.id === condition.variable);
		return sourceNode?.data.label ?? condition.variable;
	};

	return (
		<div
			className={`
        min-w-[220px] max-w-[300px] rounded-lg shadow-md bg-white border-2
        ${selected ? "border-teal-500" : "border-gray-200"}
      `}
		>
			<Handle
				type="target"
				position={Position.Top}
				className="w-3 h-3 bg-teal-500 border-2 border-white"
			/>

			<div className="flex items-center gap-2 px-3 py-2 bg-teal-50 border-b border-gray-200 rounded-t-lg">
				<GitBranch className="w-4 h-4 text-teal-600" />
				<span className="font-medium text-sm text-teal-800">
					{(data.label as string) || "Condição"}
				</span>
			</div>

			<div className="p-2 space-y-1 overflow-hidden">
				{conditions.length > 0 ? (
					conditions.map((condition: FlowCondition) => (
						<div
							key={condition.id}
							className="relative flex items-center px-3 py-1.5 bg-teal-50 border border-teal-200 rounded text-xs"
						>
							<span
								className="font-mono truncate block w-full pr-2"
								title={`${getVariableLabel(condition)} ${getOperatorLabel(condition.operator)} ${condition.value ?? ""}`}
							>
								<span className="text-blue-600 font-medium">{getVariableLabel(condition)}</span>
								{" "}
								<span className="text-teal-600">{getOperatorLabel(condition.operator)}</span>
								{" "}
								<span className="text-purple-600 font-medium">{condition.value ?? ""}</span>
							</span>
							<Handle
								type="source"
								position={Position.Right}
								id={condition.id}
								className="!absolute !right-0 !top-1/2 !-translate-y-1/2 !translate-x-1/2 !w-2.5 !h-2.5 !bg-teal-500 !border-2 !border-white"
							/>
						</div>
					))
				) : (
					<p className="text-xs text-gray-400 text-center py-1">
						Nenhuma condição adicionada
					</p>
				)}
			</div>

			<div className="px-3 py-1.5 border-t border-gray-100 flex items-center justify-between">
				<span className="text-xs text-gray-500">Padrão</span>
				<Handle
					type="source"
					position={Position.Bottom}
					id="default"
					className="w-3 h-3 bg-teal-300 border-2 border-white !relative !transform-none !inset-auto"
				/>
			</div>
		</div>
	);
}

export default memo(ConditionalNode);
