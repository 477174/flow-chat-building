import StartNode from './StartNode'
import EndNode from './EndNode'
import MessageNode from './MessageNode'
import ButtonNode from './ButtonNode'
import OptionListNode from './OptionListNode'
import WaitResponseNode from './WaitResponseNode'
import ConditionalNode from './ConditionalNode'

export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  message: MessageNode,
  button: ButtonNode,
  option_list: OptionListNode,
  wait_response: WaitResponseNode,
  conditional: ConditionalNode,
}

export {
  StartNode,
  EndNode,
  MessageNode,
  ButtonNode,
  OptionListNode,
  WaitResponseNode,
  ConditionalNode,
}
