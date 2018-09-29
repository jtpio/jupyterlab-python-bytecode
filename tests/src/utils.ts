import { KernelMessage } from '@jupyterlab/services';

export const KERNEL_CONTENT = `
1           0 LOAD_NAME                0 (print)
            2 LOAD_CONST               0 (42)
            4 CALL_FUNCTION            1
            6 RETURN_VALUE
`;

export const KERNEL_ERROR = 'unexpected EOF while parsing (<dis>, line 1)';

export function createKernelContentMessage(
  content: string,
): KernelMessage.IIOPubMessage {
  return {
    channel: 'iopub',
    parent_header: {},
    metadata: {},
    header: {
      msg_type: 'stream',
    } as KernelMessage.IHeader,
    content: {
      text: content,
    },
  };
}

export function createKernelErrorMessage(
  error: string,
): KernelMessage.IIOPubMessage {
  return {
    channel: 'iopub',
    parent_header: {},
    metadata: {},
    header: {
      msg_type: 'error',
    } as KernelMessage.IHeader,
    content: {
      evalue: error,
    },
  };
}
