import { VDomModel } from '@jupyterlab/apputils';

import { KernelMessage } from '@jupyterlab/services';

import { escapeComments } from './utils';

export class BytecodeModel extends VDomModel {
  constructor() {
    super();
  }

  public formatKernelMessage(fileContent: string): string {
    const escapedContent = escapeComments(fileContent);
    const code = ['import dis', `dis.dis("""${escapedContent}""")`].join('\n');
    return code;
  }

  public handleKernelMessage = (msg: KernelMessage.IIOPubMessage) => {
    const msgType = msg.header.msg_type;
    switch (msgType) {
      case 'stream':
        this._output = msg.content.text + '\n';
        this._error = '';
        this.notify();
        break;
      case 'error':
        console.error(msg.content);
        this._error = msg.content.evalue as string;
        this.notify();
        break;
      default:
        break;
    }
  };

  public notify(): void {
    this.stateChanged.emit(void 0);
  }

  get output(): string {
    return this._output;
  }

  get error(): string {
    return this._error;
  }

  get isLight(): boolean {
    return this._isLight;
  }

  set isLight(value: boolean) {
    this._isLight = value;
  }

  get selectedLines(): Set<number> {
    return this._selectedLines;
  }

  set selectedLines(lines: Set<number>) {
    this._selectedLines = lines;
    this.notify();
  }

  private _output: string = '';
  private _error: string = '';
  private _isLight: boolean = true;
  private _selectedLines: Set<number>;
}
